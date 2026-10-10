import * as THREE from "three"

// Corner fillet builder: takes an array of 2D/3D waypoints and returns a smooth CurvePath with rounded corners
export function createSmoothFilletedCurve(waypoints, filletRadius = 0.2) {
  const curvePath = new THREE.CurvePath()
  if (waypoints.length < 2) return curvePath
  if (waypoints.length === 2) {
    curvePath.add(new THREE.LineCurve3(waypoints[0], waypoints[1]))
    return curvePath
  }

  let currentStart = waypoints[0].clone()

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1]
    const curr = waypoints[i]
    const next = waypoints[i + 1]

    const vIn = new THREE.Vector3().subVectors(curr, prev)
    const vOut = new THREE.Vector3().subVectors(next, curr)

    const lenIn = vIn.length()
    const lenOut = vOut.length()

    // Fillet radius cannot exceed half of either adjacent segment
    const maxR = Math.min(lenIn * 0.45, lenOut * 0.45, filletRadius)

    if (maxR < 0.01) {
      // Degenerate / very short segment: straight line
      curvePath.add(new THREE.LineCurve3(currentStart, curr))
      currentStart = curr.clone()
      continue
    }

    const dirIn = vIn.clone().normalize()
    const dirOut = vOut.clone().normalize()

    // Corner start (before the bend)
    const cornerStart = new THREE.Vector3()
      .copy(curr)
      .sub(dirIn.clone().multiplyScalar(maxR))
    // Corner end (after the bend)
    const cornerEnd = new THREE.Vector3()
      .copy(curr)
      .add(dirOut.clone().multiplyScalar(maxR))

    // Straight segment up to the start of the fillet
    if (currentStart.distanceTo(cornerStart) > 0.005) {
      curvePath.add(new THREE.LineCurve3(currentStart, cornerStart))
    }

    // Smooth rounded corner (Quadratic Bezier with control point at the corner vertex)
    curvePath.add(new THREE.QuadraticBezierCurve3(cornerStart, curr, cornerEnd))

    currentStart = cornerEnd.clone()
  }

  // Final straight segment to destination
  const last = waypoints[waypoints.length - 1]
  if (currentStart.distanceTo(last) > 0.005) {
    curvePath.add(new THREE.LineCurve3(currentStart, last))
  }

  return curvePath
}

// Build 3D ribbon geometry for a smooth copper trace
export function buildTraceRibbonGeometry(
  curve,
  width = 0.05,
  height = 0.014,
  yBase = 0.012,
  segments = 60,
) {
  const points = curve.getSpacedPoints(segments)
  const vertexCount = points.length * 4
  const positions = []
  const normals = []
  const uvs = []
  const indices = []

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const u = i / (points.length - 1)
    const tangent = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)))

    // 2D normal perpendicular to tangent in X-Z plane
    const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

    const halfW = width * 0.5
    const pL_top = new THREE.Vector3(
      p.x + norm.x * halfW,
      yBase + height,
      p.z + norm.z * halfW,
    )
    const pR_top = new THREE.Vector3(
      p.x - norm.x * halfW,
      yBase + height,
      p.z - norm.z * halfW,
    )
    const pL_bot = new THREE.Vector3(
      p.x + norm.x * halfW,
      yBase,
      p.z + norm.z * halfW,
    )
    const pR_bot = new THREE.Vector3(
      p.x - norm.x * halfW,
      yBase,
      p.z - norm.z * halfW,
    )

    // Indices: 4 vertices per slice [i*4, i*4+1, i*4+2, i*4+3]
    // 0: pL_top, 1: pR_top, 2: pL_bot, 3: pR_bot
    positions.push(pL_top.x, pL_top.y, pL_top.z)
    positions.push(pR_top.x, pR_top.y, pR_top.z)
    positions.push(pL_bot.x, pL_bot.y, pL_bot.z)
    positions.push(pR_bot.x, pR_bot.y, pR_bot.z)

    normals.push(0, 1, 0, 0, 1, 0, norm.x, 0, norm.z, -norm.x, 0, -norm.z)
    uvs.push(0, u, 1, u, 0, u, 1, u)

    if (i < points.length - 1) {
      const c = i * 4
      const n = (i + 1) * 4
      // Top face
      indices.push(c + 0, n + 0, n + 1)
      indices.push(c + 0, n + 1, c + 1)
      // Left side wall
      indices.push(c + 2, n + 2, n + 0)
      indices.push(c + 2, n + 0, c + 0)
      // Right side wall
      indices.push(c + 1, n + 1, n + 3)
      indices.push(c + 1, n + 3, c + 3)
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geom.setIndex(indices)
  return geom
}

// Test with a sample track
const testPts = [
  new THREE.Vector3(2.3, 0.012, 0.5),
  new THREE.Vector3(3.3, 0.012, 0.5),
  new THREE.Vector3(3.9, 0.012, 1.2),
  new THREE.Vector3(4.6, 0.012, 1.2),
]

const curve = createSmoothFilletedCurve(testPts, 0.25)
console.log("Curve created with length:", curve.getLength().toFixed(3))
const geom = buildTraceRibbonGeometry(curve)
console.log(
  "Geometry vertices:",
  geom.attributes.position.count,
  "indices:",
  geom.index.count,
)

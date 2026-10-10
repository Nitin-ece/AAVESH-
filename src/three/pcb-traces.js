import * as THREE from "three"

// 1. Exact AAVESH Logo Shape matching reference image
export function createAaveshLogoShape() {
  // Vertices derived mathematically from the exact reference image:
  // Single continuous 8-point polygon with open delta and parallel slanted gap
  const pts = [
    new THREE.Vector2(0, 0.75), // P0: Top Apex
    new THREE.Vector2(0.838, -0.75), // P1: Bottom Right Outer
    new THREE.Vector2(0.535, -0.75), // P2: Bottom Right Inner
    new THREE.Vector2(0, 0.239), // P3: Inner Apex
    new THREE.Vector2(-0.419, -0.536), // P4: Inner Bottom-Left
    new THREE.Vector2(0.209, -0.536), // P5: Bar End Top
    new THREE.Vector2(0.325, -0.75), // P6: Bar End Bottom
    new THREE.Vector2(-0.838, -0.75), // P7: Bottom Left Outer
  ]

  return new THREE.Shape(pts)
}

// 2. Corner fillet builder: takes waypoints and produces a smooth CurvePath with rounded fillet corners
export function createSmoothFilletedCurve(waypoints, filletRadius = 0.22) {
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

    // Fillet radius cannot exceed 45% of either adjacent segment
    const maxR = Math.min(lenIn * 0.45, lenOut * 0.45, filletRadius)

    if (maxR < 0.015) {
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

    // Straight segment leading up to the fillet
    if (currentStart.distanceTo(cornerStart) > 0.005) {
      curvePath.add(new THREE.LineCurve3(currentStart, cornerStart))
    }

    // Smooth rounded corner (Quadratic Bezier tangent-continuous to incoming and outgoing lines)
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

// 3. Extruded 3D Ribbon geometry for smooth rounded copper traces
export function buildTraceRibbonGeometry(
  curve,
  width = 0.052,
  height = 0.014,
  yBase = 0.012,
  minSegments = 32,
) {
  const curveLength = curve.getLength()
  const segments = Math.max(minSegments, Math.floor(curveLength * 28))
  const points = curve.getSpacedPoints(segments)

  const positions = []
  const normals = []
  const uvs = []
  const indices = []

  const halfW = width * 0.5

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const u = i / (points.length - 1)
    const tangent = curve.getTangentAt(Math.min(0.9999, Math.max(0.0001, u)))

    // 2D perpendicular normal in the horizontal X-Z plane
    const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

    // 4 vertices per slice: top-left, top-right, bottom-left, bottom-right
    positions.push(p.x + norm.x * halfW, yBase + height, p.z + norm.z * halfW)
    positions.push(p.x - norm.x * halfW, yBase + height, p.z - norm.z * halfW)
    positions.push(p.x + norm.x * halfW, yBase, p.z + norm.z * halfW)
    positions.push(p.x - norm.x * halfW, yBase, p.z - norm.z * halfW)

    normals.push(0, 1, 0, 0, 1, 0, norm.x, 0, norm.z, -norm.x, 0, -norm.z)
    uvs.push(0, u, 1, u, 0, u, 1, u)

    if (i < points.length - 1) {
      const c = i * 4
      const n = (i + 1) * 4
      // Top horizontal copper face
      indices.push(c + 0, n + 0, n + 1)
      indices.push(c + 0, n + 1, c + 1)
      // Left vertical bevel wall
      indices.push(c + 2, n + 2, n + 0)
      indices.push(c + 2, n + 0, c + 0)
      // Right vertical bevel wall
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

// 4. Laser Streak Pulse: dynamic ribbon that samples the curve and BENDS around corners
export const LASER_SLICES = 12

export function createLaserPulseMesh(
  curve,
  baseColorHex = 0x00f0ff,
  speed = 0.4,
) {
  const slices = LASER_SLICES
  const vertexCount = slices * 2
  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 3)
  const indices = []

  const baseCol = new THREE.Color(baseColorHex)
  const headCol = new THREE.Color(0xffffff) // Bright white core at laser head

  for (let i = 0; i < slices; i++) {
    const t = i / (slices - 1) // 0 = tail, 1 = head
    const c = new THREE.Color().lerpColors(baseCol, headCol, Math.pow(t, 1.8))

    // Tail dimming
    const brightness = Math.max(0.05, Math.pow(t, 1.2))
    c.multiplyScalar(brightness)

    // Left vertex
    colors[i * 6 + 0] = c.r
    colors[i * 6 + 1] = c.g
    colors[i * 6 + 2] = c.b

    // Right vertex
    colors[i * 6 + 3] = c.r
    colors[i * 6 + 4] = c.g
    colors[i * 6 + 5] = c.b

    if (i < slices - 1) {
      const cIdx = i * 2
      const nIdx = (i + 1) * 2
      indices.push(cIdx + 0, nIdx + 0, nIdx + 1)
      indices.push(cIdx + 0, nIdx + 1, cIdx + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  const posAttr = new THREE.BufferAttribute(positions, 3)
  posAttr.setUsage(THREE.DynamicDrawUsage)
  const colorAttr = new THREE.BufferAttribute(colors, 3)

  geometry.setAttribute("position", posAttr)
  geometry.setAttribute("color", colorAttr)
  geometry.setIndex(indices)

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = "Laser_Pulse_Streak"

  return {
    mesh,
    geometry,
    posAttr,
    colorAttr,
    curve,
    curveLength: curve.getLength(),
    progress: Math.random(),
    speed,
    laserLength: 0.24, // Sleek, tiny laser line packet (not a long bar)
    baseWidth: 0.056,
  }
}

// Update laser streak along curve: bends and rotates continuously without stretching end-to-end
export function updateLaserPulse(pulse, delta, speedMultiplier = 1.0) {
  // Advance along curve
  const speed =
    (pulse.speed / Math.max(1.2, pulse.curveLength)) * speedMultiplier
  const uSpan = Math.min(0.18, pulse.laserLength / pulse.curveLength)
  const totalCycle = 1.0 + uSpan * 2.0

  pulse.progress += delta * speed
  if (pulse.progress >= totalCycle) {
    pulse.progress -= totalCycle
  }

  // Head emerges at 0, tail follows. Never wraps slices across 0->1 boundary!
  const uHead = pulse.progress - uSpan
  const uTail = uHead - uSpan

  const slices = LASER_SLICES
  const positions = pulse.posAttr.array
  const colors = pulse.colorAttr.array
  const halfW = pulse.baseWidth * 0.5
  const yLaser = 0.03 // Elevated cleanly above copper surface to prevent z-fighting

  for (let i = 0; i < slices; i++) {
    const t = i / (slices - 1) // 0 = tail, 1 = head
    const rawU = uTail + t * uSpan
    // Strictly monotonic along curve
    const u = THREE.MathUtils.clamp(rawU, 0.0002, 0.9998)

    const pt = pulse.curve.getPointAt(u)
    const tan = pulse.curve.getTangentAt(u)
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize()

    // Pulse visibility: smooth fade-in as it emerges from pin, fade-out as it enters via
    let fade = 1.0
    if (rawU < 0.0) {
      fade = Math.max(0.0, 1.0 + rawU / (uSpan * 0.8))
    } else if (rawU > 1.0) {
      fade = Math.max(0.0, 1.0 - (rawU - 1.0) / (uSpan * 0.8))
    } else if (rawU < 0.08) {
      fade = rawU / 0.08
    } else if (rawU > 0.92) {
      fade = (1.0 - rawU) / 0.08
    }

    // Tapered laser width
    const sliceWidth = halfW * (0.4 + 0.6 * t) * fade

    // Position vertices
    positions[i * 6 + 0] = pt.x + norm.x * sliceWidth
    positions[i * 6 + 1] = yLaser
    positions[i * 6 + 2] = pt.z + norm.z * sliceWidth

    positions[i * 6 + 3] = pt.x - norm.x * sliceWidth
    positions[i * 6 + 4] = yLaser
    positions[i * 6 + 5] = pt.z - norm.z * sliceWidth

    // Softened, subtle electrical pulse brightness
    const headIntensity = (0.12 + 0.35 * Math.pow(t, 1.6)) * fade
    colors[i * 6 + 0] = headIntensity
    colors[i * 6 + 1] = Math.min(0.65, headIntensity * 1.05)
    colors[i * 6 + 2] = 0.55 * fade

    colors[i * 6 + 3] = headIntensity
    colors[i * 6 + 4] = Math.min(0.65, headIntensity * 1.05)
    colors[i * 6 + 5] = 0.55 * fade
  }

  pulse.posAttr.needsUpdate = true
  pulse.colorAttr.needsUpdate = true
}

// 5. Strictly Non-Crossing Planar PCB Trace Routes
export function getPCBTraceWaypoints() {
  const routes = []

  // East Bus (Pins 0..6 -> GPIO Header, 7..9 -> LEDs)
  for (let i = 0; i < 7; i++) {
    const zPin = -1.35 + i * 0.32
    const zEnd = -1.45 + i * 0.38
    routes.push({
      points: [
        new THREE.Vector3(2.1, 0.012, zPin),
        new THREE.Vector3(2.7, 0.012, zPin),
        new THREE.Vector3(3.2, 0.012, zPin),
        new THREE.Vector3(3.8, 0.012, zEnd),
        new THREE.Vector3(4.8, 0.012, zEnd),
      ],
      isGold: i % 2 === 0,
      speed: 0.65 + (i % 3) * 0.1,
    })
  }

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 0.89),
      new THREE.Vector3(2.7, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 3.1),
    ],
    isGold: true,
    speed: 0.7,
  })

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.21),
      new THREE.Vector3(2.7, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 3.1),
    ],
    isGold: true,
    speed: 0.75,
  })

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.53),
      new THREE.Vector3(2.7, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 3.1),
    ],
    isGold: true,
    speed: 0.8,
  })

  // West Bus (Flash & Decoupling capacitors)
  for (let i = 0; i < 4; i++) {
    const zPin = -1.35 + i * 0.3
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.7, 0.012, zPin),
        new THREE.Vector3(-3.4, 0.012, zPin),
        new THREE.Vector3(-4.2, 0.012, zPin),
      ],
      isGold: i % 2 === 0,
      speed: 0.72,
    })
  }

  for (let i = 4; i < 10; i++) {
    const zPin = -1.35 + i * 0.3
    const zOut = 0.2 + (i - 4) * 0.35
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.8, 0.012, zPin),
        new THREE.Vector3(-3.5, 0.012, zOut),
        new THREE.Vector3(-4.5, 0.012, zOut),
      ],
      isGold: i % 3 === 0,
      speed: 0.62 + (i % 3) * 0.1,
    })
  }

  // North Bus (USB-C & Crystal)
  for (let i = 0; i < 4; i++) {
    const xPin = -1.35 + i * 0.35
    const xUsb = -2.4 + i * 0.35
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, -2.7),
        new THREE.Vector3(xUsb, 0.012, -3.3),
        new THREE.Vector3(xUsb, 0.012, -3.9),
      ],
      isGold: i % 2 === 0,
      speed: 0.7,
    })
  }

  for (let i = 4; i < 8; i++) {
    const xPin = -1.35 + i * 0.35
    const zTurn = -3.15 + (i - 4) * 0.25
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, zTurn),
        new THREE.Vector3(4.2, 0.012, zTurn),
      ],
      isGold: true,
      speed: 0.78,
    })
  }

  // South Bus (LED D4 & Test Points)
  routes.push({
    points: [
      new THREE.Vector3(-1.35, 0.012, 2.1),
      new THREE.Vector3(-1.35, 0.012, 2.6),
      new THREE.Vector3(-1.8, 0.012, 3.0),
      new THREE.Vector3(-1.8, 0.012, 3.3),
    ],
    isGold: true,
    speed: 0.75,
  })

  for (let i = 1; i < 8; i++) {
    const xPin = -1.35 + i * 0.35
    const xEnd = -1.15 + (i - 1) * 0.4
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, 2.1),
        new THREE.Vector3(xPin, 0.012, 2.7),
        new THREE.Vector3(xEnd, 0.012, 3.2),
        new THREE.Vector3(xEnd, 0.012, 3.7),
      ],
      isGold: i % 2 === 0,
      speed: 0.65,
    })
  }

  return routes
}

// 6. Placement Data for Authentic SMD Electronics Components
export function getPCBComponents() {
  const components = []

  for (let i = 0; i < 7; i++) {
    const zPin = -1.35 + i * 0.32
    components.push({
      type: "resistor",
      x: 2.7,
      z: zPin,
      rot: 0,
      name: `R_EAST_${i + 1}`,
    })
  }
  for (let i = 0; i < 4; i++) {
    const zPin = -1.35 + i * 0.3
    components.push({
      type: "resistor",
      x: -2.7,
      z: zPin,
      rot: 0,
      name: `R_FLASH_${i + 1}`,
    })
  }

  components.push({
    type: "resistor",
    x: 3.8,
    z: 2.4,
    rot: Math.PI / 2,
    name: "R_LED_ACT",
  })
  components.push({
    type: "resistor",
    x: 4.3,
    z: 2.4,
    rot: Math.PI / 2,
    name: "R_LED_PWR",
  })
  components.push({
    type: "resistor",
    x: 4.8,
    z: 2.4,
    rot: Math.PI / 2,
    name: "R_LED_CLK",
  })
  components.push({
    type: "resistor",
    x: -1.8,
    z: 2.8,
    rot: Math.PI / 2,
    name: "R_LED_TX",
  })

  components.push({
    type: "capacitor",
    x: -1.85,
    z: -1.85,
    rot: Math.PI / 4,
    name: "C_DEC_NW",
  })
  components.push({
    type: "capacitor",
    x: 1.85,
    z: -1.85,
    rot: -Math.PI / 4,
    name: "C_DEC_NE",
  })
  components.push({
    type: "capacitor",
    x: -1.85,
    z: 1.85,
    rot: -Math.PI / 4,
    name: "C_DEC_SW",
  })
  components.push({
    type: "capacitor",
    x: 1.85,
    z: 1.85,
    rot: Math.PI / 4,
    name: "C_DEC_SE",
  })

  components.push({
    type: "capacitor",
    x: 2.85,
    z: -3.0,
    rot: 0,
    name: "C_LOAD_Y1A",
  })
  components.push({
    type: "capacitor",
    x: 3.45,
    z: -3.0,
    rot: 0,
    name: "C_LOAD_Y1B",
  })

  for (let i = 4; i < 8; i++) {
    const zOut = 0.2 + (i - 4) * 0.35
    components.push({
      type: "capacitor",
      x: -4.3,
      z: zOut,
      rot: 0,
      name: `C_FILT_${i - 3}`,
    })
  }

  components.push({
    type: "diode",
    x: -2.05,
    z: -3.3,
    rot: Math.PI / 2,
    name: "D_ESD_USB_DP",
  })
  components.push({
    type: "diode",
    x: -1.7,
    z: -3.3,
    rot: Math.PI / 2,
    name: "D_ESD_USB_DM",
  })
  components.push({
    type: "diode",
    x: -2.4,
    z: -3.3,
    rot: Math.PI / 2,
    name: "D_SCHOTTKY_VBUS",
  })
  components.push({
    type: "diode",
    x: 0.5,
    z: 3.2,
    rot: Math.PI / 2,
    name: "D_CLAMP_3V3",
  })

  return components
}

// 7. 3D Mesh Builders for Authentic SMD Components
export function createSMDResistorMesh() {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    roughness: 0.25,
    metalness: 0.2,
  })
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.98,
  })
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.16,
    metalness: 0.95,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.13), bodyMat)
  body.position.y = 0.04
  g.add(body)

  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.135), silverMat)
  e1.position.set(-0.11, 0.04, 0)
  const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.135), silverMat)
  e2.position.set(0.11, 0.04, 0)
  g.add(e1, e2)

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), padMat)
  pad1.position.set(-0.12, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), padMat)
  pad2.position.set(0.12, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

export function createSMDCapacitorMesh() {
  const g = new THREE.Group()
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x936138,
    roughness: 0.45,
    metalness: 0.1,
  })
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.98,
  })
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.16,
    metalness: 0.95,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.15), capMat)
  body.position.y = 0.065
  g.add(body)

  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.155), silverMat)
  e1.position.set(-0.12, 0.065, 0)
  const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.155), silverMat)
  e2.position.set(0.12, 0.065, 0)
  g.add(e1, e2)

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad1.position.set(-0.13, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad2.position.set(0.13, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

export function createSMDDiodeMesh() {
  const g = new THREE.Group()
  const diodeMat = new THREE.MeshStandardMaterial({
    color: 0x090d14,
    roughness: 0.35,
    metalness: 0.15,
  })
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.05,
  })
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.98,
  })
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.16,
    metalness: 0.95,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.16), diodeMat)
  body.position.y = 0.06
  g.add(body)

  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.125, 0.165),
    bandMat,
  )
  band.position.set(-0.1, 0.06, 0)
  g.add(band)

  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), silverMat)
  l1.position.set(-0.18, 0.02, 0)
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), silverMat)
  l2.position.set(0.18, 0.02, 0)
  g.add(l1, l2)

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad1.position.set(-0.18, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad2.position.set(0.18, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

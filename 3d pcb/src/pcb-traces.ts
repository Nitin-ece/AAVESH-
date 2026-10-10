import * as THREE from "three"

// 1. Exact AAVESH Logo Shape matching reference image
export function createAaveshLogoShape(): THREE.Shape {
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

  const shape = new THREE.Shape(pts)
  return shape
}

// 2. Corner fillet builder: takes waypoints and produces a smooth CurvePath with rounded fillet corners
export function createSmoothFilletedCurve(
  waypoints: THREE.Vector3[],
  filletRadius = 0.22,
): THREE.CurvePath<THREE.Vector3> {
  const curvePath = new THREE.CurvePath<THREE.Vector3>()
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
  curve: THREE.CurvePath<THREE.Vector3>,
  width = 0.052,
  height = 0.014,
  yBase = 0.012,
  minSegments = 32,
): THREE.BufferGeometry {
  const curveLength = curve.getLength()
  const segments = Math.max(minSegments, Math.floor(curveLength * 28))
  const points = curve.getSpacedPoints(segments)

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const halfW = width * 0.5

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const u = i / (points.length - 1)
    const tangent = curve.getTangentAt(Math.min(0.9999, Math.max(0.0001, u)))

    // 2D perpendicular normal in the horizontal X-Z plane
    const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

    // 4 vertices per slice: top-left, top-right, bottom-left, bottom-right
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

    positions.push(pL_top.x, pL_top.y, pL_top.z)
    positions.push(pR_top.x, pR_top.y, pR_top.z)
    positions.push(pL_bot.x, pL_bot.y, pL_bot.z)
    positions.push(pR_bot.x, pR_bot.y, pR_bot.z)

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

export interface LaserPulse {
  mesh: THREE.Mesh
  geometry: THREE.BufferGeometry
  posAttr: THREE.BufferAttribute
  colorAttr: THREE.BufferAttribute
  curve: THREE.CurvePath<THREE.Vector3>
  curveLength: number
  progress: number
  speed: number
  laserLength: number
  baseWidth: number
}

export function createLaserPulseMesh(
  curve: THREE.CurvePath<THREE.Vector3>,
  baseColorHex = 0x00f0ff,
  speed = 0.4,
): LaserPulse {
  const slices = LASER_SLICES
  const vertexCount = slices * 2
  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 3)
  const indices: number[] = []

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
    opacity: 0.95,
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
export function updateLaserPulse(
  pulse: LaserPulse,
  delta: number,
  speedMultiplier = 1.0,
) {
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
  const positions = pulse.posAttr.array as Float32Array
  const colors = pulse.colorAttr.array as Float32Array
  const halfW = pulse.baseWidth * 0.5
  const yLaser = 0.03 // Elevated cleanly above copper surface (0.026) to prevent z-fighting

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

    // Modulate brightness by fade factor
    const headIntensity = (0.3 + 0.7 * Math.pow(t, 1.6)) * fade
    colors[i * 6 + 0] = headIntensity
    colors[i * 6 + 1] = Math.min(1.0, headIntensity * 1.3)
    colors[i * 6 + 2] = 1.0 * fade

    colors[i * 6 + 3] = headIntensity
    colors[i * 6 + 4] = Math.min(1.0, headIntensity * 1.3)
    colors[i * 6 + 5] = 1.0 * fade
  }

  pulse.posAttr.needsUpdate = true
  pulse.colorAttr.needsUpdate = true
}

// 5. Strictly Non-Crossing Planar PCB Trace Routes (0 conflicts, strictly ordered parallel buses)
export function getPCBTraceWaypoints(): {
  points: THREE.Vector3[]
  isGold: boolean
  speed: number
}[] {
  const routes: { points: THREE.Vector3[] isGold: boolean speed: number }[] = []

  // ==========================================
  // 1. EAST BUS (Chip East pins: X=2.1, 10 pins)
  // Pins 0..6 -> GPIO Header (X=4.8)
  // Pins 7..9 -> LEDs D3 (4.8), D2 (4.3), D1 (3.8) at Z=3.1
  // ==========================================
  for (let i = 0; i < 7; i++) {
    const zPin = -1.35 + i * 0.32 // -1.35 to 0.57
    const zEnd = -1.45 + i * 0.38 // -1.45 to 0.83 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(2.1, 0.012, zPin),
        new THREE.Vector3(2.7, 0.012, zPin), // inline series resistor at X=2.8
        new THREE.Vector3(3.2, 0.012, zPin),
        new THREE.Vector3(3.8, 0.012, zEnd),
        new THREE.Vector3(4.8, 0.012, zEnd), // GPIO Header pin
      ],
      isGold: i % 2 === 0,
      speed: 0.65 + (i % 3) * 0.1,
    })
  }

  // Pins 7, 8, 9 nested concentric L-corners to LEDs D3, D2, D1 (strictly non-crossing!):
  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 0.89),
      new THREE.Vector3(2.7, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 3.1), // LED D3
    ],
    isGold: true,
    speed: 0.7,
  })

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.21),
      new THREE.Vector3(2.7, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 3.1), // LED D2
    ],
    isGold: true,
    speed: 0.75,
  })

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.53),
      new THREE.Vector3(2.7, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 3.1), // LED D1
    ],
    isGold: true,
    speed: 0.8,
  })

  // ==========================================
  // 2. WEST BUS (Chip West pins: X=-2.1, 10 pins)
  // Pins 0..3 -> SPI Flash U2 (X=-4.2, parallel lines)
  // Pins 4..9 -> Decoupling capacitors & power bus (X=-4.5)
  // ==========================================
  for (let i = 0; i < 4; i++) {
    const zPin = -1.35 + i * 0.3 // -1.35, -1.05, -0.75, -0.45
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.7, 0.012, zPin), // inline series resistor
        new THREE.Vector3(-3.4, 0.012, zPin),
        new THREE.Vector3(-4.2, 0.012, zPin), // Flash U2 pin solder pad
      ],
      isGold: i % 2 === 0,
      speed: 0.72,
    })
  }

  for (let i = 4; i < 10; i++) {
    const zPin = -1.35 + i * 0.3 // -0.15 to 1.35
    const zOut = 0.2 + (i - 4) * 0.35 // 0.20 to 1.95 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.8, 0.012, zPin), // inline resistor
        new THREE.Vector3(-3.5, 0.012, zOut),
        new THREE.Vector3(-4.5, 0.012, zOut), // decoupling capacitor pad
      ],
      isGold: i % 3 === 0,
      speed: 0.62 + (i % 3) * 0.1,
    })
  }

  // ==========================================
  // 3. NORTH BUS (Chip North pins: Z=-2.1, 8 pins)
  // Pins 0..3 (X < 0) -> USB-C port J1 (X=-2.5, Z=-4.3)
  // Pins 4..7 (X > 0) -> Crystal Y1 (X=3.5, Z=-2.4)
  // ==========================================
  for (let i = 0; i < 4; i++) {
    const xPin = -1.35 + i * 0.35 // -1.35 to -0.30
    const xUsb = -2.4 + i * 0.35 // -2.40 to -1.35 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, -2.7),
        new THREE.Vector3(xUsb, 0.012, -3.3), // inline USB diode / resistor
        new THREE.Vector3(xUsb, 0.012, -3.9), // USB-C receptacle pad
      ],
      isGold: i % 2 === 0,
      speed: 0.7,
    })
  }

  // Pins 4..7 (X > 0): Crystal lines (concentric non-crossing corners)
  for (let i = 4; i < 8; i++) {
    const xPin = -1.35 + i * 0.35 // 0.05, 0.40, 0.75, 1.10
    const zTurn = -3.15 + (i - 4) * 0.25 // -3.15, -2.90, -2.65, -2.40
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, zTurn),
        new THREE.Vector3(4.2, 0.012, zTurn), // crystal solder pads
      ],
      isGold: true,
      speed: 0.78,
    })
  }

  // ==========================================
  // 4. SOUTH BUS (Chip South pins: Z=+2.1, 8 pins)
  // Pin 0 -> LED D4 (X=-1.8, Z=3.3)
  // Pins 1..7 -> Test Points TP1..TP4 and Power rails
  // ==========================================
  routes.push({
    points: [
      new THREE.Vector3(-1.35, 0.012, 2.1),
      new THREE.Vector3(-1.35, 0.012, 2.6),
      new THREE.Vector3(-1.8, 0.012, 3.0),
      new THREE.Vector3(-1.8, 0.012, 3.3), // LED D4 pad
    ],
    isGold: true,
    speed: 0.75,
  })

  for (let i = 1; i < 8; i++) {
    const xPin = -1.35 + i * 0.35 // -1.00 to +1.10
    const xEnd = -1.15 + (i - 1) * 0.4 // -1.15 to +1.25 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, 2.1),
        new THREE.Vector3(xPin, 0.012, 2.7),
        new THREE.Vector3(xEnd, 0.012, 3.2), // inline component
        new THREE.Vector3(xEnd, 0.012, 3.7), // test point ring pad
      ],
      isGold: i % 2 === 0,
      speed: 0.65,
    })
  }

  return routes
}

// 6. Placement Data for Authentic SMD Electronics Components (Resistors, Capacitors, Diodes)
export interface PCBComponentDef {
  type: "resistor" | "capacitor" | "diode"
  x: number
  z: number
  rot: number
  name: string
}

export function getPCBComponents(): PCBComponentDef[] {
  const components: PCBComponentDef[] = []

  // --- 1. SMD RESISTORS (Inline series & pull-up networks) ---
  // East bus inline series damping resistors (7 lines)
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
  // West bus inline series resistors (4 Flash lines)
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
  // LED series current-limiting resistors
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

  // --- 2. SMD CERAMIC CAPACITORS (Decoupling & filtering MLCCs) ---
  // 4 IC Corner Decoupling Capacitors (Right next to IC corners with ground vias)
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

  // Crystal load capacitors (22pF to ground)
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

  // West bus power filtering capacitors (MLCC array connected to power lines)
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

  // --- 3. SMD DIODES (SOD-123 with Cathode Band) ---
  // USB ESD Protection Diodes (Clamping diodes on D+ and D-)
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

  // Schottky Reverse Polarity Protection Diode on 5V VBUS
  components.push({
    type: "diode",
    x: -2.4,
    z: -3.3,
    rot: Math.PI / 2,
    name: "D_SCHOTTKY_VBUS",
  })

  // Fast Recovery Clamping Diode on 3.3V Power Rail
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
export function createSMDResistorMesh(): THREE.Group {
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

  // Resistor ceramic body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.13), bodyMat)
  body.position.y = 0.04
  g.add(body)

  // Silver metal end terminations
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.135), silverMat)
  e1.position.set(-0.11, 0.04, 0)
  const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.135), silverMat)
  e2.position.set(0.11, 0.04, 0)
  g.add(e1, e2)

  // Solder pads on PCB underneath
  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), padMat)
  pad1.position.set(-0.12, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), padMat)
  pad2.position.set(0.12, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

export function createSMDCapacitorMesh(): THREE.Group {
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

  // MLCC ceramic body (tan/caramel)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.15), capMat)
  body.position.y = 0.065
  g.add(body)

  // Silver metal terminations
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.155), silverMat)
  e1.position.set(-0.12, 0.065, 0)
  const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.155), silverMat)
  e2.position.set(0.12, 0.065, 0)
  g.add(e1, e2)

  // Solder pads on PCB
  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad1.position.set(-0.13, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad2.position.set(0.13, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

export function createSMDDiodeMesh(): THREE.Group {
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

  // Diode package body (SOD-123)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.16), diodeMat)
  body.position.y = 0.06
  g.add(body)

  // Cathode polarity stripe (crisp white band across one end)
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.125, 0.165),
    bandMat,
  )
  band.position.set(-0.1, 0.06, 0)
  g.add(band)

  // Metallic flat solder leads
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), silverMat)
  l1.position.set(-0.18, 0.02, 0)
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), silverMat)
  l2.position.set(0.18, 0.02, 0)
  g.add(l1, l2)

  // Solder pads on PCB
  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad1.position.set(-0.18, 0.008, 0)
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.18), padMat)
  pad2.position.set(0.18, 0.008, 0)
  g.add(pad1, pad2)

  return g
}

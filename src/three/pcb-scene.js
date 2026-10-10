import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { sounds } from "./audio"
import {
  createAaveshLogoShape,
  createSmoothFilletedCurve,
  buildTraceRibbonGeometry,
  createLaserPulseMesh,
  updateLaserPulse,
  getPCBTraceWaypoints,
  getPCBComponents,
  createSMDResistorMesh,
  createSMDCapacitorMesh,
  createSMDDiodeMesh,
  LASER_SLICES,
} from "./pcb-traces"

export const THEME_CONFIGS = [
  {
    id: "cyan",
    name: "AAVESH Cyan",
    hex: 0x00f0ff,
    speed: 0.9,
    bloom: 0.04,
    desc: "SOC Core Nominal",
  },
  {
    id: "gold",
    name: "Obsidian Gold",
    hex: 0xfacc15,
    speed: 1.4,
    bloom: 0.05,
    desc: "Quantum Overdrive",
  },
  {
    id: "emerald",
    name: "Cyber Emerald",
    hex: 0x10b981,
    speed: 2.0,
    bloom: 0.04,
    desc: "Neural Acceleration",
  },
  {
    id: "crimson",
    name: "Crimson Surge",
    hex: 0xf43f5e,
    speed: 2.7,
    bloom: 0.06,
    desc: "Hyper-Clocked Matrix",
  },
  {
    id: "violet",
    name: "Ultra Violet",
    hex: 0xa855f7,
    speed: 1.2,
    bloom: 0.04,
    desc: "Phase Resonance",
  },
]

function createBoardSilkscreenTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1638
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // 1. Solder Mask: Deep rich navy/indigo matte substrate
  ctx.fillStyle = "#071526"
  ctx.fillRect(0, 0, 2048, 1638)

  // 2. Faint ground copper crosshatch flood
  ctx.strokeStyle = "rgba(202, 138, 4, 0.06)"
  ctx.lineWidth = 1.2
  for (let x = 0; x < 2048; x += 18) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 1638)
    ctx.stroke()
  }
  for (let y = 0; y < 1638; y += 18) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(2048, y)
    ctx.stroke()
  }

  // 3. Crisp white silkscreen perimeter borders
  ctx.strokeStyle = "rgba(248, 250, 252, 0.85)"
  ctx.lineWidth = 4
  ctx.strokeRect(50, 50, 1948, 1538)

  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"
  ctx.lineWidth = 1.5
  ctx.strokeRect(64, 64, 1920, 1510)

  // 4. Mounting hole rings & clearances
  const drawMountHole = (x, y) => {
    ctx.strokeStyle = "rgba(250, 204, 21, 0.9)"
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.arc(x, y, 52, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 70, 0, Math.PI * 2)
    ctx.stroke()
  }
  drawMountHole(120, 120)
  drawMountHole(1928, 120)
  drawMountHole(120, 1518)
  drawMountHole(1928, 1518)

  // 5. Clean U1 Chip Silkscreen Boundary & Pin 1 Indicator
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)"
  ctx.lineWidth = 3
  ctx.strokeRect(700, 495, 648, 648)

  // Pin 1 Mark for U1
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(670, 465, 12, 0, Math.PI * 2)
  ctx.fill()

  // Copper Vias (gold dots with dark center)
  const drawVia = (vx, vy) => {
    ctx.fillStyle = "#facc15"
    ctx.beginPath()
    ctx.arc(vx, vy, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#020408"
    ctx.beginPath()
    ctx.arc(vx, vy, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let x = 180; x < 1900; x += 80) {
    drawVia(x, 90)
    drawVia(x, 1550)
  }
  for (let y = 180; y < 1550; y += 80) {
    drawVia(90, y)
    drawVia(1960, y)
  }

  for (let i = 0; i < 8; i++) {
    drawVia(640 + i * 110, 430)
    drawVia(640 + i * 110, 1210)
    drawVia(640, 430 + i * 110)
    drawVia(1410, 430 + i * 110)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

export class PCBSceneEngine {
  constructor(container, options = {}) {
    this.container = container
    this.options = {
      bloomStrength: 0.02,
      bloomRadius: 0.04,
      pulseSpeed: 0.9,
      autoRotate: true,
      colorTheme: "cyan",
      themeIndex: 0,
      ...options,
    }

    this.onHoverChange = options.onHoverChange
    this.onThemeChange = options.onThemeChange
    this.onChipClick = options.onChipClick

    // Internal state
    this.baseRotateSpeed = 0.8
    this.targetRotateSpeed = 0.8
    this.currentRotateSpeed = 0.8
    this.lastScrollY = typeof window !== "undefined" ? window.scrollY : 0
    this.lastScrollTime = 0

    this.scene = new THREE.Scene()
    this.scene.background = null // transparent for blending seamlessly into Hero section background

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // Cinematic perspective camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    this.camera.position.set(6.2, 5.2, 7.8)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.95
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(this.renderer.domElement)

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxDistance = 22
    this.controls.minDistance = 3.5
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02
    this.controls.autoRotate = this.options.autoRotate
    this.controls.autoRotateSpeed = this.baseRotateSpeed
    this.controls.enableZoom = false // Preserves natural page scroll
    this.controls.target.set(0.1, 0.1, -0.2)
    this.controls.update()

    // Post-processing: UnrealBloomPass with subtle minimal glow
    const renderPass = new RenderPass(this.scene, this.camera)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.options.bloomStrength,
      this.options.bloomRadius,
      0.22,
    )
    const outputPass = new OutputPass()

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(renderPass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(outputPass)

    // Groups
    this.pcbGroup = new THREE.Group()
    this.pcbGroup.name = "PCB_System"
    this.scene.add(this.pcbGroup)

    this.chipGroup = new THREE.Group()
    this.chipGroup.name = "AIC_Chip"
    this.pcbGroup.add(this.chipGroup)

    this.laserPulses = []
    this.interactiveLeds = []
    this.logoMesh = null
    this.logoMaterial = null

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2(-100, -100)
    this.hoveredObject = null
    this.isLogoHovered = false

    this.clock = new THREE.Clock()
    this.animationFrameId = 0

    this.setupLighting()
    this.buildPCBBoard()
    this.buildCentralAICChip()
    this.buildPeripheralComponents()
    this.buildDenseCopperNetworkAndPulses()
    this.setupEvents()

    this.animate = this.animate.bind(this)
    this.animate()
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x0e1b2e, 1.2)
    this.scene.add(this.ambientLight)

    // Key Light - soft natural illumination without harsh glare
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
    this.keyLight.position.set(8, 12, 6)
    this.scene.add(this.keyLight)

    // Rim Light (color-coded to theme) - subdued rim highlight
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 0.7)
    this.rimLight.position.set(-9, 6, -6)
    this.scene.add(this.rimLight)

    // Warm Gold Accent Light
    this.goldAccent = new THREE.DirectionalLight(0xfacc15, 0.3)
    this.goldAccent.position.set(4, 5, -8)
    this.scene.add(this.goldAccent)

    // Mouse pointer light following on PCB surface - very subtle
    this.pointerLight = new THREE.PointLight(0x38bdf8, 0.35, 5)
    this.pointerLight.position.set(0, 1.5, 0)
    this.scene.add(this.pointerLight)
  }

  buildPCBBoard() {
    const width = 12.0
    const length = 9.6
    const thickness = 0.22
    const cornerRadius = 0.6
    const holeRadius = 0.28

    const holePositions = [
      [-5.3, -4.1],
      [5.3, -4.1],
      [-5.3, 4.1],
      [5.3, 4.1],
    ]

    const boardShape = new THREE.Shape()
    const bx = -width / 2
    const by = -length / 2
    boardShape.moveTo(bx + cornerRadius, by)
    boardShape.lineTo(bx + width - cornerRadius, by)
    boardShape.absarc(
      bx + width - cornerRadius,
      by + cornerRadius,
      cornerRadius,
      -Math.PI / 2,
      0,
      false,
    )
    boardShape.lineTo(bx + width, by + length - cornerRadius)
    boardShape.absarc(
      bx + width - cornerRadius,
      by + length - cornerRadius,
      cornerRadius,
      0,
      Math.PI / 2,
      false,
    )
    boardShape.lineTo(bx + cornerRadius, by + length)
    boardShape.absarc(
      bx + cornerRadius,
      by + length - cornerRadius,
      cornerRadius,
      Math.PI / 2,
      Math.PI,
      false,
    )
    boardShape.lineTo(bx, by + cornerRadius)
    boardShape.absarc(
      bx + cornerRadius,
      by + cornerRadius,
      cornerRadius,
      Math.PI,
      (3 * Math.PI) / 2,
      false,
    )

    holePositions.forEach(([hx, hz]) => {
      const holePath = new THREE.Path()
      holePath.absarc(hx, hz, holeRadius, 0, Math.PI * 2, true)
      boardShape.holes.push(holePath)
    })

    const boardGeom = new THREE.ExtrudeGeometry(boardShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 8,
      curveSegments: 64,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    })
    boardGeom.rotateX(Math.PI / 2)

    const mat = new THREE.MeshStandardMaterial({
      color: 0x071526,
      roughness: 0.55,
      metalness: 0.05,
    })

    const board = new THREE.Mesh(boardGeom, mat)
    board.position.y = -thickness
    board.name = "Board_Substrate"
    this.pcbGroup.add(board)

    // Silkscreen
    const silkscreenTexture = createBoardSilkscreenTexture()
    const silkscreenGeom = new THREE.ShapeGeometry(boardShape, 64)
    silkscreenGeom.rotateX(-Math.PI / 2)
    const pos = silkscreenGeom.attributes.position
    const uvs = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (pos.getX(i) + width / 2) / width
      uvs[i * 2 + 1] = 1 - (pos.getZ(i) + length / 2) / length
    }
    silkscreenGeom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))

    const silkscreenMat = new THREE.MeshStandardMaterial({
      map: silkscreenTexture,
      roughness: 0.58,
      metalness: 0.08,
      transparent: true,
      opacity: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    const silkscreenMesh = new THREE.Mesh(silkscreenGeom, silkscreenMat)
    silkscreenMesh.position.y = 0.005
    silkscreenMesh.name = "PCB_Silkscreen_Layer"
    this.pcbGroup.add(silkscreenMesh)

    // Gold annular rings & copper barrels
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.82,
      roughness: 0.38,
    })
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc87a3e,
      metalness: 0.8,
      roughness: 0.4,
    })

    holePositions.forEach(([hx, hz]) => {
      const topRing = new THREE.Mesh(
        new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48),
        goldMat,
      )
      topRing.rotateX(-Math.PI / 2)
      topRing.position.set(hx, 0.012, hz)
      this.pcbGroup.add(topRing)

      const botRing = new THREE.Mesh(
        new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48),
        goldMat,
      )
      botRing.rotateX(Math.PI / 2)
      botRing.position.set(hx, -thickness - 0.012, hz)
      this.pcbGroup.add(botRing)

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(
          holeRadius,
          holeRadius,
          thickness + 0.06,
          48,
          1,
          true,
        ),
        copperMat,
      )
      barrel.position.set(hx, -thickness / 2, hz)
      this.pcbGroup.add(barrel)
    })
  }

  buildCentralAICChip() {
    const bodyGeom = new THREE.BoxGeometry(3.6, 0.32, 3.6)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.56,
      metalness: 0.08,
    })
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat)
    bodyMesh.position.y = 0.16
    bodyMesh.castShadow = true
    bodyMesh.receiveShadow = true
    bodyMesh.name = "AIC_Chip_Body"
    bodyMesh.pcbData = {
      name: "U1 [AIC: AAVESH SOC-M7]",
      desc: "Dual ARM Cortex-M7 @ 240MHz + RISC-V Neural Core",
      voltage: "3.3V DC (Core 1.2V)",
      freq: "240.00 MHz System Clock",
    }
    this.chipGroup.add(bodyMesh)

    // Pin 1 Mark
    const pin1Geom = new THREE.CylinderGeometry(0.12, 0.12, 0.005, 24)
    const pin1Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.45,
    })
    const pin1 = new THREE.Mesh(pin1Geom, pin1Mat)
    pin1.position.set(-1.4, 0.322, -1.4)
    this.chipGroup.add(pin1)

    // Exact AAVESH Logo Shape (8-point polygon with parallel slanted gap)
    const logoShape = createAaveshLogoShape()
    const logoGeom = new THREE.ExtrudeGeometry(logoShape, {
      depth: 0.006,
      bevelEnabled: false,
      curveSegments: 32,
    })
    logoGeom.rotateX(-Math.PI / 2)

    this.logoMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.1,
      metalness: 0.12,
      roughness: 0.45,
    })

    this.logoMesh = new THREE.Mesh(logoGeom, this.logoMaterial)
    this.logoMesh.position.set(0, 0.322, 0)
    this.logoMesh.name = "AAVESH_Embedded_Logo"
    this.logoMesh.pcbData = {
      name: "AAVESH [CORE RESONANCE LOGO]",
      desc: "⚡ Click once to cycle glow colour & pulse speed",
      voltage: "3.3V Active Matrix",
      freq: "Harmonic Clock Sync",
    }
    this.chipGroup.add(this.logoMesh)

    // 64 Metallic Gull-wing Pins
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd8e0ea,
      metalness: 0.78,
      roughness: 0.38,
    })

    const createPin = () => {
      const pinGroup = new THREE.Group()
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.08), pinMat)
      up.position.set(0.15, 0.12, 0)
      pinGroup.add(up)

      const knee = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.12, 0.08),
        pinMat,
      )
      knee.rotation.z = -Math.PI / 4
      knee.position.set(0.34, 0.06, 0)
      pinGroup.add(knee)

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.03, 0.08),
        pinMat,
      )
      foot.position.set(0.48, 0.015, 0)
      pinGroup.add(foot)

      return pinGroup
    }

    const pinsPerSide = 16
    const half = 1.8
    const spacing = 3.0 / (pinsPerSide - 1)

    for (let i = 0; i < pinsPerSide; i++) {
      const offset = -1.5 + i * spacing

      const pE = createPin()
      pE.position.set(half, 0, offset)
      this.chipGroup.add(pE)

      const pW = createPin()
      pW.rotation.y = Math.PI
      pW.position.set(-half, 0, offset)
      this.chipGroup.add(pW)

      const pS = createPin()
      pS.rotation.y = Math.PI / 2
      pS.position.set(offset, 0, half)
      this.chipGroup.add(pS)

      const pN = createPin()
      pN.rotation.y = -Math.PI / 2
      pN.position.set(offset, 0, -half)
      this.chipGroup.add(pN)
    }
  }

  buildPeripheralComponents() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.75,
      roughness: 0.38,
    })
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.82,
      roughness: 0.38,
    })
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.52,
      metalness: 0.12,
    })
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xd8e0ea,
      metalness: 0.75,
      roughness: 0.38,
    })

    // 1. Crystal Oscillator
    const crystalGroup = new THREE.Group()
    crystalGroup.position.set(3.5, 0, -2.4)
    crystalGroup.name = "Crystal_16MHz"

    const canShape = new THREE.Shape()
    canShape.absarc(-0.4, 0, 0.28, Math.PI / 2, (3 * Math.PI) / 2, false)
    canShape.absarc(0.4, 0, 0.28, -Math.PI / 2, Math.PI / 2, false)
    canShape.closePath()

    const canGeom = new THREE.ExtrudeGeometry(canShape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    })
    canGeom.rotateX(-Math.PI / 2)
    const canMesh = new THREE.Mesh(canGeom, metalMat)
    canMesh.position.y = 0.05
    canMesh.pcbData = {
      name: "Y1 [CRYSTAL: 16.000 MHz]",
      desc: "Precision Quartz Crystal Oscillator (±10ppm)",
      voltage: "3.3V System Reference",
      freq: "16.000000 MHz Fundamental",
    }
    crystalGroup.add(canMesh)

    const tab1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.04, 0.2),
      silverMat,
    )
    tab1.position.set(-0.7, 0.02, 0)
    const tab2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.04, 0.2),
      silverMat,
    )
    tab2.position.set(0.7, 0.02, 0)
    crystalGroup.add(tab1, tab2)
    this.pcbGroup.add(crystalGroup)

    // 2. USB Type-C Receptacle
    const usbGroup = new THREE.Group()
    usbGroup.position.set(-2.5, 0, -4.3)
    usbGroup.name = "USB_C_Port"

    const usbBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.65, 1.4),
      metalMat,
    )
    usbBody.position.y = 0.325
    usbBody.pcbData = {
      name: "J1 [CONNECTOR: USB TYPE-C]",
      desc: "High-speed USB-C 5V/3A Power & Data Bus",
      voltage: "5.0V VBUS / 3.0A Max",
      freq: "480 Mbps High Speed USB 2.0",
    }
    usbGroup.add(usbBody)

    const cavity = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.42, 0.6),
      darkMat,
    )
    cavity.position.set(0, 0.325, -0.45)
    usbGroup.add(cavity)

    const tongue = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.08, 0.45),
      goldMat,
    )
    tongue.position.set(0, 0.325, -0.4)
    usbGroup.add(tongue)
    this.pcbGroup.add(usbGroup)

    // 3. 2x8 Pin Header
    const headerGroup = new THREE.Group()
    headerGroup.position.set(4.9, 0, 0)
    headerGroup.name = "GPIO_Header"

    const shroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.5, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }),
    )
    shroud.position.y = 0.25
    shroud.pcbData = {
      name: "J2 [GPIO HEADER: 2x8]",
      desc: "16-Pin ENIG Gold Expansion Bus (SPI, I2C, UART)",
      voltage: "3.3V Logic Level",
      freq: "Configurable I/O Ports",
    }
    headerGroup.add(shroud)

    const pinG = new THREE.BoxGeometry(0.08, 1.3, 0.08)
    for (let r = -0.15; r <= 0.15; r += 0.3) {
      for (let c = -1.6; c <= 1.6; c += 0.44) {
        const p = new THREE.Mesh(pinG, goldMat)
        p.position.set(r, 0.65, c)
        headerGroup.add(p)
      }
    }
    this.pcbGroup.add(headerGroup)

    // 4. SPI Flash
    const flashGroup = new THREE.Group()
    flashGroup.position.set(-3.8, 0, -0.6)
    const flashBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.22, 0.7),
      darkMat,
    )
    flashBody.position.y = 0.11
    flashBody.pcbData = {
      name: "U2 [MEMORY: 128MB SPI FLASH]",
      desc: "Quad-SPI High-Speed Firmware & Asset Storage",
      voltage: "3.3V Supply",
      freq: "104 MHz QSPI Interface",
    }
    flashGroup.add(flashBody)
    ;[-0.3, -0.1, 0.1, 0.3].forEach((fx) => {
      const p1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.22),
        silverMat,
      )
      p1.position.set(fx, 0.05, -0.42)
      const p2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.22),
        silverMat,
      )
      p2.position.set(fx, 0.05, 0.42)
      flashGroup.add(p1, p2)
    })
    this.pcbGroup.add(flashGroup)

    // 5. Voltage Regulator SOT-223
    const regGroup = new THREE.Group()
    regGroup.position.set(-4.2, 0, -2.5)
    const regBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.26, 0.75),
      darkMat,
    )
    regBody.position.y = 0.13
    regBody.pcbData = {
      name: "VR1 [REGULATOR: AMS1117-3.3]",
      desc: "Low Dropout Positive Voltage Regulator",
      voltage: "VIN: 5.0V -> VOUT: 3.3V @ 1.0A",
      freq: "DC Linear Regulation",
    }
    regGroup.add(regBody)
    const regTab = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.35),
      silverMat,
    )
    regTab.position.set(0, 0.05, -0.45)
    regGroup.add(regTab)
    this.pcbGroup.add(regGroup)

    // 6. SMD Components (Resistors, Capacitors, Diodes)
    const smdComponents = getPCBComponents()
    smdComponents.forEach((comp) => {
      let meshGroup
      if (comp.type === "resistor") {
        meshGroup = createSMDResistorMesh()
      } else if (comp.type === "capacitor") {
        meshGroup = createSMDCapacitorMesh()
      } else {
        meshGroup = createSMDDiodeMesh()
      }
      meshGroup.position.set(comp.x, 0, comp.z)
      meshGroup.rotation.y = comp.rot
      meshGroup.name = comp.name
      this.pcbGroup.add(meshGroup)
    })

    // 7. Interactive Diagnostic LEDs
    const leds = [
      {
        x: 3.8,
        z: 3.2,
        baseColor: new THREE.Color(0x00f0ff),
        glowColor: new THREE.Color(0x38bdf8),
        info: {
          name: "D1 [LED: ACT / ACTIVITY]",
          desc: "Real-time SoC Core Processing Pulse",
          voltage: "3.3V High",
          freq: "Pulsing 120Hz",
        },
      },
      {
        x: 4.3,
        z: 3.2,
        baseColor: new THREE.Color(0x10b981),
        glowColor: new THREE.Color(0x34d399),
        info: {
          name: "D2 [LED: PWR / 3V3 POWER]",
          desc: "Clean Regulated 3.3V Power Rail Status",
          voltage: "3.30V DC Stable",
          freq: "Continuous DC",
        },
      },
      {
        x: 4.8,
        z: 3.2,
        baseColor: new THREE.Color(0xf59e0b),
        glowColor: new THREE.Color(0xfbbf24),
        info: {
          name: "D3 [LED: CLK / SYSTEM BUS]",
          desc: "Master Clock Sync Indicator",
          voltage: "3.3V Digital",
          freq: "Synchronized Bus",
        },
      },
      {
        x: -1.8,
        z: 3.4,
        baseColor: new THREE.Color(0x00d4ff),
        glowColor: new THREE.Color(0x60a5fa),
        info: {
          name: "D4 [LED: TX / TELEMETRY]",
          desc: "High-speed UART & Telemetry Link",
          voltage: "3.3V Logic",
          freq: "Dynamic Baud 115200",
        },
      },
    ]

    leds.forEach((ld) => {
      const ledGroup = new THREE.Group()
      ledGroup.position.set(ld.x, 0, ld.z)

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), darkMat)
      base.position.y = 0.05
      ledGroup.add(base)

      const domeMat = new THREE.MeshStandardMaterial({
        color: ld.baseColor,
        emissive: ld.baseColor,
        emissiveIntensity: 0.22,
        roughness: 0.35,
      })

      const domeGeom = new THREE.SphereGeometry(0.12, 16, 16)
      domeGeom.scale(1, 0.6, 1)
      const dome = new THREE.Mesh(domeGeom, domeMat)
      dome.position.y = 0.12
      dome.name = ld.info.name
      dome.pcbData = ld.info
      ledGroup.add(dome)

      const light = new THREE.PointLight(ld.baseColor, 0.22, 1.6)
      light.position.set(0, 0.2, 0)
      ledGroup.add(light)

      this.interactiveLeds.push({
        mesh: dome,
        light,
        baseColor: ld.baseColor,
        glowColor: ld.glowColor,
        intensity: 0.22,
        targetIntensity: 0.22,
        info: ld.info,
      })

      this.pcbGroup.add(ledGroup)
    })
  }

  buildDenseCopperNetworkAndPulses() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.82,
      roughness: 0.38,
    })
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.38,
    })

    const routes = getPCBTraceWaypoints()
    const currentTheme =
      THEME_CONFIGS[this.options.themeIndex] || THEME_CONFIGS[0]

    routes.forEach((route) => {
      const curve = createSmoothFilletedCurve(route.points, 0.22)
      const traceGeom = buildTraceRibbonGeometry(curve, 0.052, 0.014, 0.012)
      const traceMesh = new THREE.Mesh(
        traceGeom,
        route.isGold ? goldMat : copperMat,
      )
      traceMesh.receiveShadow = true
      traceMesh.name = "Smooth_Filleted_Copper_Trace"
      this.pcbGroup.add(traceMesh)

      // Contact pad at start
      const pStart = route.points[0]
      const startPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.016, 0.07),
        goldMat,
      )
      startPad.position.set(pStart.x, 0.014, pStart.z)
      this.pcbGroup.add(startPad)

      // Gold via at end
      const pEnd = route.points[route.points.length - 1]
      const endVia = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.018, 16),
        goldMat,
      )
      endVia.position.set(pEnd.x, 0.014, pEnd.z)
      this.pcbGroup.add(endVia)

      // Dynamic Laser Streak Pulse
      const laser = createLaserPulseMesh(curve, currentTheme.hex, route.speed)
      this.pcbGroup.add(laser.mesh)
      this.laserPulses.push(laser)
    })
  }

  setupEvents() {
    const el = this.renderer.domElement

    // Mouse movement
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      // Pointer specular spotlight following
      this.pointerLight.position.x = this.mouse.x * 5.0
      this.pointerLight.position.z = -this.mouse.y * 4.0

      this.checkRaycast(e.clientX, e.clientY)
    })

    el.addEventListener("mouseleave", () => {
      this.mouse.set(-100, -100)
      el.style.cursor = "default"
      this.isLogoHovered = false
      if (this.onHoverChange) this.onHoverChange(null, 0, 0)
      this.interactiveLeds.forEach((led) => (led.targetIntensity = 0.75))
    })

    // Click handler: detects clicks on logo or chip
    el.addEventListener("click", (e) => {
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObjects(
        this.pcbGroup.children,
        true,
      )

      if (intersects.length > 0) {
        let isLogo = false
        let isChip = false

        for (let i = 0; i < Math.min(3, intersects.length); i++) {
          let hit = intersects[i].object
          while (hit && hit !== this.pcbGroup && hit !== this.scene) {
            if (hit.name === "AAVESH_Embedded_Logo" || hit === this.logoMesh) {
              isLogo = true
              break
            }
            if (hit.name === "AIC_Chip_Body" || hit.name === "AIC_Chip") {
              isChip = true
              break
            }
            hit = hit.parent
          }
          if (isLogo) break
        }

        if (isLogo) {
          // Cycle theme color, speed and minimal glow by clicking once on AAVESH logo
          this.cycleTheme()
          return
        }

        if (isChip) {
          this.triggerBurstPulse()
          sounds.playChipPulse()
          if (this.onChipClick) this.onChipClick()
          return
        }

        // Check if any other component clicked
        let hit = intersects[0].object
        let pcbData = hit.pcbData
        while (
          !pcbData &&
          hit.parent &&
          hit.parent !== this.pcbGroup &&
          hit.parent !== this.scene
        ) {
          hit = hit.parent
          pcbData = hit.pcbData
        }
        if (pcbData) {
          this.triggerBurstPulse()
          sounds.playChipPulse()
        }
      }
    })

    // Scroll-reactive rotation speed & direction:
    // Normal wheel allows page to scroll down naturally while accelerating/reversing rotation
    const handleWheel = (e) => {
      // If user holds Ctrl / Cmd key, zoom the 3D model
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 1.06 : 0.94
        this.camera.position.multiplyScalar(factor)
        this.camera.position.clampLength(3.5, 22)
        this.controls.update()
        return
      }

      const now = performance.now()
      this.lastScrollTime = now

      // When scrolled down (deltaY > 0), rotate faster in normal direction
      // When scrolled up (deltaY < 0), rotate reverse!
      if (e.deltaY > 0) {
        this.targetRotateSpeed = Math.min(5.0, this.baseRotateSpeed + 3.2)
      } else if (e.deltaY < 0) {
        this.targetRotateSpeed = -Math.min(
          5.0,
          Math.abs(this.baseRotateSpeed) + 3.2,
        )
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: false })

    // Window scroll event
    const handleWindowScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - this.lastScrollY
      this.lastScrollY = currentY
      this.lastScrollTime = performance.now()

      if (delta > 2) {
        // Scrolled down -> rotate faster
        this.targetRotateSpeed = Math.min(4.8, this.baseRotateSpeed + 2.8)
      } else if (delta < -2) {
        // Scrolled up -> rotate in reverse!
        this.targetRotateSpeed = -Math.min(
          4.8,
          Math.abs(this.baseRotateSpeed) + 2.8,
        )
      }
    }
    window.addEventListener("scroll", handleWindowScroll, { passive: true })

    // Window resize
    this.handleResize = () => {
      const w = this.container.clientWidth || window.innerWidth
      const h = this.container.clientHeight || window.innerHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
      this.composer.setSize(w, h)
    }
    window.addEventListener("resize", this.handleResize)

    this._cleanupEvents = () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("scroll", handleWindowScroll)
      window.removeEventListener("resize", this.handleResize)
    }
  }

  checkRaycast(clientX, clientY) {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(
      this.pcbGroup.children,
      true,
    )

    let foundData = null
    let hitObject = null
    let hoveringLogo = false

    if (intersects.length > 0) {
      for (let i = 0; i < Math.min(4, intersects.length); i++) {
        let cur = intersects[i].object
        while (cur && cur !== this.scene) {
          if (cur.name === "AAVESH_Embedded_Logo" || cur === this.logoMesh) {
            hoveringLogo = true
            foundData = cur.pcbData || {
              name: "AAVESH [CORE RESONANCE LOGO]",
              desc: "⚡ Click once to cycle glow colour & pulse speed",
              voltage: "3.3V Active Matrix",
              freq: "Harmonic Clock Sync",
            }
            hitObject = cur
            break
          }
          if (!foundData && cur.pcbData) {
            foundData = cur.pcbData
            hitObject = cur
          }
          cur = cur.parent
        }
        if (hoveringLogo) break
      }
    }

    const el = this.renderer.domElement

    if (hoveringLogo) {
      if (!this.isLogoHovered) {
        this.isLogoHovered = true
        el.style.cursor = "pointer"
        sounds.playLedTouch(1050)
        if (this.logoMaterial) {
          this.logoMaterial.emissiveIntensity = 0.35
        }
      }
    } else {
      if (this.isLogoHovered) {
        this.isLogoHovered = false
        el.style.cursor = foundData ? "pointer" : "default"
        if (this.logoMaterial) {
          this.logoMaterial.emissiveIntensity = 0.1
        }
      } else {
        el.style.cursor = foundData ? "pointer" : "default"
      }
    }

    if (foundData && hitObject) {
      if (this.hoveredObject !== hitObject) {
        this.hoveredObject = hitObject
        if (!hoveringLogo) sounds.playLedTouch(880)

        this.interactiveLeds.forEach((led) => {
          if (led.mesh === hitObject || hitObject?.name?.includes("LED")) {
            led.targetIntensity = 0.55
          } else {
            led.targetIntensity = 0.22
          }
        })
      }
      if (this.onHoverChange) {
        this.onHoverChange(foundData, clientX, clientY)
      }
    } else {
      if (this.hoveredObject !== null) {
        this.hoveredObject = null
        this.interactiveLeds.forEach((led) => (led.targetIntensity = 0.22))
        if (this.onHoverChange) this.onHoverChange(null, 0, 0)
      }
    }
  }

  // Cycle glow colour and speed by clicking once on the AAVESH logo
  cycleTheme() {
    this.options.themeIndex =
      (this.options.themeIndex + 1) % THEME_CONFIGS.length
    const nextTheme = THEME_CONFIGS[this.options.themeIndex]

    this.options.colorTheme = nextTheme.id
    this.options.pulseSpeed = nextTheme.speed
    this.options.bloomStrength = nextTheme.bloom

    // 1. Play sound
    sounds.playThemeChange(this.options.themeIndex)

    // 2. Update minimal glow on UnrealBloomPass
    if (this.bloomPass) {
      this.bloomPass.strength = nextTheme.bloom
    }

    // 3. Update lights
    this.rimLight.color.setHex(nextTheme.hex)
    this.pointerLight.color.setHex(nextTheme.hex)

    // 4. Update AAVESH Logo material glow
    if (this.logoMaterial) {
      this.logoMaterial.emissive.setHex(nextTheme.hex)
      this.logoMaterial.emissiveIntensity = 0.35
      setTimeout(() => {
        if (this.logoMaterial) {
          this.logoMaterial.emissiveIntensity = this.isLogoHovered ? 0.35 : 0.1
        }
      }, 450)
    }

    // 5. Update travelling laser pulses
    this.laserPulses.forEach((pulse) => {
      const colors = pulse.colorAttr.array
      const baseCol = new THREE.Color(nextTheme.hex)
      const headCol = new THREE.Color(0xffffff)
      for (let i = 0; i < LASER_SLICES; i++) {
        const t = i / (LASER_SLICES - 1)
        const c = new THREE.Color().lerpColors(
          baseCol,
          headCol,
          Math.pow(t, 2.2),
        )
        const brightness = Math.max(0.02, Math.pow(t, 1.8) * 0.45)
        c.multiplyScalar(brightness)
        colors[i * 6 + 0] = c.r
        colors[i * 6 + 1] = c.g
        colors[i * 6 + 2] = c.b
        colors[i * 6 + 3] = c.r
        colors[i * 6 + 4] = c.g
        colors[i * 6 + 5] = c.b
      }
      pulse.colorAttr.needsUpdate = true
    })

    // 6. Flare LEDs briefly to reflect theme change
    this.interactiveLeds.forEach((led) => {
      led.targetIntensity = 0.65
      setTimeout(() => {
        led.targetIntensity = 0.22
      }, 500)
    })

    if (this.onThemeChange) {
      this.onThemeChange(nextTheme)
    }
  }

  // Trigger high-frequency pulse surge wave
  triggerBurstPulse() {
    this.laserPulses.forEach((p) => {
      const origSpeed = p.speed
      p.speed = origSpeed * 2.2
      p.laserLength = 0.45
      setTimeout(() => {
        p.speed = origSpeed
        p.laserLength = 0.24
      }, 850)
    })

    this.interactiveLeds.forEach((led) => {
      led.targetIntensity = 0.75
      setTimeout(() => {
        led.targetIntensity = 0.22
      }, 700)
    })
  }

  // Animation Loop
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate)
    const delta = this.clock.getDelta()
    const time = this.clock.getElapsedTime()

    // Smoothly decay scroll-accelerated / reversed rotation back to normal base speed
    const timeSinceScroll = performance.now() - this.lastScrollTime
    if (timeSinceScroll > 140) {
      this.targetRotateSpeed = this.baseRotateSpeed
    }
    this.currentRotateSpeed = THREE.MathUtils.lerp(
      this.currentRotateSpeed,
      this.targetRotateSpeed,
      Math.min(1.0, delta * 3.5),
    )

    if (this.controls) {
      this.controls.autoRotate = this.options.autoRotate
      this.controls.autoRotateSpeed = this.currentRotateSpeed
      this.controls.update()
    }

    // Advance dynamic travelling laser pulses along curved copper traces
    this.laserPulses.forEach((pulse) => {
      updateLaserPulse(pulse, delta, this.options.pulseSpeed)
    })

    // Idle breathing on LEDs
    this.interactiveLeds.forEach((led, idx) => {
      const idleBreathing = 0.03 * Math.sin(time * 2 + idx * 1.5)
      const target = led.targetIntensity + idleBreathing
      led.intensity = THREE.MathUtils.lerp(led.intensity, target, delta * 10)

      led.mesh.material.emissiveIntensity = led.intensity
      led.light.intensity = led.intensity * 0.35
    })

    // Subtle pulsing on logo if idle
    if (this.logoMaterial && !this.isLogoHovered) {
      this.logoMaterial.emissiveIntensity = 0.08 + 0.02 * Math.sin(time * 1.8)
    }

    this.composer.render()
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId)
    if (this._cleanupEvents) this._cleanupEvents()
    if (this.controls) this.controls.dispose()
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement,
        )
      }
    }
  }
}

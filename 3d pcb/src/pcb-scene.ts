import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { sounds } from './audio';
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
  LaserPulse,
} from './pcb-traces';

export interface SceneOptions {
  bloomStrength: number;
  bloomRadius: number;
  pulseSpeed: number;
  autoRotate: boolean;
  colorTheme: 'cyan' | 'gold' | 'emerald' | 'crimson';
}

// Generates an authentic high-resolution silkscreen, copper ground pour & engineering markings texture
function createBoardSilkscreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1638;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Solder Mask: Deep rich navy/indigo matte substrate
  ctx.fillStyle = '#071526';
  ctx.fillRect(0, 0, 2048, 1638);

  // 2. Faint ground copper crosshatch flood (shows ground plane underneath solder mask)
  ctx.strokeStyle = 'rgba(202, 138, 4, 0.06)';
  ctx.lineWidth = 1.2;
  for (let x = 0; x < 2048; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1638);
    ctx.stroke();
  }
  for (let y = 0; y < 1638; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // 3. Crisp white silkscreen perimeter borders
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, 1948, 1538);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, 1920, 1510);

  // 4. Mounting hole rings & clearances
  const drawMountHole = (x: number, y: number) => {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 70, 0, Math.PI * 2);
    ctx.stroke();
  };
  drawMountHole(120, 120);
  drawMountHole(1928, 120);
  drawMountHole(120, 1518);
  drawMountHole(1928, 1518);

  // 5. Clean U1 Chip Silkscreen Boundary & Pin 1 Indicator (No text on PCB, pure minimalist hardware with AAVESH logo)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(700, 495, 648, 648);

  // Pin 1 Mark for U1
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(670, 465, 12, 0, Math.PI * 2);
  ctx.fill();

  // Copper Vias (gold dots with dark center)
  const drawVia = (vx: number, vy: number) => {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(vx, vy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#020408';
    ctx.beginPath();
    ctx.arc(vx, vy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Perimeter and ground stitching vias
  for (let x = 180; x < 1900; x += 80) {
    drawVia(x, 90);
    drawVia(x, 1550);
  }
  for (let y = 180; y < 1550; y += 80) {
    drawVia(90, y);
    drawVia(1960, y);
  }

  // Intermediate ground vias around IC
  for (let i = 0; i < 8; i++) {
    drawVia(640 + i * 110, 430);
    drawVia(640 + i * 110, 1210);
    drawVia(640, 430 + i * 110);
    drawVia(1410, 430 + i * 110);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export class PCBShowcase {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public controls: OrbitControls;

  private pcbGroup: THREE.Group;
  private chipGroup: THREE.Group;
  private pointerLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-100, -100);
  private hoveredObject: THREE.Object3D | null = null;

  // Animated laser pulses that bend along smooth copper lines
  private laserPulses: LaserPulse[] = [];
  
  // Interactive LED list
  private interactiveLeds: {
    mesh: THREE.Mesh;
    light: THREE.PointLight;
    baseColor: THREE.Color;
    glowColor: THREE.Color;
    intensity: number;
    targetIntensity: number;
    info: { name: string; desc: string; voltage: string; freq: string };
  }[] = [];

  // Default options: REMOVE GLOW (bloomStrength = 0.0) so PCB is crisp and realistic, keep pulses active!
  public options: SceneOptions = {
    bloomStrength: 0.0,
    bloomRadius: 0.0,
    pulseSpeed: 1.0,
    autoRotate: true,
    colorTheme: 'cyan',
  };

  private onHoverChange?: (info: { name: string; desc: string; voltage: string; freq: string } | null, x: number, y: number) => void;
  private clock = new THREE.Clock();
  private animationFrameId: number = 0;

  constructor(container: HTMLElement, onHover?: (info: { name: string; desc: string; voltage: string; freq: string } | null, x: number, y: number) => void) {
    this.container = container;
    this.onHoverChange = onHover;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020408); // Deep space dark background

    // 2. Camera setup - initialised to cinematic Hero perspective from Reference Image 2
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    // 3. Renderer with high-end PBR tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 3.5;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't flip below board
    this.controls.autoRotate = this.options.autoRotate;
    this.controls.autoRotateSpeed = 0.8;

    this.setCameraView('hero');

    // 5. Post-processing - bloom strength set to 0 to remove blurry glow and preserve crisp PCB realism
    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.options.bloomStrength,
      this.options.bloomRadius,
      0.15
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(outputPass);

    // 6. Groups and Lighting
    this.pcbGroup = new THREE.Group();
    this.pcbGroup.name = 'PCB_System';
    this.scene.add(this.pcbGroup);

    this.chipGroup = new THREE.Group();
    this.chipGroup.name = 'AIC_Chip';
    this.pcbGroup.add(this.chipGroup);

    this.setupLighting();

    // 7. Build complete 3D PCB Hierarchy
    this.buildPCBBoard();
    this.buildCentralAICChip();
    this.buildPeripheralComponents();
    this.buildDenseCopperNetworkAndPulses();

    // 8. Event listeners
    this.setupEvents();

    // 9. Start render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x0c1626, 1.4);
    this.scene.add(this.ambientLight);

    // Key Light - creates crisp specular gleam on pins, traces and solder joints
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    this.keyLight.position.set(8, 12, 6);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // Rim Light - sharp cyan edge reflection
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 2.0);
    this.rimLight.position.set(-9, 6, -6);
    this.scene.add(this.rimLight);

    // Warm Gold Accent Light
    const goldAccent = new THREE.DirectionalLight(0xfacc15, 0.7);
    goldAccent.position.set(4, 5, -8);
    this.scene.add(goldAccent);

    // Interactive pointer specular light following mouse on PCB surface
    this.pointerLight = new THREE.PointLight(0x38bdf8, 1.4, 7);
    this.pointerLight.position.set(0, 1.5, 0);
    this.scene.add(this.pointerLight);
  }

  // Camera presets
  public setCameraView(view: 'hero' | 'top' | 'chip' | 'iso') {
    if (this.controls) {
      switch (view) {
        case 'hero': // Dynamic 3D Hero Perspective
          this.camera.up.set(0, 1, 0);
          this.camera.position.set(6.2, 5.2, 7.8);
          this.controls.target.set(0.2, 0.1, -0.4);
          break;
        case 'top': // Blueprint Engineering CAD View (North is UP)
          this.camera.up.set(0, 0, -1);
          this.camera.position.set(0, 14, 0.001);
          this.controls.target.set(0, 0, 0);
          this.controls.autoRotate = false;
          break;
        case 'chip': // Extreme Macro directly facing AAVESH Logo
          this.camera.up.set(0, 0, -1);
          this.camera.position.set(0, 4.2, 0.001);
          this.controls.target.set(0, 0.32, 0);
          this.controls.autoRotate = false;
          break;
        case 'iso': // Clean 45-degree Isometric View
          this.camera.up.set(0, 1, 0);
          this.camera.position.set(9, 7.5, 9);
          this.controls.target.set(0, 0, 0);
          break;
      }
      this.controls.update();
    }
  }

  // 1. PCB FR4 Substrate Board with 4 REAL PHYSICAL CORNER HOLES (Silky Smooth Finish)
  private buildPCBBoard() {
    const width = 12.0;
    const length = 9.6;
    const thickness = 0.22;
    const cornerRadius = 0.6;
    const holeRadius = 0.28;

    const holePositions = [
      [-5.3, -4.1],
      [5.3, -4.1],
      [-5.3, 4.1],
      [5.3, 4.1],
    ];

    // Smooth rounded board shape with 4 smooth circular corner holes
    const boardShape = new THREE.Shape();
    const bx = -width / 2;
    const by = -length / 2;
    boardShape.moveTo(bx + cornerRadius, by);
    boardShape.lineTo(bx + width - cornerRadius, by);
    boardShape.absarc(bx + width - cornerRadius, by + cornerRadius, cornerRadius, -Math.PI / 2, 0, false);
    boardShape.lineTo(bx + width, by + length - cornerRadius);
    boardShape.absarc(bx + width - cornerRadius, by + length - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
    boardShape.lineTo(bx + cornerRadius, by + length);
    boardShape.absarc(bx + cornerRadius, by + length - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
    boardShape.lineTo(bx, by + cornerRadius);
    boardShape.absarc(bx + cornerRadius, by + cornerRadius, cornerRadius, Math.PI, (3 * Math.PI) / 2, false);

    // Cut true physical through-holes completely through the board!
    holePositions.forEach(([hx, hz]) => {
      const holePath = new THREE.Path();
      holePath.absarc(hx, hz, holeRadius, 0, Math.PI * 2, true);
      boardShape.holes.push(holePath);
    });

    // High curveSegments (64) and bevelSegments (8) for silky smooth PCB curves
    const boardGeom = new THREE.ExtrudeGeometry(boardShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 8,
      curveSegments: 64,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    boardGeom.rotateX(Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x071526, // Deep rich navy/indigo matte solder mask
      roughness: 0.38,
      metalness: 0.18,
    });

    const board = new THREE.Mesh(boardGeom, mat);
    board.position.y = -thickness;
    board.receiveShadow = true;
    board.name = 'Board_Substrate';
    this.pcbGroup.add(board);

    // Silkscreen layer conforming to boardShape with matching physical corner holes
    const silkscreenTexture = createBoardSilkscreenTexture();
    const silkscreenGeom = new THREE.ShapeGeometry(boardShape, 64);
    silkscreenGeom.rotateX(-Math.PI / 2);
    // Generate accurate planar UVs for the silkscreen shape geometry
    const pos = silkscreenGeom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (pos.getX(i) + width / 2) / width;
      uvs[i * 2 + 1] = 1 - (pos.getZ(i) + length / 2) / length;
    }
    silkscreenGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const silkscreenMat = new THREE.MeshStandardMaterial({
      map: silkscreenTexture,
      roughness: 0.48,
      metalness: 0.15,
      transparent: true,
      opacity: 0.98,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const silkscreenMesh = new THREE.Mesh(silkscreenGeom, silkscreenMat);
    silkscreenMesh.position.y = 0.005;
    silkscreenMesh.name = 'PCB_Silkscreen_Layer';
    this.pcbGroup.add(silkscreenMesh);

    // 4 Corner Gold Annular Rings & Plated Copper Barrels lining the holes
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.96,
      roughness: 0.14,
    });
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc87a3e,
      metalness: 0.96,
      roughness: 0.18,
    });

    holePositions.forEach(([hx, hz]) => {
      // Top surface gold ring
      const topRing = new THREE.Mesh(new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48), goldMat);
      topRing.rotateX(-Math.PI / 2);
      topRing.position.set(hx, 0.012, hz);
      this.pcbGroup.add(topRing);

      // Bottom surface gold ring
      const botRing = new THREE.Mesh(new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48), goldMat);
      botRing.rotateX(Math.PI / 2);
      botRing.position.set(hx, -thickness - 0.012, hz);
      this.pcbGroup.add(botRing);

      // Plated copper barrel inside hole wall
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(holeRadius, holeRadius, thickness + 0.06, 48, 1, true),
        copperMat
      );
      barrel.position.set(hx, -thickness / 2, hz);
      this.pcbGroup.add(barrel);
    });
  }

  // 2. Central AIC (AAVESH SOC-M7) Microprocessor with EMBEDDED SYMMETRIC PURE WHITE LOGO (NO EXTRA BARS)
  private buildCentralAICChip() {
    // Molded black epoxy package
    const bodyGeom = new THREE.BoxGeometry(3.6, 0.32, 3.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.36,
      metalness: 0.15,
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = 0.16;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.name = 'AIC_Chip_Body';
    (bodyMesh as unknown as { pcbData: unknown }).pcbData = {
      name: 'U1 [AIC: AAVESH SOC-M7]',
      desc: 'Dual ARM Cortex-M7 @ 240MHz + RISC-V Neural Core',
      voltage: '3.3V DC (Core 1.2V)',
      freq: '240.00 MHz System Clock',
    };
    this.chipGroup.add(bodyMesh);

    // White silkscreen Pin 1 Index Dot
    const pin1Geom = new THREE.CylinderGeometry(0.12, 0.12, 0.005, 24);
    const pin1Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.3,
    });
    const pin1 = new THREE.Mesh(pin1Geom, pin1Mat);
    pin1.position.set(-1.4, 0.322, -1.4);
    this.chipGroup.add(pin1);

    // --- EXACT AAVESH LOGO MATCHING REFERENCE (OPEN DELTA WITH PARALLEL SLANTED GAP) ---
    const logoShape = createAaveshLogoShape();

    // Flush embedded with depth 0.005 (embedded laser-etched silkscreen look)
    const logoGeom = new THREE.ExtrudeGeometry(logoShape, {
      depth: 0.005,
      bevelEnabled: false,
      curveSegments: 32,
    });
    logoGeom.rotateX(-Math.PI / 2);

    // Non-glowing, pure matte white silkscreen material
    const logoMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.35,
    });
    const logoMesh = new THREE.Mesh(logoGeom, logoMat);
    logoMesh.position.set(0, 0.321, 0); // Perfectly centered at (0, 0)
    logoMesh.name = 'AAVESH_Embedded_Logo';
    this.chipGroup.add(logoMesh);

    // 64 Gull-wing metallic solder pins
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.12,
    });

    const createPin = () => {
      const pinGroup = new THREE.Group();
      // Upper lead
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.08), pinMat);
      up.position.set(0.15, 0.12, 0);
      pinGroup.add(up);

      // Knee
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), pinMat);
      knee.rotation.z = -Math.PI / 4;
      knee.position.set(0.34, 0.06, 0);
      pinGroup.add(knee);

      // Foot
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.08), pinMat);
      foot.position.set(0.48, 0.015, 0);
      pinGroup.add(foot);

      return pinGroup;
    };

    const pinsPerSide = 16;
    const half = 1.8;
    const spacing = 3.0 / (pinsPerSide - 1);

    for (let i = 0; i < pinsPerSide; i++) {
      const offset = -1.5 + i * spacing;

      const pE = createPin();
      pE.position.set(half, 0, offset);
      this.chipGroup.add(pE);

      const pW = createPin();
      pW.rotation.y = Math.PI;
      pW.position.set(-half, 0, offset);
      this.chipGroup.add(pW);

      const pS = createPin();
      pS.rotation.y = Math.PI / 2;
      pS.position.set(offset, 0, half);
      this.chipGroup.add(pS);

      const pN = createPin();
      pN.rotation.y = -Math.PI / 2;
      pN.position.set(offset, 0, -half);
      this.chipGroup.add(pN);
    }
  }

  // 3. Peripheral Real Electronics Components matching Image 2
  private buildPeripheralComponents() {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.98,
      roughness: 0.12,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.96,
      roughness: 0.12,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.4,
      metalness: 0.2,
    });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.15,
    });

    // --- Crystal Oscillator (Pill Can HC-49SMD) ---
    const crystalGroup = new THREE.Group();
    crystalGroup.position.set(3.5, 0, -2.4);
    crystalGroup.name = 'Crystal_16MHz';

    const canShape = new THREE.Shape();
    canShape.absarc(-0.4, 0, 0.28, Math.PI / 2, (3 * Math.PI) / 2, false);
    canShape.absarc(0.4, 0, 0.28, -Math.PI / 2, Math.PI / 2, false);
    canShape.closePath();

    const canGeom = new THREE.ExtrudeGeometry(canShape, {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    canGeom.rotateX(-Math.PI / 2);
    const canMesh = new THREE.Mesh(canGeom, metalMat);
    canMesh.position.y = 0.05;
    (canMesh as unknown as { pcbData: unknown }).pcbData = {
      name: 'Y1 [CRYSTAL: 16.000 MHz]',
      desc: 'Precision Quartz Crystal Oscillator (±10ppm)',
      voltage: '3.3V System Reference',
      freq: '16.000000 MHz Fundamental',
    };
    crystalGroup.add(canMesh);

    // Solder tabs
    const tab1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.2), silverMat);
    tab1.position.set(-0.7, 0.02, 0);
    const tab2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.2), silverMat);
    tab2.position.set(0.7, 0.02, 0);
    crystalGroup.add(tab1);
    crystalGroup.add(tab2);
    this.pcbGroup.add(crystalGroup);

    // --- USB Type-C Receptacle ---
    const usbGroup = new THREE.Group();
    usbGroup.position.set(-2.5, 0, -4.3);
    usbGroup.name = 'USB_C_Port';

    const usbBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 1.4), metalMat);
    usbBody.position.y = 0.325;
    (usbBody as unknown as { pcbData: unknown }).pcbData = {
      name: 'J1 [CONNECTOR: USB TYPE-C]',
      desc: 'High-speed USB-C 5V/3A Power & Data Bus',
      voltage: '5.0V VBUS / 3.0A Max',
      freq: '480 Mbps High Speed USB 2.0',
    };
    usbGroup.add(usbBody);

    const cavity = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 0.6), darkMat);
    cavity.position.set(0, 0.325, -0.45);
    usbGroup.add(cavity);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.45), goldMat);
    tongue.position.set(0, 0.325, -0.4);
    usbGroup.add(tongue);
    this.pcbGroup.add(usbGroup);

    // --- 2x8 Dual-Row Pin Header ---
    const headerGroup = new THREE.Group();
    headerGroup.position.set(4.9, 0, 0);
    headerGroup.name = 'GPIO_Header';

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 3.8), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }));
    shroud.position.y = 0.25;
    (shroud as unknown as { pcbData: unknown }).pcbData = {
      name: 'J2 [GPIO HEADER: 2x8]',
      desc: '16-Pin ENIG Gold Expansion Bus (SPI, I2C, UART)',
      voltage: '3.3V Logic Level',
      freq: 'Configurable I/O Ports',
    };
    headerGroup.add(shroud);

    const pinG = new THREE.BoxGeometry(0.08, 1.3, 0.08);
    for (let r = -0.15; r <= 0.15; r += 0.3) {
      for (let c = -1.6; c <= 1.6; c += 0.44) {
        const p = new THREE.Mesh(pinG, goldMat);
        p.position.set(r, 0.65, c);
        headerGroup.add(p);
      }
    }
    this.pcbGroup.add(headerGroup);

    // --- Auxiliary SOIC-8 IC (SPI Flash) ---
    const flashGroup = new THREE.Group();
    flashGroup.position.set(-3.8, 0, -0.6);
    const flashBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.7), darkMat);
    flashBody.position.y = 0.11;
    (flashBody as unknown as { pcbData: unknown }).pcbData = {
      name: 'U2 [MEMORY: 128MB SPI FLASH]',
      desc: 'Quad-SPI High-Speed Firmware & Asset Storage',
      voltage: '3.3V Supply',
      freq: '104 MHz QSPI Interface',
    };
    flashGroup.add(flashBody);
    [-0.3, -0.1, 0.1, 0.3].forEach((fx) => {
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), silverMat);
      p1.position.set(fx, 0.05, -0.42);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), silverMat);
      p2.position.set(fx, 0.05, 0.42);
      flashGroup.add(p1);
      flashGroup.add(p2);
    });
    this.pcbGroup.add(flashGroup);

    // --- SOT-223 Voltage Regulator ---
    const regGroup = new THREE.Group();
    regGroup.position.set(-4.2, 0, -2.5);
    const regBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, 0.75), darkMat);
    regBody.position.y = 0.13;
    (regBody as unknown as { pcbData: unknown }).pcbData = {
      name: 'VR1 [REGULATOR: AMS1117-3.3]',
      desc: 'Low Dropout Positive Voltage Regulator',
      voltage: 'VIN: 5.0V -> VOUT: 3.3V @ 1.0A',
      freq: 'DC Linear Regulation',
    };
    regGroup.add(regBody);
    const regTab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.35), silverMat);
    regTab.position.set(0, 0.05, -0.45);
    regGroup.add(regTab);
    this.pcbGroup.add(regGroup);

    // --- Authentic Inline SMD Components: Resistors, Ceramic Capacitors, and Diodes ---
    const smdComponents = getPCBComponents();
    smdComponents.forEach((comp) => {
      let meshGroup: THREE.Group;
      if (comp.type === 'resistor') {
        meshGroup = createSMDResistorMesh();
      } else if (comp.type === 'capacitor') {
        meshGroup = createSMDCapacitorMesh();
      } else {
        meshGroup = createSMDDiodeMesh();
      }
      meshGroup.position.set(comp.x, 0, comp.z);
      meshGroup.rotation.y = comp.rot;
      meshGroup.name = comp.name;
      this.pcbGroup.add(meshGroup);
    });

    // --- Interactive Status Diagnostic LEDs (Crisp without bloom fuzziness) ---
    const leds = [
      {
        x: 3.8, z: 3.2,
        baseColor: new THREE.Color(0x00f0ff),
        glowColor: new THREE.Color(0x38bdf8),
        info: { name: 'D1 [LED: ACT / ACTIVITY]', desc: 'Real-time SoC Core Processing Pulse', voltage: '3.3V High', freq: 'Pulsing 120Hz' },
      },
      {
        x: 4.3, z: 3.2,
        baseColor: new THREE.Color(0x10b981),
        glowColor: new THREE.Color(0x34d399),
        info: { name: 'D2 [LED: PWR / 3V3 POWER]', desc: 'Clean Regulated 3.3V Power Rail Status', voltage: '3.30V DC Stable', freq: 'Continuous DC' },
      },
      {
        x: 4.8, z: 3.2,
        baseColor: new THREE.Color(0xf59e0b),
        glowColor: new THREE.Color(0xfbbf24),
        info: { name: 'D3 [LED: CLK / SYSTEM BUS]', desc: 'Master Clock Sync Indicator', voltage: '3.3V Digital', freq: 'Synchronized Bus' },
      },
      {
        x: -1.8, z: 3.4,
        baseColor: new THREE.Color(0x00d4ff),
        glowColor: new THREE.Color(0x60a5fa),
        info: { name: 'D4 [LED: TX / TELEMETRY]', desc: 'High-speed UART & Telemetry Link', voltage: '3.3V Logic', freq: 'Dynamic Baud 115200' },
      },
    ];

    leds.forEach((ld) => {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(ld.x, 0, ld.z);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), darkMat);
      base.position.y = 0.05;
      ledGroup.add(base);

      const domeMat = new THREE.MeshStandardMaterial({
        color: ld.baseColor,
        emissive: ld.baseColor,
        emissiveIntensity: 0.8,
        roughness: 0.15,
      });

      const domeGeom = new THREE.SphereGeometry(0.12, 16, 16);
      domeGeom.scale(1, 0.6, 1);
      const dome = new THREE.Mesh(domeGeom, domeMat);
      dome.position.y = 0.12;
      dome.name = ld.info.name;
      (dome as unknown as { pcbData: unknown }).pcbData = ld.info;
      ledGroup.add(dome);

      // Light casting onto board
      const light = new THREE.PointLight(ld.baseColor, 0.8, 3.0);
      light.position.set(0, 0.2, 0);
      ledGroup.add(light);

      this.interactiveLeds.push({
        mesh: dome,
        light: light,
        baseColor: ld.baseColor,
        glowColor: ld.glowColor,
        intensity: 0.8,
        targetIntensity: 0.8,
        info: ld.info,
      });

      this.pcbGroup.add(ledGroup);
    });
  }

  // 4. DENSE COPPER TRACE NETWORK (Every bend smooth rounded, dynamic bending laser pulses)
  private buildDenseCopperNetworkAndPulses() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.96,
      roughness: 0.14,
    });

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.94,
      roughness: 0.18,
    });

    const routes = getPCBTraceWaypoints();

    routes.forEach((route) => {
      // 1. Create smooth filleted curve: every corner has a smooth circular/parabolic fillet
      const curve = createSmoothFilletedCurve(route.points, 0.22);

      // 2. Extrude smooth continuous 3D ribbon trace
      const traceGeom = buildTraceRibbonGeometry(curve, 0.052, 0.014, 0.012);
      const traceMesh = new THREE.Mesh(traceGeom, route.isGold ? goldMat : copperMat);
      traceMesh.receiveShadow = true;
      traceMesh.name = 'Smooth_Filleted_Copper_Trace';
      this.pcbGroup.add(traceMesh);

      // 3. Landing contact pad at start (under IC pin foot)
      const pStart = route.points[0];
      const startPadGeom = new THREE.BoxGeometry(0.12, 0.016, 0.07);
      const startPad = new THREE.Mesh(startPadGeom, goldMat);
      startPad.position.set(pStart.x, 0.014, pStart.z);
      this.pcbGroup.add(startPad);

      // 4. Gold via / terminal pad at trace end
      const pEnd = route.points[route.points.length - 1];
      const endViaGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.018, 16);
      const endVia = new THREE.Mesh(endViaGeom, goldMat);
      endVia.position.set(pEnd.x, 0.014, pEnd.z);
      this.pcbGroup.add(endVia);

      // 5. Dynamic Laser Streak Pulse: tiny length of laser bending and rotating along copper line
      let pulseColorHex = 0x00f0ff;
      if (this.options.colorTheme === 'gold') pulseColorHex = 0xfacc15;
      else if (this.options.colorTheme === 'emerald') pulseColorHex = 0x10b981;
      else if (this.options.colorTheme === 'crimson') pulseColorHex = 0xf43f5e;

      const laser = createLaserPulseMesh(curve, pulseColorHex, route.speed);
      this.pcbGroup.add(laser.mesh);
      this.laserPulses.push(laser);
    });
  }

  // Mouse interaction & Raycasting
  private setupEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Move specular spotlight across PCB surface
      this.pointerLight.position.x = this.mouse.x * 5.0;
      this.pointerLight.position.z = -this.mouse.y * 4.0;

      this.checkRaycast(e.clientX, e.clientY);
    });

    el.addEventListener('mouseleave', () => {
      this.mouse.set(-100, -100);
      if (this.onHoverChange) this.onHoverChange(null, 0, 0);
      this.interactiveLeds.forEach((led) => (led.targetIntensity = 0.8));
    });

    el.addEventListener('click', () => {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.pcbGroup.children, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        let pcbData = (hit as unknown as { pcbData?: unknown }).pcbData;

        while (!pcbData && hit.parent && hit.parent !== this.pcbGroup && hit.parent !== this.scene) {
          hit = hit.parent;
          pcbData = (hit as unknown as { pcbData?: unknown }).pcbData;
        }

        if (pcbData) {
          this.triggerBurstPulse();
          sounds.playChipPulse();
        }
      }
    });

    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    });
  }

  private checkRaycast(clientX: number, clientY: number) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pcbGroup.children, true);

    let foundData: { name: string; desc: string; voltage: string; freq: string } | null = null;
    let hitObject: THREE.Object3D | null = null;

    if (intersects.length > 0) {
      let cur: THREE.Object3D | null = intersects[0].object;
      while (cur && cur !== this.scene) {
        const d = (cur as unknown as { pcbData?: { name: string; desc: string; voltage: string; freq: string } }).pcbData;
        if (d) {
          foundData = d;
          hitObject = cur;
          break;
        }
        cur = cur.parent;
      }
    }

    if (foundData && hitObject) {
      if (this.hoveredObject !== hitObject) {
        this.hoveredObject = hitObject;
        sounds.playLedTouch();

        // Check if hit object is an indicator LED -> flare up
        this.interactiveLeds.forEach((led) => {
          if (led.mesh === hitObject || hitObject?.name.includes('LED')) {
            led.targetIntensity = 3.5;
          } else {
            led.targetIntensity = 0.9;
          }
        });
      }
      if (this.onHoverChange) {
        this.onHoverChange(foundData, clientX, clientY);
      }
    } else {
      if (this.hoveredObject !== null) {
        this.hoveredObject = null;
        this.interactiveLeds.forEach((led) => (led.targetIntensity = 0.8));
        if (this.onHoverChange) this.onHoverChange(null, 0, 0);
      }
    }
  }

  // Trigger rapid pulse wave across traces
  public triggerBurstPulse() {
    this.laserPulses.forEach((p) => {
      const origSpeed = p.speed;
      p.speed = origSpeed * 2.8;
      p.laserLength = 0.62;
      setTimeout(() => {
        p.speed = origSpeed;
        p.laserLength = 0.38;
      }, 900);
    });

    this.interactiveLeds.forEach((led) => {
      led.targetIntensity = 4.0;
      setTimeout(() => {
        led.targetIntensity = 0.8;
      }, 700);
    });
  }

  // Update theme colors
  public setTheme(theme: 'cyan' | 'gold' | 'emerald' | 'crimson') {
    this.options.colorTheme = theme;
    let hex = 0x00f0ff;
    if (theme === 'gold') hex = 0xfacc15;
    if (theme === 'emerald') hex = 0x10b981;
    if (theme === 'crimson') hex = 0xf43f5e;

    this.rimLight.color.setHex(hex);
    this.pointerLight.color.setHex(hex);

    // Update laser pulse colors
    this.laserPulses.forEach((pulse) => {
      const colors = pulse.colorAttr.array as Float32Array;
      const baseCol = new THREE.Color(hex);
      const headCol = new THREE.Color(0xffffff);
      for (let i = 0; i < LASER_SLICES; i++) {
        const t = i / (LASER_SLICES - 1);
        const c = new THREE.Color().lerpColors(baseCol, headCol, Math.pow(t, 1.8));
        const brightness = Math.max(0.05, Math.pow(t, 1.2));
        c.multiplyScalar(brightness);
        colors[i * 6 + 0] = c.r;
        colors[i * 6 + 1] = c.g;
        colors[i * 6 + 2] = c.b;
        colors[i * 6 + 3] = c.r;
        colors[i * 6 + 4] = c.g;
        colors[i * 6 + 5] = c.b;
      }
      pulse.colorAttr.needsUpdate = true;
    });
  }

  // Animation Loop: animates travelling laser pulses along curved traces
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.controls.update();

    // 1. Advance dynamic laser pulses along curved traces (bending with rounded corners)
    this.laserPulses.forEach((pulse) => {
      updateLaserPulse(pulse, delta, this.options.pulseSpeed);
    });

    // 2. Animate LED state
    this.interactiveLeds.forEach((led, idx) => {
      const idleBreathing = 0.15 * Math.sin(time * 3 + idx * 1.5);
      const target = led.targetIntensity + idleBreathing;
      led.intensity = THREE.MathUtils.lerp(led.intensity, target, delta * 10);

      const mat = led.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = led.intensity;
      led.light.intensity = led.intensity * 0.8;
    });

    // 3. Render
    this.composer.render();
  }

  // Export 3D .GLB Binary Model
  public exportGLB(filename = 'aavesh-pcb-custom.glb') {
    const exporter = new GLTFExporter();
    exporter.parse(
      this.pcbGroup,
      (glb) => {
        const blob = new Blob([glb as ArrayBuffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      },
      (err) => {
        console.error('Failed to export GLB:', err);
      },
      { binary: true }
    );
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
  }
}

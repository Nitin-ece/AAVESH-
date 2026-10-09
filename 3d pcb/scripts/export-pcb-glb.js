import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Complete FileReader polyfill for Node.js
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      const base64 = Buffer.from(buf).toString('base64');
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
}
global.FileReader = FileReaderPolyfill;

console.log('Building realistic 3D AAVESH PCB model with white logo and dense trace network...');

const scene = new THREE.Scene();
scene.name = 'AAVESH_PCB_Root';

// --- Shared Materials ---
const matPCBSubstrate = new THREE.MeshStandardMaterial({
  color: 0x071526, // Deep rich navy/indigo matte solder mask
  roughness: 0.45,
  metalness: 0.22,
});

const matGoldENIG = new THREE.MeshStandardMaterial({
  color: 0xfacc15, // Electroless Nickel Immersion Gold (ENIG)
  roughness: 0.15,
  metalness: 0.96,
});

const matCopper = new THREE.MeshStandardMaterial({
  color: 0xd97706,
  roughness: 0.2,
  metalness: 0.92,
});

const matSilverPin = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0, // Tinned metallic solder pins
  roughness: 0.14,
  metalness: 0.98,
});

const matDarkEpoxy = new THREE.MeshStandardMaterial({
  color: 0x090d14, // Matte black molded epoxy IC body
  roughness: 0.38,
  metalness: 0.12,
});

const matSilkscreenWhite = new THREE.MeshStandardMaterial({
  color: 0xffffff, // Pure White Silkscreen
  roughness: 0.28,
  metalness: 0.05,
});

const matCapacitorCeramic = new THREE.MeshStandardMaterial({
  color: 0x936138, // Tan/caramel ceramic MLCC dielectric
  roughness: 0.52,
  metalness: 0.1,
});

const matResistorBody = new THREE.MeshStandardMaterial({
  color: 0x05070a, // Glazed black ceramic resistor body
  roughness: 0.22,
  metalness: 0.25,
});

const matNickelMetal = new THREE.MeshStandardMaterial({
  color: 0xd1d5db, // Polished nickel metal can
  roughness: 0.12,
  metalness: 0.98,
});

const matBlackPlastic = new THREE.MeshStandardMaterial({
  color: 0x111827, // Shrouded header black PBT plastic
  roughness: 0.6,
  metalness: 0.1,
});

const matNeonCyanGlow = new THREE.MeshStandardMaterial({
  color: 0x00f0ff,
  roughness: 0.15,
  metalness: 0.7,
});

const matLEDActiveCyan = new THREE.MeshStandardMaterial({
  color: 0x00f0ff,
  roughness: 0.1,
  metalness: 0.2,
});

const matLEDActiveGreen = new THREE.MeshStandardMaterial({
  color: 0x10b981,
  roughness: 0.1,
  metalness: 0.2,
});

const matLEDActiveAmber = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  roughness: 0.1,
  metalness: 0.2,
});

// Helper: Rounded Rectangle Extrusion for PCB Substrate
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

// 1. PCB Main Substrate Board
const boardWidth = 12.0;
const boardLength = 9.6;
const boardThickness = 0.22;
const cornerRadius = 0.6;
const holeRadius = 0.28;

const holeOffsets = [
  [-5.3, -4.1],
  [5.3, -4.1],
  [-5.3, 4.1],
  [5.3, 4.1],
];

// Smooth rounded board shape with 4 smooth circular corner holes
const boardShape = new THREE.Shape();
const bx = -boardWidth / 2;
const by = -boardLength / 2;
boardShape.moveTo(bx + cornerRadius, by);
boardShape.lineTo(bx + boardWidth - cornerRadius, by);
boardShape.absarc(bx + boardWidth - cornerRadius, by + cornerRadius, cornerRadius, -Math.PI / 2, 0, false);
boardShape.lineTo(bx + boardWidth, by + boardLength - cornerRadius);
boardShape.absarc(bx + boardWidth - cornerRadius, by + boardLength - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
boardShape.lineTo(bx + cornerRadius, by + boardLength);
boardShape.absarc(bx + cornerRadius, by + boardLength - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
boardShape.lineTo(bx, by + cornerRadius);
boardShape.absarc(bx + cornerRadius, by + cornerRadius, cornerRadius, Math.PI, (3 * Math.PI) / 2, false);

// Cut true physical through-holes through the board!
holeOffsets.forEach(([hx, hz]) => {
  const holePath = new THREE.Path();
  holePath.absarc(hx, hz, holeRadius, 0, Math.PI * 2, true);
  boardShape.holes.push(holePath);
});

// Silky smooth geometry with 64 curveSegments and 8 bevelSegments
const boardGeom = new THREE.ExtrudeGeometry(boardShape, {
  depth: boardThickness,
  bevelEnabled: true,
  bevelSegments: 8,
  curveSegments: 64,
  steps: 1,
  bevelSize: 0.04,
  bevelThickness: 0.04,
});
boardGeom.rotateX(Math.PI / 2); // Lay flat on XZ plane
const pcbMesh = new THREE.Mesh(boardGeom, matPCBSubstrate);
pcbMesh.position.y = -boardThickness;
pcbMesh.name = 'PCB_Substrate';
scene.add(pcbMesh);

// 2. Corner Gold Annular Rings & Plated Copper Barrels lining the holes
holeOffsets.forEach(([hx, hz], idx) => {
  const holeGroup = new THREE.Group();
  holeGroup.position.set(hx, 0.01, hz);
  holeGroup.name = `Mounting_Hole_${idx + 1}`;

  // Top surface gold ring
  const topRing = new THREE.Mesh(new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48), matGoldENIG);
  topRing.rotateX(-Math.PI / 2);
  holeGroup.add(topRing);

  // Bottom surface gold ring
  const botRing = new THREE.Mesh(new THREE.RingGeometry(holeRadius, holeRadius + 0.18, 48), matGoldENIG);
  botRing.rotateX(Math.PI / 2);
  botRing.position.y = -boardThickness - 0.02;
  holeGroup.add(botRing);

  // Plated copper barrel inside hole wall
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(holeRadius, holeRadius, boardThickness + 0.06, 48, 1, true),
    matCopper
  );
  barrel.position.y = -boardThickness / 2;
  holeGroup.add(barrel);

  scene.add(holeGroup);
});

// 3. Central AIC Microcontroller (AAVESH SOC-M7) with EMBEDDED SYMMETRIC PURE WHITE LOGO
const chipGroup = new THREE.Group();
chipGroup.position.set(0, 0, 0);
chipGroup.name = 'AIC_AAVESH_Microprocessor';

// Main chip package body (molded epoxy)
const chipBodyGeom = new THREE.BoxGeometry(3.6, 0.32, 3.6);
const chipBodyMesh = new THREE.Mesh(chipBodyGeom, matDarkEpoxy);
chipBodyMesh.position.y = 0.16;
chipBodyMesh.name = 'Chip_Body';
chipGroup.add(chipBodyMesh);

// Pin 1 Index Dot (White Silkscreen Dimple)
const pin1Geom = new THREE.CylinderGeometry(0.12, 0.12, 0.005, 24);
const pin1Mesh = new THREE.Mesh(pin1Geom, matSilkscreenWhite);
pin1Mesh.position.set(-1.4, 0.322, -1.4);
chipGroup.add(pin1Mesh);

// --- EXACT EMBEDDED PURE WHITE AAVESH LOGO (MATCHING REFERENCE IMAGE) ---
const aaveshLogoPts = [
  new THREE.Vector2(0, 0.75),        // P0: Top Apex
  new THREE.Vector2(0.838, -0.75),   // P1: Bottom Right Outer
  new THREE.Vector2(0.535, -0.75),   // P2: Bottom Right Inner
  new THREE.Vector2(0, 0.239),       // P3: Inner Apex
  new THREE.Vector2(-0.419, -0.536), // P4: Inner Bottom-Left
  new THREE.Vector2(0.209, -0.536),  // P5: Bar End Top
  new THREE.Vector2(0.325, -0.75),   // P6: Bar End Bottom
  new THREE.Vector2(-0.838, -0.75),  // P7: Bottom Left Outer
];
const aaveshLogoShape = new THREE.Shape(aaveshLogoPts);

// Flush embedded onto chip surface (depth 0.005)
const logoExtrudeGeom = new THREE.ExtrudeGeometry(aaveshLogoShape, {
  depth: 0.005,
  bevelEnabled: false,
  curveSegments: 32,
});
logoExtrudeGeom.rotateX(-Math.PI / 2);
const logoMesh = new THREE.Mesh(logoExtrudeGeom, matSilkscreenWhite);
logoMesh.position.set(0, 0.321, 0); // Perfectly centered at (0, 0)
logoMesh.name = 'AAVESH_Embedded_Logo';
chipGroup.add(logoMesh);

// 64 Gull-wing metallic solder pins (16 per side)
function createGullWingPin() {
  const pinGroup = new THREE.Group();
  const upperGeom = new THREE.BoxGeometry(0.3, 0.04, 0.08);
  const upper = new THREE.Mesh(upperGeom, matSilverPin);
  upper.position.set(0.15, 0.12, 0);
  pinGroup.add(upper);

  const kneeGeom = new THREE.BoxGeometry(0.16, 0.12, 0.08);
  kneeGeom.rotateZ(-Math.PI / 4);
  const knee = new THREE.Mesh(kneeGeom, matSilverPin);
  knee.position.set(0.34, 0.06, 0);
  pinGroup.add(knee);

  const footGeom = new THREE.BoxGeometry(0.24, 0.03, 0.08);
  const foot = new THREE.Mesh(footGeom, matSilverPin);
  foot.position.set(0.48, 0.015, 0);
  pinGroup.add(foot);

  return pinGroup;
}

const pinsPerSide = 16;
const chipHalfSize = 1.8;
const pinSpacing = 3.0 / (pinsPerSide - 1);

for (let i = 0; i < pinsPerSide; i++) {
  const offset = -1.5 + i * pinSpacing;

  const pinE = createGullWingPin();
  pinE.position.set(chipHalfSize, 0, offset);
  chipGroup.add(pinE);

  const pinW = createGullWingPin();
  pinW.rotation.y = Math.PI;
  pinW.position.set(-chipHalfSize, 0, offset);
  chipGroup.add(pinW);

  const pinS = createGullWingPin();
  pinS.rotation.y = Math.PI / 2;
  pinS.position.set(offset, 0, chipHalfSize);
  chipGroup.add(pinS);

  const pinN = createGullWingPin();
  pinN.rotation.y = -Math.PI / 2;
  pinN.position.set(offset, 0, -chipHalfSize);
  chipGroup.add(pinN);
}

scene.add(chipGroup);

// 4. Polished HC-49SMD Crystal Oscillator (Metallic Pill Can)
const crystalGroup = new THREE.Group();
crystalGroup.position.set(3.5, 0, -2.4);
crystalGroup.name = 'Crystal_Oscillator_16MHz';

const canShape = new THREE.Shape();
canShape.absarc(-0.4, 0, 0.28, Math.PI / 2, (3 * Math.PI) / 2, false);
canShape.absarc(0.4, 0, 0.28, -Math.PI / 2, Math.PI / 2, false);
canShape.closePath();

const canGeom = new THREE.ExtrudeGeometry(canShape, {
  depth: 0.45,
  bevelEnabled: true,
  bevelSegments: 3,
  bevelSize: 0.04,
  bevelThickness: 0.04,
});
canGeom.rotateX(-Math.PI / 2);
const canMesh = new THREE.Mesh(canGeom, matNickelMetal);
canMesh.position.y = 0.05;
crystalGroup.add(canMesh);

const cTabGeom = new THREE.BoxGeometry(0.35, 0.04, 0.2);
const cTab1 = new THREE.Mesh(cTabGeom, matSilverPin);
cTab1.position.set(-0.7, 0.02, 0);
const cTab2 = new THREE.Mesh(cTabGeom, matSilverPin);
cTab2.position.set(0.7, 0.02, 0);
crystalGroup.add(cTab1);
crystalGroup.add(cTab2);
scene.add(crystalGroup);

// 5. USB Type-C Receptacle (Precision CNC Metal Shell)
const usbGroup = new THREE.Group();
usbGroup.position.set(-2.5, 0, -4.3);
usbGroup.name = 'USB_Type_C_Connector';

const usbBodyGeom = new THREE.BoxGeometry(1.6, 0.65, 1.4);
const usbBodyMesh = new THREE.Mesh(usbBodyGeom, matNickelMetal);
usbBodyMesh.position.y = 0.325;
usbGroup.add(usbBodyMesh);

const cavityGeom = new THREE.BoxGeometry(1.3, 0.42, 0.6);
const cavityMesh = new THREE.Mesh(cavityGeom, matDarkEpoxy);
cavityMesh.position.set(0, 0.325, -0.45);
usbGroup.add(cavityMesh);

const tongueGeom = new THREE.BoxGeometry(1.0, 0.08, 0.45);
const tongueMesh = new THREE.Mesh(tongueGeom, matGoldENIG);
tongueMesh.position.set(0, 0.325, -0.4);
usbGroup.add(tongueMesh);

const tabGeom = new THREE.BoxGeometry(0.12, 0.4, 0.35);
[-0.85, 0.85].forEach((tx) => {
  const tab = new THREE.Mesh(tabGeom, matSilverPin);
  tab.position.set(tx, 0.15, 0.2);
  usbGroup.add(tab);
});
scene.add(usbGroup);

// 6. Dual-Row Gold Pin Header (2x8 GPIO)
const headerGroup = new THREE.Group();
headerGroup.position.set(4.9, 0, 0);
headerGroup.name = 'GPIO_Pin_Header_2x8';

const shroudGeom = new THREE.BoxGeometry(0.65, 0.5, 3.8);
const shroudMesh = new THREE.Mesh(shroudGeom, matBlackPlastic);
shroudMesh.position.y = 0.25;
headerGroup.add(shroudMesh);

const pinGeom = new THREE.BoxGeometry(0.08, 1.3, 0.08);
for (let row = -0.15; row <= 0.15; row += 0.3) {
  for (let col = -1.6; col <= 1.6; col += 0.44) {
    const pin = new THREE.Mesh(pinGeom, matGoldENIG);
    pin.position.set(row, 0.65, col);
    headerGroup.add(pin);
  }
}
scene.add(headerGroup);

// 7. Auxiliary IC: SOIC-8 SPI Flash Memory
const flashGroup = new THREE.Group();
flashGroup.position.set(-3.8, 0, -0.6);
flashGroup.name = 'IC_SPI_Flash';

const flashBodyGeom = new THREE.BoxGeometry(0.9, 0.22, 0.7);
const flashBody = new THREE.Mesh(flashBodyGeom, matDarkEpoxy);
flashBody.position.y = 0.11;
flashGroup.add(flashBody);

const fDotGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
const fDot = new THREE.Mesh(fDotGeom, matSilkscreenWhite);
fDot.position.set(-0.32, 0.22, -0.22);
flashGroup.add(fDot);

[-0.3, -0.1, 0.1, 0.3].forEach((fx) => {
  const fPinGeom = new THREE.BoxGeometry(0.08, 0.04, 0.22);
  const p1 = new THREE.Mesh(fPinGeom, matSilverPin);
  p1.position.set(fx, 0.05, -0.42);
  const p2 = new THREE.Mesh(fPinGeom, matSilverPin);
  p2.position.set(fx, 0.05, 0.42);
  flashGroup.add(p1);
  flashGroup.add(p2);
});
scene.add(flashGroup);

// 8. SOT-223 Voltage Regulator (AMS1117 3.3V)
const regGroup = new THREE.Group();
regGroup.position.set(-4.2, 0, -2.5);
regGroup.name = 'Voltage_Regulator_SOT223';

const regBodyGeom = new THREE.BoxGeometry(1.1, 0.26, 0.75);
const regBody = new THREE.Mesh(regBodyGeom, matDarkEpoxy);
regBody.position.y = 0.13;
regGroup.add(regBody);

const tabGeom2 = new THREE.BoxGeometry(0.7, 0.05, 0.35);
const tabMesh2 = new THREE.Mesh(tabGeom2, matSilverPin);
tabMesh2.position.set(0, 0.05, -0.45);
regGroup.add(tabMesh2);

[-0.35, 0, 0.35].forEach((lx) => {
  const lGeom = new THREE.BoxGeometry(0.12, 0.04, 0.3);
  const lMesh = new THREE.Mesh(lGeom, matSilverPin);
  lMesh.position.set(lx, 0.04, 0.45);
  regGroup.add(lMesh);
});
scene.add(regGroup);

// Helper for SMD 0603 / 0805 Capacitor with solder pads
function createSMDCapacitor(x, z, rotY = 0) {
  const cap = new THREE.Group();
  cap.position.set(x, 0, z);
  cap.rotation.y = rotY;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.15), matCapacitorCeramic);
  body.position.y = 0.065;
  cap.add(body);

  const capEndGeom = new THREE.BoxGeometry(0.06, 0.14, 0.155);
  const end1 = new THREE.Mesh(capEndGeom, matSilverPin);
  end1.position.set(-0.12, 0.065, 0);
  const end2 = new THREE.Mesh(capEndGeom, matSilverPin);
  end2.position.set(0.12, 0.065, 0);
  cap.add(end1, end2);

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.016, 0.18), matGoldENIG);
  pad1.position.set(-0.13, 0.008, 0);
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.016, 0.18), matGoldENIG);
  pad2.position.set(0.13, 0.008, 0);
  cap.add(pad1, pad2);

  return cap;
}

// Helper for SMD Resistor with solder pads
function createSMDResistor(x, z, rotY = 0) {
  const res = new THREE.Group();
  res.position.set(x, 0, z);
  res.rotation.y = rotY;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.13), matResistorBody);
  body.position.y = 0.045;
  res.add(body);

  const resEndGeom = new THREE.BoxGeometry(0.05, 0.1, 0.135);
  const end1 = new THREE.Mesh(resEndGeom, matSilverPin);
  end1.position.set(-0.11, 0.045, 0);
  const end2 = new THREE.Mesh(resEndGeom, matSilverPin);
  end2.position.set(0.11, 0.045, 0);
  res.add(end1, end2);

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), matGoldENIG);
  pad1.position.set(-0.12, 0.008, 0);
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.16), matGoldENIG);
  pad2.position.set(0.12, 0.008, 0);
  res.add(pad1, pad2);

  return res;
}

// Helper for SMD Diode (SOD-123 with white cathode band and solder pads)
function createSMDDiode(x, z, rotY = 0) {
  const diode = new THREE.Group();
  diode.position.set(x, 0, z);
  diode.rotation.y = rotY;

  const diodeMat = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.35, metalness: 0.15 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.16), diodeMat);
  body.position.y = 0.06;
  diode.add(body);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.125, 0.165), bandMat);
  band.position.set(-0.10, 0.06, 0);
  diode.add(band);

  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), matSilverPin);
  l1.position.set(-0.18, 0.02, 0);
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), matSilverPin);
  l2.position.set(0.18, 0.02, 0);
  diode.add(l1, l2);

  const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.016, 0.18), matGoldENIG);
  pad1.position.set(-0.18, 0.008, 0);
  const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.016, 0.18), matGoldENIG);
  pad2.position.set(0.18, 0.008, 0);
  diode.add(pad1, pad2);

  return diode;
}

// 9. Authentic SMD Electronic Component Placements (29 Components directly on traces)
const smdComponents = [
  // 15 SMD Resistors (East damping, West Flash, LED series)
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ type: 'resistor', x: 2.7, z: -1.35 + i * 0.32, rot: 0 })),
  ...[0, 1, 2, 3].map((i) => ({ type: 'resistor', x: -2.7, z: -1.35 + i * 0.30, rot: 0 })),
  { type: 'resistor', x: 3.8, z: 2.4, rot: Math.PI / 2 },
  { type: 'resistor', x: 4.3, z: 2.4, rot: Math.PI / 2 },
  { type: 'resistor', x: 4.8, z: 2.4, rot: Math.PI / 2 },
  { type: 'resistor', x: -1.8, z: 2.8, rot: Math.PI / 2 },

  // 10 SMD Ceramic Capacitors (4 IC corners, 2 Crystal load, 4 West filter array)
  { type: 'capacitor', x: -1.85, z: -1.85, rot: Math.PI / 4 },
  { type: 'capacitor', x: 1.85, z: -1.85, rot: -Math.PI / 4 },
  { type: 'capacitor', x: -1.85, z: 1.85, rot: -Math.PI / 4 },
  { type: 'capacitor', x: 1.85, z: 1.85, rot: Math.PI / 4 },
  { type: 'capacitor', x: 2.85, z: -3.0, rot: 0 },
  { type: 'capacitor', x: 3.45, z: -3.0, rot: 0 },
  ...[4, 5, 6, 7].map((i) => ({ type: 'capacitor', x: -4.3, z: 0.20 + (i - 4) * 0.35, rot: 0 })),

  // 4 SMD Diodes (2 USB ESD clamping, 1 VBUS Schottky, 1 3.3V rail clamp)
  { type: 'diode', x: -2.05, z: -3.3, rot: Math.PI / 2 },
  { type: 'diode', x: -1.70, z: -3.3, rot: Math.PI / 2 },
  { type: 'diode', x: -2.40, z: -3.3, rot: Math.PI / 2 },
  { type: 'diode', x: 0.5, z: 3.2, rot: Math.PI / 2 },
];

smdComponents.forEach((c) => {
  if (c.type === 'resistor') scene.add(createSMDResistor(c.x, c.z, c.rot));
  else if (c.type === 'capacitor') scene.add(createSMDCapacitor(c.x, c.z, c.rot));
  else if (c.type === 'diode') scene.add(createSMDDiode(c.x, c.z, c.rot));
});

// 10. Status Diagnostic LEDs
const ledDefs = [
  { x: 3.8, z: 3.2, color: 'Cyan', mat: matLEDActiveCyan, name: 'LED_ACT_Cyan' },
  { x: 4.3, z: 3.2, color: 'Green', mat: matLEDActiveGreen, name: 'LED_PWR_Green' },
  { x: 4.8, z: 3.2, color: 'Amber', mat: matLEDActiveAmber, name: 'LED_CLK_Amber' },
  { x: -1.8, z: 3.4, color: 'Cyan', mat: matLEDActiveCyan, name: 'LED_TX_Cyan' },
];

ledDefs.forEach((def) => {
  const ledGroup = new THREE.Group();
  ledGroup.position.set(def.x, 0, def.z);
  ledGroup.name = def.name;

  const baseGeom = new THREE.BoxGeometry(0.3, 0.1, 0.2);
  const baseMesh = new THREE.Mesh(baseGeom, matDarkEpoxy);
  baseMesh.position.y = 0.05;
  ledGroup.add(baseMesh);

  const domeGeom = new THREE.SphereGeometry(0.12, 16, 16);
  domeGeom.scale(1, 0.6, 1);
  const domeMesh = new THREE.Mesh(domeGeom, def.mat);
  domeMesh.position.y = 0.12;
  domeMesh.name = 'LED_Dome';
  ledGroup.add(domeMesh);

  const padGeom = new THREE.BoxGeometry(0.08, 0.03, 0.22);
  const p1 = new THREE.Mesh(padGeom, matSilverPin);
  p1.position.set(-0.16, 0.015, 0);
  const p2 = new THREE.Mesh(padGeom, matSilverPin);
  p2.position.set(0.16, 0.015, 0);
  ledGroup.add(p1);
  ledGroup.add(p2);

  scene.add(ledGroup);
});

// 11. DENSE COPPER TRACE NETWORK (Every bend smooth rounded with filleted corners)
function createSmoothFilletedCurve(waypoints, filletRadius = 0.22) {
  const curvePath = new THREE.CurvePath();
  if (waypoints.length < 2) return curvePath;
  if (waypoints.length === 2) {
    curvePath.add(new THREE.LineCurve3(waypoints[0], waypoints[1]));
    return curvePath;
  }

  let currentStart = waypoints[0].clone();

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    const vIn = new THREE.Vector3().subVectors(curr, prev);
    const vOut = new THREE.Vector3().subVectors(next, curr);

    const lenIn = vIn.length();
    const lenOut = vOut.length();
    const maxR = Math.min(lenIn * 0.45, lenOut * 0.45, filletRadius);

    if (maxR < 0.015) {
      curvePath.add(new THREE.LineCurve3(currentStart, curr));
      currentStart = curr.clone();
      continue;
    }

    const dirIn = vIn.clone().normalize();
    const dirOut = vOut.clone().normalize();

    const cornerStart = new THREE.Vector3().copy(curr).sub(dirIn.clone().multiplyScalar(maxR));
    const cornerEnd = new THREE.Vector3().copy(curr).add(dirOut.clone().multiplyScalar(maxR));

    if (currentStart.distanceTo(cornerStart) > 0.005) {
      curvePath.add(new THREE.LineCurve3(currentStart, cornerStart));
    }

    curvePath.add(new THREE.QuadraticBezierCurve3(cornerStart, curr, cornerEnd));
    currentStart = cornerEnd.clone();
  }

  const last = waypoints[waypoints.length - 1];
  if (currentStart.distanceTo(last) > 0.005) {
    curvePath.add(new THREE.LineCurve3(currentStart, last));
  }

  return curvePath;
}

function buildTraceRibbonGeometry(curve, width = 0.052, height = 0.014, yBase = 0.012, minSegments = 32) {
  const curveLength = curve.getLength();
  const segments = Math.max(minSegments, Math.floor(curveLength * 28));
  const points = curve.getSpacedPoints(segments);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const halfW = width * 0.5;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const u = i / (points.length - 1);
    const tangent = curve.getTangentAt(Math.min(0.9999, Math.max(0.0001, u)));
    const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const pL_top = new THREE.Vector3(p.x + norm.x * halfW, yBase + height, p.z + norm.z * halfW);
    const pR_top = new THREE.Vector3(p.x - norm.x * halfW, yBase + height, p.z - norm.z * halfW);
    const pL_bot = new THREE.Vector3(p.x + norm.x * halfW, yBase, p.z + norm.z * halfW);
    const pR_bot = new THREE.Vector3(p.x - norm.x * halfW, yBase, p.z - norm.z * halfW);

    positions.push(pL_top.x, pL_top.y, pL_top.z);
    positions.push(pR_top.x, pR_top.y, pR_top.z);
    positions.push(pL_bot.x, pL_bot.y, pL_bot.z);
    positions.push(pR_bot.x, pR_bot.y, pR_bot.z);

    normals.push(0, 1, 0,  0, 1, 0,  norm.x, 0, norm.z,  -norm.x, 0, -norm.z);
    uvs.push(0, u,  1, u,  0, u,  1, u);

    if (i < points.length - 1) {
      const c = i * 4;
      const n = (i + 1) * 4;
      indices.push(c + 0, n + 0, n + 1);
      indices.push(c + 0, n + 1, c + 1);
      indices.push(c + 2, n + 2, n + 0);
      indices.push(c + 2, n + 0, c + 0);
      indices.push(c + 1, n + 1, n + 3);
      indices.push(c + 1, n + 3, c + 3);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  return geom;
}

// Generate all STRICTLY PLANAR NON-CROSSING trace routes (0 conflicts)
const allRoutes = [];

// East Bus (Pins 0..6 to GPIO header, Pins 7..9 concentric turns to LEDs D3, D2, D1)
for (let i = 0; i < 7; i++) {
  const zPin = -1.35 + i * 0.32;
  const zEnd = -1.45 + i * 0.38;
  allRoutes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, zPin),
      new THREE.Vector3(2.7, 0.012, zPin),
      new THREE.Vector3(3.2, 0.012, zPin),
      new THREE.Vector3(3.8, 0.012, zEnd),
      new THREE.Vector3(4.8, 0.012, zEnd),
    ],
    isGold: i % 2 === 0,
  });
}

allRoutes.push({
  points: [
    new THREE.Vector3(2.1, 0.012, 0.89),
    new THREE.Vector3(2.7, 0.012, 0.89),
    new THREE.Vector3(4.8, 0.012, 0.89),
    new THREE.Vector3(4.8, 0.012, 3.1),
  ],
  isGold: true,
});

allRoutes.push({
  points: [
    new THREE.Vector3(2.1, 0.012, 1.21),
    new THREE.Vector3(2.7, 0.012, 1.21),
    new THREE.Vector3(4.3, 0.012, 1.21),
    new THREE.Vector3(4.3, 0.012, 3.1),
  ],
  isGold: true,
});

allRoutes.push({
  points: [
    new THREE.Vector3(2.1, 0.012, 1.53),
    new THREE.Vector3(2.7, 0.012, 1.53),
    new THREE.Vector3(3.8, 0.012, 1.53),
    new THREE.Vector3(3.8, 0.012, 3.1),
  ],
  isGold: true,
});

// West Bus (Pins 0..3 to Flash U2, Pins 4..9 to Decoupling & Power bus)
for (let i = 0; i < 4; i++) {
  const zPin = -1.35 + i * 0.30;
  allRoutes.push({
    points: [
      new THREE.Vector3(-2.1, 0.012, zPin),
      new THREE.Vector3(-2.7, 0.012, zPin),
      new THREE.Vector3(-3.4, 0.012, zPin),
      new THREE.Vector3(-4.2, 0.012, zPin),
    ],
    isGold: i % 2 === 0,
  });
}

for (let i = 4; i < 10; i++) {
  const zPin = -1.35 + i * 0.30;
  const zOut = 0.20 + (i - 4) * 0.35;
  allRoutes.push({
    points: [
      new THREE.Vector3(-2.1, 0.012, zPin),
      new THREE.Vector3(-2.8, 0.012, zPin),
      new THREE.Vector3(-3.5, 0.012, zOut),
      new THREE.Vector3(-4.5, 0.012, zOut),
    ],
    isGold: i % 3 === 0,
  });
}

// North Bus (Pins 0..3 to USB-C J1, Pins 4..7 to Crystal Y1)
for (let i = 0; i < 4; i++) {
  const xPin = -1.35 + i * 0.35;
  const xUsb = -2.40 + i * 0.35;
  allRoutes.push({
    points: [
      new THREE.Vector3(xPin, 0.012, -2.1),
      new THREE.Vector3(xPin, 0.012, -2.7),
      new THREE.Vector3(xUsb, 0.012, -3.3),
      new THREE.Vector3(xUsb, 0.012, -3.9),
    ],
    isGold: i % 2 === 0,
  });
}

for (let i = 4; i < 8; i++) {
  const xPin = -1.35 + i * 0.35;
  const zTurn = -3.15 + (i - 4) * 0.25;
  allRoutes.push({
    points: [
      new THREE.Vector3(xPin, 0.012, -2.1),
      new THREE.Vector3(xPin, 0.012, zTurn),
      new THREE.Vector3(4.2, 0.012, zTurn),
    ],
    isGold: true,
  });
}

// South Bus (Pin 0 to LED D4, Pins 1..7 to Test points)
allRoutes.push({
  points: [
    new THREE.Vector3(-1.35, 0.012, 2.1),
    new THREE.Vector3(-1.35, 0.012, 2.6),
    new THREE.Vector3(-1.8, 0.012, 3.0),
    new THREE.Vector3(-1.8, 0.012, 3.3),
  ],
  isGold: true,
});

for (let i = 1; i < 8; i++) {
  const xPin = -1.35 + i * 0.35;
  const xEnd = -1.15 + (i - 1) * 0.40;
  allRoutes.push({
    points: [
      new THREE.Vector3(xPin, 0.012, 2.1),
      new THREE.Vector3(xPin, 0.012, 2.7),
      new THREE.Vector3(xEnd, 0.012, 3.2),
      new THREE.Vector3(xEnd, 0.012, 3.7),
    ],
    isGold: i % 2 === 0,
  });
}

allRoutes.forEach((route) => {
  const curve = createSmoothFilletedCurve(route.points, 0.22);
  const geom = buildTraceRibbonGeometry(curve, 0.052, 0.014, 0.012);
  const mesh = new THREE.Mesh(geom, route.isGold ? matGoldENIG : matCopper);
  mesh.name = 'Smooth_Copper_Trace';
  scene.add(mesh);

  // Landing contact pad under IC pin foot
  const pStart = route.points[0];
  const startPadGeom = new THREE.BoxGeometry(0.12, 0.016, 0.07);
  const startPad = new THREE.Mesh(startPadGeom, matGoldENIG);
  startPad.position.set(pStart.x, 0.014, pStart.z);
  scene.add(startPad);

  // Terminal via pad at trace end
  const pEnd = route.points[route.points.length - 1];
  const endViaGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.018, 16);
  const endVia = new THREE.Mesh(endViaGeom, matGoldENIG);
  endVia.position.set(pEnd.x, 0.014, pEnd.z);
  scene.add(endVia);
});

// 12. Test Points with Annular Gold Rings
const testPoints = [
  { x: 3.2, z: 2.0, name: 'TP1_CLK' },
  { x: 3.5, z: 2.3, name: 'TP2_DATA' },
  { x: -3.0, z: 2.2, name: 'TP3_3V3' },
  { x: -3.4, z: 2.5, name: 'TP4_GND' },
];
testPoints.forEach((tp) => {
  const tpGroup = new THREE.Group();
  tpGroup.position.set(tp.x, 0.012, tp.z);
  tpGroup.name = tp.name;

  const ringGeom = new THREE.RingGeometry(0.06, 0.16, 24);
  ringGeom.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeom, matGoldENIG);
  tpGroup.add(ring);

  const dotGeom = new THREE.CircleGeometry(0.04, 16);
  dotGeom.rotateX(-Math.PI / 2);
  const dot = new THREE.Mesh(dotGeom, matGoldENIG);
  dot.position.y = 0.002;
  tpGroup.add(dot);

  scene.add(tpGroup);
});

console.log('Scene assembled successfully! Total objects in scene:', scene.children.length);

// Export to GLB
const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (glb) => {
    const glbBuffer = Buffer.from(glb);
    const targetDir = 'c:/Users/mishr/Downloads/3d pcb';
    const outputPath = path.join(targetDir, 'aavesh-pcb.glb');
    const publicPath = path.join(targetDir, 'public', 'aavesh-pcb.glb');
    const distPath = path.join(targetDir, 'dist', 'aavesh-pcb.glb');
    const websitePublicPath = 'C:/Users/mishr/Downloads/UI_UX Design Specification/public/aavesh-pcb.glb';

    fs.writeFileSync(outputPath, glbBuffer);
    console.log(`[SUCCESS] Generated ${outputPath} (${glbBuffer.byteLength} bytes)`);

    try {
      fs.writeFileSync(publicPath, glbBuffer);
      console.log(`[SUCCESS] Copied to ${publicPath}`);
    } catch (e) {
      console.warn('Could not copy to public:', e.message);
    }

    try {
      fs.writeFileSync(distPath, glbBuffer);
      console.log(`[SUCCESS] Copied to ${distPath}`);
    } catch (e) {
      console.warn('Could not copy to dist:', e.message);
    }

    try {
      fs.writeFileSync(websitePublicPath, glbBuffer);
      console.log(`[SUCCESS] Copied to website: ${websitePublicPath}`);
    } catch (e) {
      console.warn('Could not copy to website public:', e.message);
    }
  },
  (err) => {
    console.error('Export Error:', err);
  },
  { binary: true }
);

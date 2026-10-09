import * as THREE from 'three';

function ccw(A, B, C) {
  return (C.z - A.z) * (B.x - A.x) > (B.z - A.z) * (C.x - A.x);
}
function intersect(A, B, C, D) {
  return (ccw(A, C, D) !== ccw(B, C, D)) && (ccw(A, B, C) !== ccw(A, B, D));
}

export function generatePlanarRoutes() {
  const routes = [];

  // ==========================================
  // 1. EAST BUS (Chip East pins: X=2.1, 10 pins)
  // Pins 0..6 -> GPIO Header (X=4.8)
  // Pins 7..9 -> LEDs D3 (4.8), D2 (4.3), D1 (3.8) at Z=3.1
  // ==========================================
  for (let i = 0; i < 7; i++) {
    const zPin = -1.35 + i * 0.32; // -1.35 to 0.57
    const zEnd = -1.45 + i * 0.38; // -1.45 to 0.83 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(2.1, 0.012, zPin),
        new THREE.Vector3(2.7, 0.012, zPin), // inline series resistor at X=2.8
        new THREE.Vector3(3.2, 0.012, zPin),
        new THREE.Vector3(3.8, 0.012, zEnd),
        new THREE.Vector3(4.8, 0.012, zEnd),
      ],
      isGold: i % 2 === 0,
      speed: 0.65 + (i % 3) * 0.1,
    });
  }

  // Pins 7, 8, 9 nested L-corners:
  // Pin 7 (Z=0.89) goes furthest East to X=4.8, then South to LED D3 (4.8, 3.1)
  // Pin 8 (Z=1.21) goes middle East to X=4.3, then South to LED D2 (4.3, 3.1)
  // Pin 9 (Z=1.53) goes nearest East to X=3.8, then South to LED D1 (3.8, 3.1)
  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 0.89),
      new THREE.Vector3(2.7, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 0.89),
      new THREE.Vector3(4.8, 0.012, 3.1), // LED D3
    ],
    isGold: true,
    speed: 0.70,
  });

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.21),
      new THREE.Vector3(2.7, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 1.21),
      new THREE.Vector3(4.3, 0.012, 3.1), // LED D2
    ],
    isGold: true,
    speed: 0.75,
  });

  routes.push({
    points: [
      new THREE.Vector3(2.1, 0.012, 1.53),
      new THREE.Vector3(2.7, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 1.53),
      new THREE.Vector3(3.8, 0.012, 3.1), // LED D1
    ],
    isGold: true,
    speed: 0.80,
  });

  // ==========================================
  // 2. WEST BUS (Chip West pins: X=-2.1, 10 pins)
  // Pins 0..3 -> SPI Flash U2 (X=-4.2, parallel lines)
  // Pins 4..9 -> Decoupling capacitors & power bus (X=-4.5)
  // ==========================================
  for (let i = 0; i < 4; i++) {
    const zPin = -1.35 + i * 0.30; // -1.35, -1.05, -0.75, -0.45
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.7, 0.012, zPin), // inline series resistor
        new THREE.Vector3(-3.4, 0.012, zPin),
        new THREE.Vector3(-4.2, 0.012, zPin), // Flash U2 pin solder pad
      ],
      isGold: i % 2 === 0,
      speed: 0.72,
    });
  }

  for (let i = 4; i < 10; i++) {
    const zPin = -1.35 + i * 0.30; // -0.15 to 1.35
    const zOut = 0.20 + (i - 4) * 0.35; // 0.20 to 1.95 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(-2.1, 0.012, zPin),
        new THREE.Vector3(-2.8, 0.012, zPin), // inline resistor
        new THREE.Vector3(-3.5, 0.012, zOut),
        new THREE.Vector3(-4.5, 0.012, zOut), // decoupling capacitor pad
      ],
      isGold: i % 3 === 0,
      speed: 0.62 + (i % 3) * 0.1,
    });
  }

  // ==========================================
  // 3. NORTH BUS (Chip North pins: Z=-2.1, 8 pins)
  // Pins 0..3 (X < 0) -> USB-C port J1 (X=-2.5, Z=-4.3)
  // Pins 4..7 (X > 0) -> Crystal Y1 (X=3.5, Z=-2.4)
  // ==========================================
  for (let i = 0; i < 4; i++) {
    const xPin = -1.35 + i * 0.35; // -1.35 to -0.30
    const xUsb = -2.40 + i * 0.35; // -2.40 to -1.35 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, -2.7),
        new THREE.Vector3(xUsb, 0.012, -3.3), // inline USB diode / resistor
        new THREE.Vector3(xUsb, 0.012, -3.9), // USB-C receptacle pad
      ],
      isGold: i % 2 === 0,
      speed: 0.70,
    });
  }

  // Pins 4..7 (X > 0): Crystal lines
  // Outermost pin (Pin 7, X=1.10) turns East earliest (at Z=-2.40)
  // Pin 6 (X=0.75) turns East at Z=-2.65
  // Pin 5 (X=0.40) turns East at Z=-2.90
  // Pin 4 (X=0.05) turns East at Z=-3.15
  for (let i = 4; i < 8; i++) {
    const xPin = -1.35 + i * 0.35; // 0.05, 0.40, 0.75, 1.10
    const zTurn = -3.15 + (i - 4) * 0.25; // -3.15, -2.90, -2.65, -2.40
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, -2.1),
        new THREE.Vector3(xPin, 0.012, zTurn),
        new THREE.Vector3(4.2, 0.012, zTurn), // crystal solder pads
      ],
      isGold: true,
      speed: 0.78,
    });
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
  });

  for (let i = 1; i < 8; i++) {
    const xPin = -1.35 + i * 0.35; // -1.00 to +1.10
    const xEnd = -1.15 + (i - 1) * 0.40; // -1.15 to +1.25 (strictly monotonic!)
    routes.push({
      points: [
        new THREE.Vector3(xPin, 0.012, 2.1),
        new THREE.Vector3(xPin, 0.012, 2.7),
        new THREE.Vector3(xEnd, 0.012, 3.2), // inline component
        new THREE.Vector3(xEnd, 0.012, 3.7), // test point ring pad
      ],
      isGold: i % 2 === 0,
      speed: 0.65,
    });
  }

  return routes;
}

const routes = generatePlanarRoutes();
console.log('Total routes:', routes.length);

let conflicts = 0;
for (let r1 = 0; r1 < routes.length; r1++) {
  for (let r2 = r1 + 1; r2 < routes.length; r2++) {
    const p1 = routes[r1].points;
    const p2 = routes[r2].points;
    for (let i = 0; i < p1.length - 1; i++) {
      for (let j = 0; j < p2.length - 1; j++) {
        if (intersect(p1[i], p1[i+1], p2[j], p2[j+1])) {
          console.log(`Conflict between Route ${r1} seg ${i} and Route ${r2} seg ${j}`);
          conflicts++;
        }
      }
    }
  }
}
console.log('Total conflicts found:', conflicts);

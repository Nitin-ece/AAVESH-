import * as THREE from 'three';

export function getPCBComponents() {
  const components = [];

  // --- 1. SMD RESISTORS ---
  // East bus inline series resistors (7 tracks)
  for (let i = 0; i < 7; i++) {
    const zPin = -1.35 + i * 0.32;
    components.push({ type: 'resistor', x: 2.7, z: zPin, rot: 0, name: `R_EAST_${i+1}` });
  }
  // West bus inline resistors (4 Flash tracks)
  for (let i = 0; i < 4; i++) {
    const zPin = -1.35 + i * 0.30;
    components.push({ type: 'resistor', x: -2.7, z: zPin, rot: 0, name: `R_FLASH_${i+1}` });
  }
  // LED series current-limiting resistors
  components.push({ type: 'resistor', x: 3.8, z: 2.4, rot: Math.PI / 2, name: 'R_LED_ACT' });
  components.push({ type: 'resistor', x: 4.3, z: 2.4, rot: Math.PI / 2, name: 'R_LED_PWR' });
  components.push({ type: 'resistor', x: 4.8, z: 2.4, rot: Math.PI / 2, name: 'R_LED_CLK' });
  components.push({ type: 'resistor', x: -1.8, z: 2.8, rot: Math.PI / 2, name: 'R_LED_TX' });

  // --- 2. SMD CERAMIC CAPACITORS ---
  // 4 IC Corner Decoupling Capacitors
  components.push({ type: 'capacitor', x: -1.85, z: -1.85, rot: Math.PI / 4, name: 'C_DEC_NW' });
  components.push({ type: 'capacitor', x: 1.85, z: -1.85, rot: -Math.PI / 4, name: 'C_DEC_NE' });
  components.push({ type: 'capacitor', x: -1.85, z: 1.85, rot: -Math.PI / 4, name: 'C_DEC_SW' });
  components.push({ type: 'capacitor', x: 1.85, z: 1.85, rot: Math.PI / 4, name: 'C_DEC_SE' });

  // Crystal load capacitors (22pF)
  components.push({ type: 'capacitor', x: 2.85, z: -3.0, rot: 0, name: 'C_LOAD_Y1A' });
  components.push({ type: 'capacitor', x: 3.45, z: -3.0, rot: 0, name: 'C_LOAD_Y1B' });

  // West bus power filtering capacitors (MLCC array)
  for (let i = 4; i < 8; i++) {
    const zOut = 0.20 + (i - 4) * 0.35;
    components.push({ type: 'capacitor', x: -4.3, z: zOut, rot: 0, name: `C_FILT_${i-3}` });
  }

  // --- 3. SMD DIODES (SOD-123 with Cathode Band) ---
  // USB ESD Protection Diodes (Clamping diodes on D+ and D-)
  components.push({ type: 'diode', x: -2.05, z: -3.3, rot: Math.PI / 2, name: 'D_ESD_USB_DP' });
  components.push({ type: 'diode', x: -1.70, z: -3.3, rot: Math.PI / 2, name: 'D_ESD_USB_DM' });

  // Schottky Reverse Polarity Protection Diode on 5V VBUS
  components.push({ type: 'diode', x: -2.40, z: -3.3, rot: Math.PI / 2, name: 'D_SCHOTTKY_VBUS' });

  // Fast Recovery Clamping Diode on 3.3V Power Rail
  components.push({ type: 'diode', x: 0.5, z: 3.2, rot: Math.PI / 2, name: 'D_CLAMP_3V3' });

  return components;
}

const comps = getPCBComponents();
console.log('Total realistic SMD components:', comps.length);
comps.forEach(c => console.log(`  ${c.type.toUpperCase()}: ${c.name} at (${c.x}, ${c.z}) rot ${c.rot.toFixed(2)}`));

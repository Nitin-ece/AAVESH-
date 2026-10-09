import * as THREE from 'three';

const H = 1.6;
const W = 0.924;
const T_perp = 0.28;
const slope = 1.7320508; // tan(60 deg)
const sin60 = 0.8660254;
const T_horiz = T_perp / sin60; // ~0.3233
const bar_height = T_perp; // 0.28

const Y_top = H / 2; // 0.8
const Y_bot = -H / 2; // -0.8

// Right leg bottom outer:
const X_br_outer = W; // 0.924
const X_br_inner = W - T_horiz; // 0.6007

// Gap between right end of bottom bar and right leg
const gap_perp = 0.14;
const gap_horiz = gap_perp / sin60; // ~0.1617

const X_bar_end_bot = X_br_inner - gap_horiz; // 0.4390
const Y_bar_top = Y_bot + bar_height; // -0.52
const X_bar_end_top = X_bar_end_bot - (bar_height / slope); // 0.2773

// Inner apex
const Y_inner_apex = Y_top - (T_perp / Math.cos(Math.PI / 6)); // 0.8 - (0.28 / 0.866) = 0.4767

// Inner left corner
const X_bl_inner = -W + T_horiz + (bar_height / slope); // -0.924 + 0.3233 + 0.1617 = -0.4390

const pts = [
  [0, Y_top],                                // 0: Top Apex
  [X_br_outer, Y_bot],                       // 1: Bottom Right Outer
  [X_br_inner, Y_bot],                       // 2: Bottom Right Inner
  [0, Y_inner_apex],                         // 3: Inner Apex
  [X_bl_inner, Y_bar_top],                   // 4: Inner Bottom-Left
  [X_bar_end_top, Y_bar_top],                // 5: Bar End Top
  [X_bar_end_bot, Y_bot],                    // 6: Bar End Bottom
  [-W, Y_bot],                               // 7: Bottom Left Outer
];

console.log('Polygon points:');
pts.forEach((p, i) => console.log(`P${i}: (${p[0].toFixed(3)}, ${p[1].toFixed(3)})`));

const shape = new THREE.Shape();
shape.moveTo(pts[0][0], pts[0][1]);
for (let i = 1; i < pts.length; i++) {
  shape.lineTo(pts[i][0], pts[i][1]);
}
shape.closePath();

const geom = new THREE.ShapeGeometry(shape);
console.log('Geometry vertices created:', geom.attributes.position.count);

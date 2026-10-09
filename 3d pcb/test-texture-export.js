import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
}
global.FileReader = FileReaderPolyfill;

// Test DataTexture
const width = 64;
const height = 64;
const size = width * height;
const data = new Uint8Array(4 * size);
for (let i = 0; i < size; i++) {
  data[i * 4] = 255;
  data[i * 4 + 1] = 255;
  data[i * 4 + 2] = 255;
  data[i * 4 + 3] = 255;
}
const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
texture.needsUpdate = true;

const scene = new THREE.Scene();
const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshStandardMaterial({ map: texture })
);
scene.add(mesh);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (glb) => {
    console.log('DataTexture GLB export success! size:', glb.byteLength);
  },
  (err) => {
    console.error('DataTexture export error:', err);
  },
  { binary: true }
);

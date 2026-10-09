import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';

// Complete FileReader polyfill for Node
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

const scene = new THREE.Scene();
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.2, metalness: 0.8 })
);
scene.add(box);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (glb) => {
    fs.writeFileSync('test.glb', Buffer.from(glb));
    console.log('SUCCESS! Exported test.glb, file size:', fs.statSync('test.glb').size, 'bytes');
  },
  (err) => {
    console.error('Export error:', err);
  },
  { binary: true }
);

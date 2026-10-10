import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import fs from "fs"

const scene = new THREE.Scene()
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.2,
    metalness: 0.8,
  }),
)
scene.add(box)

const exporter = new GLTFExporter()
exporter.parse(
  scene,
  (gltf) => {
    fs.writeFileSync("test.gltf", JSON.stringify(gltf, null, 2))
    console.log(
      "Success! Exported test.gltf, size:",
      fs.statSync("test.gltf").size,
    )
  },
  (err) => {
    console.error("Export error:", err)
  },
  { binary: false },
)

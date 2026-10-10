import { Float, RoundedBox, Sparkles } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import BrandMark from "./BrandMark"

function CircuitBoard() {
  const pins = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const side = index % 4
        const position = (Math.floor(index / 4) - 3) * 0.47
        if (side === 0)
          return { position: [-2.12, 0.1, position], rotation: [0, 0, 0] }
        if (side === 1)
          return { position: [2.12, 0.1, position], rotation: [0, 0, 0] }
        if (side === 2)
          return {
            position: [position, 0.1, -2.12],
            rotation: [0, Math.PI / 2, 0],
          }
        return {
          position: [position, 0.1, 2.12],
          rotation: [0, Math.PI / 2, 0],
        }
      }),
    [],
  )

  const components = useMemo(
    () => [
      [-3.2, -0.1, -1.9, 0.65, 0.2, 0.9],
      [2.9, -0.12, -2.5, 0.85, 0.22, 0.42],
      [3.35, -0.1, 1.7, 0.42, 0.18, 0.9],
      [-2.85, -0.12, 2.4, 1.1, 0.2, 0.38],
      [0.2, -0.12, 3.3, 0.5, 0.16, 0.5],
      [-0.6, -0.12, -3.25, 0.38, 0.18, 0.75],
    ],
    [],
  )

  return (
    <Float floatIntensity={0.22} rotationIntensity={0.12} speed={1.2}>
      <group rotation={[-0.16, -0.48, -0.04]}>
        <RoundedBox
          args={[8.6, 0.28, 7.4]}
          radius={0.16}
          smoothness={4}
          position={[0, -0.35, 0]}
        >
          <meshStandardMaterial
            color="#03101a"
            metalness={0.72}
            roughness={0.5}
          />
        </RoundedBox>

        {Array.from({ length: 9 }, (_, index) => (
          <group key={`trace-${index}`}>
            <mesh position={[-3.8 + index * 0.95, -0.16, 0]}>
              <boxGeometry args={[0.018, 0.018, 6.4]} />
              <meshBasicMaterial color={index % 2 ? "#0e3956" : "#126da5"} />
            </mesh>
            <mesh position={[0, -0.16, -3.1 + index * 0.78]}>
              <boxGeometry args={[7.5, 0.018, 0.018]} />
              <meshBasicMaterial color={index % 3 ? "#0b2c44" : "#1674ac"} />
            </mesh>
          </group>
        ))}

        <RoundedBox
          args={[4.1, 0.68, 4.1]}
          radius={0.25}
          smoothness={5}
          position={[0, 0.08, 0]}
        >
          <meshStandardMaterial
            color="#07131e"
            metalness={0.9}
            roughness={0.22}
          />
        </RoundedBox>
        <RoundedBox
          args={[3.45, 0.11, 3.45]}
          radius={0.18}
          smoothness={4}
          position={[0, 0.48, 0]}
        >
          <meshStandardMaterial
            color="#071c2b"
            emissive="#0875bf"
            emissiveIntensity={0.32}
            metalness={0.82}
            roughness={0.18}
          />
        </RoundedBox>
        <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 1.04, 3]} />
          <meshBasicMaterial color="#39b7ff" toneMapped={false} />
        </mesh>

        {pins.map((pin, index) => (
          <mesh
            key={`pin-${index}`}
            position={pin.position}
            rotation={pin.rotation}
          >
            <boxGeometry args={[0.45, 0.1, 0.12]} />
            <meshStandardMaterial
              color="#6aa9c8"
              emissive="#178bc9"
              emissiveIntensity={0.28}
              metalness={0.9}
            />
          </mesh>
        ))}

        {components.map(([x, y, z, width, height, depth], index) => (
          <RoundedBox
            args={[width, height, depth]}
            key={`component-${index}`}
            position={[x, y, z]}
            radius={0.06}
            smoothness={2}
          >
            <meshStandardMaterial
              color="#0a1923"
              metalness={0.65}
              roughness={0.38}
            />
          </RoundedBox>
        ))}
      </group>
    </Float>
  )
}

export default function ChipScene() {
  return (
    <div aria-hidden="true" className="chip-scene">
      <Canvas
        camera={{ position: [8, 7, 9], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          color="#bfeaff"
          intensity={2.8}
          position={[4, 7, 5]}
        />
        <pointLight
          color="#0d9dff"
          intensity={28}
          position={[0, 3, 0]}
          distance={12}
        />
        <pointLight
          color="#1be2ff"
          intensity={12}
          position={[-5, 1, 2]}
          distance={8}
        />
        <CircuitBoard />
        <Sparkles
          color="#3fc3ff"
          count={32}
          opacity={0.45}
          scale={[10, 5, 8]}
          size={1.1}
          speed={0.15}
        />
      </Canvas>
      <div className="chip-mark">
        <BrandMark />
      </div>
    </div>
  )
}

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import ChipModel from "./ChipModel"
import CircuitTraces from "./CircuitTraces"

// Generate a high-resolution authentic silkscreen & copper layer texture for the PCB
function createPCBSilkscreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 1632
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // 1. Solder Mask: Deep dark matte obsidian substrate
    ctx.fillStyle = "#050b11"
    ctx.fillRect(0, 0, 2048, 1632)

    // 2. Faint ground-plane crosshatch copper flood
    ctx.strokeStyle = "rgba(202, 138, 4, 0.04)"
    ctx.lineWidth = 1
    for (let x = 0; x < 2048; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 1632)
      ctx.stroke()
    }
    for (let y = 0; y < 1632; y += 16) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(2048, y)
      ctx.stroke()
    }

    // 3. Crisp white/gold silkscreen borders and component registration
    ctx.strokeStyle = "rgba(241, 245, 249, 0.65)"
    ctx.lineWidth = 3

    // Board outline registration frame
    ctx.strokeRect(40, 40, 1968, 1552)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"
    ctx.lineWidth = 1
    ctx.strokeRect(48, 48, 1952, 1536)

    // Corner mounting hole clearance rings in gold
    const drawMntHole = (x: number, y: number) => {
      ctx.strokeStyle = "rgba(250, 204, 21, 0.7)"
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(x, y, 48, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 64, 0, Math.PI * 2)
      ctx.stroke()
    }
    drawMntHole(120, 120)
    drawMntHole(1928, 120)
    drawMntHole(120, 1512)
    drawMntHole(1928, 1512)

    // Central Chip U1 Bounding Box & Alignment Marks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
    ctx.lineWidth = 3
    ctx.strokeRect(700, 490, 648, 652)

    // Pin 1 Mark for U1
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(670, 460, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = "bold 24px 'IBM Plex Mono', monospace"
    ctx.fillText("PIN 1", 620, 435)

    // Main Board Identification Silkscreen
    ctx.fillStyle = "#f8fafc"
    ctx.font = "bold 44px 'Space Grotesk', sans-serif"
    ctx.letterSpacing = "6px"
    ctx.fillText("AAVESH // IIIT UNA", 120, 240)

    ctx.fillStyle = "#38bdf8"
    ctx.font = "600 24px 'IBM Plex Mono', monospace"
    ctx.letterSpacing = "3px"
    ctx.fillText("ELECTRONICS & TECHNOLOGY SOCIETY · FOUNDRY REV 3.4", 120, 280)

    ctx.fillStyle = "#94a3b8"
    ctx.font = "500 20px 'IBM Plex Mono', monospace"
    ctx.letterSpacing = "2px"
    ctx.fillText("LAYER: 4-LAYER FR4 TG170 · ENIG GOLD FINISH · IMPEDANCE CONTROLLED", 120, 312)

    // Silkscreen component designators
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
    ctx.font = "bold 22px 'IBM Plex Mono', monospace"
    ctx.fillText("U1 [SOC-M7 240MHz]", 720, 470)
    ctx.fillText("U2 [SPI-FLASH]", 380, 720)
    ctx.fillText("Y1 [16.000MHz]", 1450, 410)
    ctx.fillText("VR1 [AMS1117-3.3]", 300, 360)
    ctx.fillText("J1 [TYPE-C 5V/3A]", 580, 100)
    ctx.fillText("SW1 [RST]", 180, 890)
    ctx.fillText("SW2 [BOOT]", 180, 1060)
    ctx.fillText("C1", 1360, 480)
    ctx.fillText("C2", 1420, 480)
    ctx.fillText("R1", 1360, 1140)
    ctx.fillText("R2", 1420, 1140)
    ctx.fillText("PWR", 1680, 1420)
    ctx.fillText("ACT", 1760, 1420)

    // GPIO Header J2 Pinout markings (Right Edge)
    ctx.font = "bold 18px 'IBM Plex Mono', monospace"
    ctx.fillStyle = "#38bdf8"
    const pinLabels = [
      "3V3", "GND", "D0", "D1", "D2", "D3", "D4", "D5",
      "CLK", "MOSI", "MISO", "CS", "TX", "RX", "SDA", "SCL",
    ]
    pinLabels.forEach((lbl, idx) => {
      ctx.fillText(lbl, 1720, 560 + idx * 36)
    })
    ctx.fillText("GPIO HEADER [J2]", 1700, 520)

    // Test Points
    const drawTestPoint = (x: number, y: number, name: string) => {
      ctx.strokeStyle = "#eab308"
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = "#eab308"
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#cbd5e1"
      ctx.font = "bold 18px 'IBM Plex Mono', monospace"
      ctx.fillText(name, x + 24, y + 6)
    }
    drawTestPoint(1460, 820, "TP1 [CLK]")
    drawTestPoint(1460, 910, "TP2 [DATA]")
    drawTestPoint(1460, 1000, "TP3 [3V3]")
    drawTestPoint(480, 1100, "TP4 [GND]")

    // Certification & Compliance Logos
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
    ctx.lineWidth = 2
    ctx.strokeRect(120, 1370, 220, 60)
    ctx.fillStyle = "#cbd5e1"
    ctx.font = "bold 20px 'IBM Plex Mono', monospace"
    ctx.fillText("Pb-FREE · RoHS", 140, 1408)

    ctx.strokeRect(360, 1370, 180, 60)
    ctx.fillText("ESD SAFE ⚡", 380, 1408)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

// SMT ceramic capacitor with shiny metallic end-caps
function Capacitor({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Ceramic dielectric body (warm amber-brown) */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.24, 0.11, 0.13]} />
        <meshStandardMaterial
          color="#92623a"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      {/* Shiny silver end solder terminals */}
      <mesh position={[-0.11, 0.05, 0]}>
        <boxGeometry args={[0.045, 0.12, 0.135]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0.11, 0.05, 0]}>
        <boxGeometry args={[0.045, 0.12, 0.135]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}

// SMT resistor with shiny solder caps and printed resistance marking
function Resistor({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Glossy black ceramic body */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.12]} />
        <meshStandardMaterial
          color="#08090d"
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Laser-etched white resistor value mark */}
      <mesh position={[0, 0.081, 0]}>
        <boxGeometry args={[0.08, 0.004, 0.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Shiny silver solder caps */}
      <mesh position={[-0.1, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.086, 0.126]} />
        <meshStandardMaterial
          color="#f1f5f9"
          metalness={0.98}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0.1, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.086, 0.126]} />
        <meshStandardMaterial
          color="#f1f5f9"
          metalness={0.98}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}

// High-precision canned crystal oscillator (HC-49SMD) in polished nickel
function CrystalOscillator({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[0.88, 0.34, 0.42]}
        radius={0.09}
        smoothness={4}
        position={[0, 0.17, 0]}
      >
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.12}
        />
      </RoundedBox>
      {/* Solder side feet */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={`xtal-pad-${i}`} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.22]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.95}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// SOT-223 Low-Dropout Voltage Regulator
function VoltageRegulator({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Molded epoxy body */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.68, 0.19, 0.38]} />
        <meshStandardMaterial
          color="#06080c"
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      {/* Shiny metallic heatsink tab */}
      <mesh position={[0, 0.06, -0.24]}>
        <boxGeometry args={[0.38, 0.045, 0.14]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.12}
        />
      </mesh>
      {/* Solder pins */}
      {[-0.22, 0, 0.22].map((x, i) => (
        <mesh key={`reg-pin-${i}`} position={[x, 0.04, 0.24]}>
          <boxGeometry args={[0.09, 0.045, 0.14]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.98}
            roughness={0.12}
          />
        </mesh>
      ))}
    </group>
  )
}

// Aluminum Electrolytic Capacitor (cylindrical shiny silver can)
function ElectrolyticCapacitor({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      {/* Black plastic mounting base */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.72, 0.08, 0.72]} />
        <meshStandardMaterial
          color="#0a0d12"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      {/* Polished aluminum cylindrical can */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.76, 24]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.14}
        />
      </mesh>
      {/* Black negative polarity stripe */}
      <mesh position={[-0.28, 0.44, 0]}>
        <boxGeometry args={[0.08, 0.74, 0.18]} />
        <meshStandardMaterial
          color="#06090e"
          roughness={0.4}
        />
      </mesh>
      {/* Stamped top vent cross */}
      <mesh position={[0, 0.825, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.22, 4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

// SMD Tactile Push-Button Switch (Reset / Boot) with colored plunger cap
function TactileButton({
  position,
  label,
}: {
  position: [number, number, number]
  label?: string
}) {
  const capColor = label === "RST" ? "#dc2626" : "#2563eb"
  return (
    <group position={position}>
      {/* Shiny silver metal frame */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.56, 0.14, 0.56]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.96}
          roughness={0.15}
        />
      </mesh>
      {/* Circular tactile actuator button */}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
        <meshStandardMaterial
          color={capColor}
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>
      {/* 4 corner solder legs */}
      {[
        [-0.32, -0.2],
        [0.32, -0.2],
        [-0.32, 0.2],
        [0.32, 0.2],
      ].map(([lx, lz], i) => (
        <mesh key={`btn-leg-${i}`} position={[lx, 0.03, lz]}>
          <boxGeometry args={[0.1, 0.04, 0.08]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.98}
            roughness={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}

// Dual Row Pin Header (GPIO) with genuine 24K gold-plated pins
function PinHeader({
  position,
  rotation = [0, 0, 0],
  rows = 2,
  cols = 8,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  rows?: number
  cols?: number
}) {
  const pinSpacing = 0.25
  const baseWidth = cols * pinSpacing + 0.1
  const baseDepth = rows * pinSpacing + 0.1

  return (
    <group position={position} rotation={rotation}>
      {/* Plastic base */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[baseWidth, 0.24, baseDepth]} />
        <meshStandardMaterial
          color="#090d14"
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>
      {/* Genuine shiny gold-plated pins */}
      {Array.from({ length: cols }).map((_, c) =>
        Array.from({ length: rows }).map((_, r) => {
          const x = (c - (cols - 1) / 2) * pinSpacing
          const z = (r - (rows - 1) / 2) * pinSpacing
          return (
            <mesh key={`hdr-pin-${c}-${r}`} position={[x, 0.36, z]}>
              <boxGeometry args={[0.052, 0.36, 0.052]} />
              <meshStandardMaterial
                color="#facc15"
                metalness={0.98}
                roughness={0.08}
              />
            </mesh>
          )
        }),
      )}
    </group>
  )
}

// Metallic Stainless Steel USB-C Receptacle
function UsbConnector({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox
        args={[0.92, 0.34, 0.76]}
        radius={0.08}
        smoothness={3}
        position={[0, 0.17, 0]}
      >
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.98}
          roughness={0.12}
        />
      </RoundedBox>
      <mesh position={[0, 0.17, 0.39]}>
        <boxGeometry args={[0.72, 0.16, 0.02]} />
        <meshBasicMaterial color="#020408" />
      </mesh>
    </group>
  )
}

// SMD Clear Dome Status LED with realistic internal glowing die
function StatusLed({
  position,
  color,
  pulsing = false,
}: {
  position: [number, number, number]
  color: string
  pulsing?: boolean
}) {
  const ledRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    if (pulsing && ledRef.current) {
      const t = state.clock.getElapsedTime()
      ledRef.current.emissiveIntensity = 1.3 + Math.sin(t * 3.8) * 0.55
    }
  })

  return (
    <group position={position}>
      {/* Solder pads on board */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.26, 0.01, 0.16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Clear SMD LED package */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.09, 16]} />
        <meshStandardMaterial
          ref={ledRef}
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>
      <pointLight
        color={color}
        distance={1.6}
        intensity={pulsing ? 1.5 : 0.9}
        position={[0, 0.14, 0]}
      />
    </group>
  )
}

type PCBSceneProps = {
  pointer: { x: number; y: number }
  scrollProgress: number
  reducedMotion?: boolean
  reverseFlow?: boolean
  powerSurge?: boolean
  autoRotate?: boolean
  burstRipple?: number
  onChipClick?: () => void
  onBoardClick?: () => void
  onChipHover?: (hovered: boolean) => void
}

export default function PCBScene({
  pointer,
  scrollProgress,
  reducedMotion = false,
  reverseFlow = false,
  powerSurge = false,
  autoRotate = false,
  burstRipple = 0,
  onChipClick,
  onBoardClick,
  onChipHover,
}: PCBSceneProps) {
  const pcbGroupRef = useRef<THREE.Group>(null)
  const orbitAngleRef = useRef(0)
  const [silkscreenTexture, setSilkscreenTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    const tex = createPCBSilkscreenTexture()
    setSilkscreenTexture(tex)

    if (document.fonts) {
      document.fonts.ready.then(() => {
        const freshTex = createPCBSilkscreenTexture()
        setSilkscreenTexture((prev) => {
          prev?.dispose()
          return freshTex
        })
      })
    }

    return () => {
      tex.dispose()
    }
  }, [])

  // Subtle pointer damping, auto-orbit, and scroll-driven transition
  useFrame((_, delta) => {
    if (!pcbGroupRef.current) return

    if (autoRotate && !reducedMotion) {
      orbitAngleRef.current += delta * 0.45
    }

    // Base tilt angles
    const baseRotX = -0.18
    const baseRotY = -0.46 + orbitAngleRef.current
    const baseRotZ = -0.04

    // Target rotation factoring pointer coordinates (subtle, bounded)
    const targetRotX = reducedMotion
      ? baseRotX
      : baseRotX - pointer.y * 0.14 - scrollProgress * 0.2
    const targetRotY = reducedMotion
      ? baseRotY
      : baseRotY - pointer.x * 0.18 + scrollProgress * 0.3
    const targetRotZ = baseRotZ + scrollProgress * 0.08

    // Smooth damping
    pcbGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      pcbGroupRef.current.rotation.x,
      targetRotX,
      0.06,
    )
    pcbGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      pcbGroupRef.current.rotation.y,
      targetRotY,
      0.06,
    )
    pcbGroupRef.current.rotation.z = THREE.MathUtils.lerp(
      pcbGroupRef.current.rotation.z,
      targetRotZ,
      0.06,
    )

    // Position subtly moves with scroll
    const targetY = -0.3 + scrollProgress * 0.4
    const targetZ = scrollProgress * 1.2
    pcbGroupRef.current.position.y = THREE.MathUtils.lerp(
      pcbGroupRef.current.position.y,
      targetY,
      0.06,
    )
    pcbGroupRef.current.position.z = THREE.MathUtils.lerp(
      pcbGroupRef.current.position.z,
      targetZ,
      0.06,
    )
  })

  // SMT component coordinates array
  const capacitors = useMemo(
    () => [
      { pos: [2.5, 0, -1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [2.8, 0, -1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [3.1, 0, -1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [-2.5, 0, -2.1] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
      { pos: [-2.5, 0, -1.7] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
      { pos: [-2.9, 0, 1.4] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [-3.2, 0, 1.4] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [1.8, 0, 2.5] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
      { pos: [2.1, 0, 2.5] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
      { pos: [-0.6, 0, 2.6] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
    ],
    [],
  )

  const resistors = useMemo(
    () => [
      { pos: [2.5, 0, 1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [2.8, 0, 1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [-2.6, 0, 0.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [-2.6, 0, 0.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { pos: [0.6, 0, -2.7] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
      { pos: [0.9, 0, -2.7] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
    ],
    [],
  )

  return (
    <group ref={pcbGroupRef} position={[0, -0.3, 0]}>
      {/* 1. Main PCB Substrate Board (Dark FR4 Matte Solder Mask) */}
      <RoundedBox
        args={[11.8, 0.32, 9.4]}
        radius={0.2}
        smoothness={4}
        position={[0, -0.16, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onBoardClick?.()
        }}
      >
        <meshStandardMaterial
          color="#050a10"
          roughness={0.65}
          metalness={0.16}
        />
      </RoundedBox>

      {/* 2. Top Silkscreen Layer printed onto the PCB board */}
      {silkscreenTexture && (
        <mesh
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onBoardClick?.()
          }}
        >
          <planeGeometry args={[11.7, 9.3]} />
          <meshStandardMaterial
            map={silkscreenTexture}
            roughness={0.55}
            metalness={0.18}
            transparent
            opacity={0.96}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* 3. PCB Corner Brass Standoffs / Mounting Holes */}
      {[
        [-5.3, -4.1],
        [5.3, -4.1],
        [-5.3, 4.1],
        [5.3, 4.1],
      ].map(([x, z], i) => (
        <group key={`hole-${i}`} position={[x, 0.01, z]}>
          {/* Gold plated clearance ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.36, 24]} />
            <meshStandardMaterial
              color="#facc15"
              metalness={0.98}
              roughness={0.12}
            />
          </mesh>
          {/* Hole */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.21, 24]} />
            <meshBasicMaterial color="#010204" />
          </mesh>
        </group>
      ))}

      {/* 4. Circuit Traces and Conductive Bus Lines (Gold ENIG finish) */}
      <CircuitTraces
        burstRipple={burstRipple}
        powerSurge={powerSurge}
        reverseFlow={reverseFlow}
      />

      {/* 5. Central Microprocessor with AAVESH Vector Mark */}
      <ChipModel
        onClick={onChipClick}
        onHover={onChipHover}
        powerSurge={powerSurge}
        reverseFlow={reverseFlow}
      />

      {/* 6. Peripheral SMT Components with real colors */}
      {capacitors.map((cap, i) => (
        <Capacitor
          key={`cap-${i}`}
          position={cap.pos}
          rotation={cap.rot}
        />
      ))}

      {resistors.map((res, i) => (
        <Resistor
          key={`res-${i}`}
          position={res.pos}
          rotation={res.rot}
        />
      ))}

      {/* Canned 16MHz Crystal Oscillator */}
      <CrystalOscillator position={[3.6, 0, -2.4]} />

      {/* SOT-223 Voltage Regulator on Power Rail */}
      <VoltageRegulator position={[-4.2, 0, -2.5]} rotation={[0, Math.PI / 2, 0]} />

      {/* Aluminum Electrolytic Capacitor */}
      <ElectrolyticCapacitor position={[-3.6, 0, -3.4]} />

      {/* SMD Tactile Push Buttons (Reset & Boot) */}
      <TactileButton position={[-4.8, 0, -3.6]} label="RST" />
      <TactileButton position={[-4.8, 0, -1.4]} label="BOOT" />

      {/* GPIO Pin Headers with 24K Gold Pins */}
      <PinHeader position={[4.8, 0, 0]} rotation={[0, Math.PI / 2, 0]} cols={10} />
      <PinHeader position={[-4.8, 0, 2.4]} rotation={[0, 0, 0]} cols={6} />

      {/* Stainless Steel USB-C Connector */}
      <UsbConnector position={[-2.4, 0, -4.4]} />

      {/* Status LEDs with clear resin lenses & dynamic glow */}
      <StatusLed position={[4.0, 0, 3.2]} color="#10b981" pulsing={false} /> {/* Green 3.3V PWR */}
      <StatusLed position={[4.4, 0, 3.2]} color="#38bdf8" pulsing={true} />  {/* Cyan ACT */}
      <StatusLed position={[4.8, 0, 3.2]} color="#f59e0b" pulsing={true} />  {/* Amber CLK */}

      {/* Flash Memory SOIC-8 IC with pin 1 marker */}
      <group position={[-3.8, 0, -0.6]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.65, 0.15, 0.48]} />
          <meshStandardMaterial
            color="#080a0f"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
        {/* Pin 1 dot */}
        <mesh position={[-0.22, 0.16, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Pins */}
        {[-0.2, -0.06, 0.06, 0.2].map((x, i) => (
          <group key={`flash-pin-${i}`}>
            <mesh position={[x, 0.04, -0.28]}>
              <boxGeometry args={[0.06, 0.035, 0.1]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.15} />
            </mesh>
            <mesh position={[x, 0.04, 0.28]}>
              <boxGeometry args={[0.06, 0.035, 0.1]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.15} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Cinematic Studio Lighting: Perfectly balanced for specular glints without washing out textures */}
      {/* Primary Key Light */}
      <directionalLight
        position={[6, 9, 7]}
        intensity={2.2}
        color="#ffffff"
      />
      {/* Specular Rim Light creating sharp metallic highlights */}
      <directionalLight
        position={[-7, 5, -5]}
        intensity={2.4}
        color="#38bdf8"
      />
      {/* Soft Ambient Fill */}
      <directionalLight
        position={[-3, 4, 5]}
        intensity={0.6}
        color="#bae6fd"
      />
      {/* Interactive Pointer Specular Reflection Light */}
      <pointLight
        position={[pointer.x * 4.5, 2.2, -pointer.y * 3.5]}
        intensity={powerSurge ? 2.5 : 1.4}
        distance={6.5}
        color={reverseFlow ? "#c084fc" : "#7dd3fc"}
      />
      {/* Warm Ambient Base */}
      <ambientLight intensity={0.32} />
    </group>
  )
}

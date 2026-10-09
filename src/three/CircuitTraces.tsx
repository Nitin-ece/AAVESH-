import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

type CircuitTracesProps = {
  reverseFlow?: boolean
  powerSurge?: boolean
  burstRipple?: number
}

// Realistic PCB circuit traces, bus lines, landing pads, and animated signal pulses
export default function CircuitTraces({
  reverseFlow = false,
  powerSurge = false,
  burstRipple = 0,
}: CircuitTracesProps) {
  const pulsesGroupRef = useRef<THREE.Group>(null)
  const rippleMeshRef = useRef<THREE.Mesh>(null)
  const rippleDataRef = useRef({ progress: 1 })
  const prevRippleRef = useRef(burstRipple)

  // Precompute static PCB trace segments (straight lines and 45-degree bends)
  const { traces, pads, vias } = useMemo(() => {
    type TraceDef = {
      x: number
      z: number
      len: number
      rot: number
      isEmissive?: boolean
      isBus?: boolean
    }
    const traceList: TraceDef[] = []

    // Bus lines branching from chip pins (chip is at 0,0, radius ~1.8)
    // East bus lines
    for (let i = -5; i <= 5; i++) {
      const zOffset = i * 0.24
      traceList.push({
        x: 2.7,
        z: zOffset,
        len: 1.6,
        rot: 0,
        isEmissive: i % 3 === 0,
        isBus: true,
      })
      // 45 degree jog
      traceList.push({
        x: 3.7,
        z: zOffset + (i > 0 ? 0.3 : i < 0 ? -0.3 : 0),
        len: 0.6,
        rot: (i > 0 ? 1 : -1) * (Math.PI / 4),
        isEmissive: i % 3 === 0,
      })
      // Straight continuation to peripherals
      traceList.push({
        x: 4.4,
        z: zOffset + (i > 0 ? 0.6 : i < 0 ? -0.6 : 0),
        len: 1.2,
        rot: 0,
        isEmissive: i % 4 === 0,
        isBus: true,
      })
    }

    // West bus lines
    for (let i = -5; i <= 5; i++) {
      const zOffset = i * 0.24
      traceList.push({
        x: -2.7,
        z: zOffset,
        len: 1.5,
        rot: 0,
        isEmissive: (i + 1) % 3 === 0,
        isBus: true,
      })
      traceList.push({
        x: -3.6,
        z: zOffset + (i > 0 ? 0.25 : i < 0 ? -0.25 : 0),
        len: 0.5,
        rot: (i > 0 ? -1 : 1) * (Math.PI / 4),
        isEmissive: (i + 1) % 3 === 0,
      })
      traceList.push({
        x: -4.3,
        z: zOffset + (i > 0 ? 0.5 : i < 0 ? -0.5 : 0),
        len: 1.1,
        rot: 0,
        isEmissive: (i + 1) % 4 === 0,
      })
    }

    // North & South bus lines
    for (let i = -4; i <= 4; i++) {
      const xOffset = i * 0.28
      // North
      traceList.push({
        x: xOffset,
        z: -2.6,
        len: 1.4,
        rot: Math.PI / 2,
        isEmissive: i % 2 === 0,
      })
      traceList.push({
        x: xOffset + (i > 0 ? 0.35 : i < 0 ? -0.35 : 0),
        z: -3.5,
        len: 0.7,
        rot: Math.PI / 2 + (i > 0 ? 1 : -1) * (Math.PI / 4),
        isEmissive: i % 3 === 0,
      })
      // South
      traceList.push({
        x: xOffset,
        z: 2.6,
        len: 1.4,
        rot: Math.PI / 2,
        isEmissive: (i + 2) % 3 === 0,
      })
      traceList.push({
        x: xOffset + (i > 0 ? 0.35 : i < 0 ? -0.35 : 0),
        z: 3.5,
        len: 0.7,
        rot: Math.PI / 2 + (i > 0 ? -1 : 1) * (Math.PI / 4),
        isEmissive: (i + 2) % 3 === 0,
      })
    }

    // Peripheral interconnection traces
    const peripheralTraces: TraceDef[] = [
      { x: 3.8, z: -2.2, len: 1.8, rot: Math.PI / 4, isEmissive: true },
      { x: -3.4, z: 2.5, len: 1.6, rot: -Math.PI / 4, isEmissive: false },
      { x: 4.8, z: 1.6, len: 2.0, rot: Math.PI / 2, isEmissive: true },
      { x: -4.5, z: -1.8, len: 2.2, rot: 0, isEmissive: false },
      { x: 1.2, z: -3.8, len: 2.4, rot: 0, isEmissive: true },
      { x: -1.6, z: 3.8, len: 2.0, rot: 0, isEmissive: false },
      { x: 0.0, z: -3.9, len: 1.2, rot: Math.PI / 2, isEmissive: false },
    ]
    traceList.push(...peripheralTraces)

    // Landing pads (copper/gold rectangles at endpoints and test points)
    const padList: Array<{ x: number; z: number; w: number; h: number }> = []
    // Surrounding chip pin landing pads
    for (let i = -6; i <= 6; i++) {
      const offset = i * 0.24
      padList.push({ x: 2.05, z: offset, w: 0.32, h: 0.08 })
      padList.push({ x: -2.05, z: offset, w: 0.32, h: 0.08 })
      padList.push({ x: offset, z: 2.05, w: 0.08, h: 0.32 })
      padList.push({ x: offset, z: -2.05, w: 0.08, h: 0.32 })
    }

    // Vias (circular plated through-holes)
    const viaList: Array<{ x: number; z: number }> = []
    for (let x = -5.0; x <= 5.0; x += 1.25) {
      viaList.push({ x, z: -4.0 })
      viaList.push({ x, z: 4.0 })
    }
    for (let z = -3.5; z <= 3.5; z += 1.0) {
      viaList.push({ x: -5.2, z })
      viaList.push({ x: 5.2, z })
    }
    viaList.push(
      { x: 2.4, z: 1.6 },
      { x: 2.4, z: -1.6 },
      { x: -2.4, z: 1.6 },
      { x: -2.4, z: -1.6 },
      { x: 3.5, z: 2.2 },
      { x: -3.5, z: -2.2 },
      { x: 0.8, z: 2.8 },
      { x: -0.8, z: -2.8 },
    )

    return { traces: traceList, pads: padList, vias: viaList }
  }, [])

  // Expanded pulse tracks (10 tracks across all 4 directions)
  const pulseTracks = useMemo(() => {
    return [
      { startX: 1.9, startZ: 0.48, endX: 4.8, endZ: 0.48, speed: 0.6, phase: 0 },
      { startX: 1.9, startZ: -0.72, endX: 4.5, endZ: -1.2, speed: 0.5, phase: 0.4 },
      { startX: -1.9, startZ: 0.24, endX: -4.6, endZ: 0.6, speed: 0.7, phase: 0.2 },
      { startX: 0.28, startZ: -1.9, endX: 0.7, endZ: -4.0, speed: 0.55, phase: 0.7 },
      { startX: -0.56, startZ: 1.9, endX: -1.2, endZ: 3.9, speed: 0.65, phase: 0.5 },
      { startX: 2.2, startZ: 1.44, endX: 5.0, endZ: 2.6, speed: 0.45, phase: 0.9 },
      { startX: -1.9, startZ: -0.96, endX: -4.4, endZ: -1.6, speed: 0.62, phase: 0.35 },
      { startX: -0.8, startZ: -1.9, endX: -2.2, endZ: -3.8, speed: 0.58, phase: 0.8 },
      { startX: 1.2, startZ: 1.9, endX: 3.4, endZ: 3.8, speed: 0.52, phase: 0.15 },
      { startX: -2.2, startZ: 1.4, endX: -4.8, endZ: 2.8, speed: 0.68, phase: 0.6 },
    ]
  }, [])

  // Animate pulse packets smoothly, factoring reverseFlow and powerSurge
  useFrame((state, delta) => {
    // Check if new ripple trigger arrived
    if (burstRipple !== prevRippleRef.current) {
      prevRippleRef.current = burstRipple
      rippleDataRef.current.progress = 0
    }

    // Animate shockwave ring
    if (rippleMeshRef.current && rippleDataRef.current.progress < 1) {
      rippleDataRef.current.progress = Math.min(1, rippleDataRef.current.progress + delta * 1.8)
      const p = rippleDataRef.current.progress
      const currentScale = 0.5 + p * 6.5
      rippleMeshRef.current.scale.set(currentScale, currentScale, 1)
      const mat = rippleMeshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = Math.max(0, (1 - p) * 0.85)
      }
    }

    if (!pulsesGroupRef.current) return
    const t = state.clock.getElapsedTime()
    const speedMultiplier = powerSurge ? 2.3 : 1.0

    pulsesGroupRef.current.children.forEach((child, i) => {
      const track = pulseTracks[i % pulseTracks.length]
      const rawProgress = (t * track.speed * speedMultiplier + track.phase) % 1
      // When reverseFlow is active, reverse the vector trajectory!
      const progress = reverseFlow ? 1 - rawProgress : rawProgress

      child.position.x = THREE.MathUtils.lerp(track.startX, track.endX, progress)
      child.position.z = THREE.MathUtils.lerp(track.startZ, track.endZ, progress)

      const mesh = child as THREE.Mesh
      if (mesh.material && "opacity" in mesh.material) {
        ;(mesh.material as THREE.MeshBasicMaterial).opacity =
          Math.sin(rawProgress * Math.PI) * (powerSurge ? 1.0 : 0.85)
      }
    })
  })

  // Dynamic colors based on flow direction & overclock state
  const pulseColor = powerSurge
    ? "#38bdf8"
    : reverseFlow
      ? "#a78bfa" // Electric purple/violet for reverse signal flow
      : "#38bdf8" // Neon cyan for standard flow

  const traceEmissiveColor = powerSurge
    ? "#00d4ff"
    : reverseFlow
      ? "#818cf8"
      : "#0284c7"

  return (
    <group position={[0, 0.006, 0]}>
      {/* Shockwave Surge Ring (triggered on burst / clicks) */}
      <mesh
        ref={rippleMeshRef}
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.5, 0.5, 1]}
      >
        <ringGeometry args={[0.9, 1.05, 48]} />
        <meshBasicMaterial
          color={reverseFlow ? "#c084fc" : "#38bdf8"}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Conductive metallic traces */}
      {traces.map((trace, i) => {
        const isEmissive = trace.isEmissive
        return (
          <mesh
            key={`trace-${i}`}
            position={[trace.x, 0, trace.z]}
            rotation={[-Math.PI / 2, 0, trace.rot]}
          >
            <planeGeometry args={[trace.len, trace.isBus ? 0.028 : 0.018]} />
            <meshStandardMaterial
              color={isEmissive ? (reverseFlow ? "#c084fc" : "#38bdf8") : (trace.isBus ? "#ca8a04" : "#92630a")}
              emissive={isEmissive ? traceEmissiveColor : "#ca8a04"}
              emissiveIntensity={isEmissive ? (powerSurge ? 1.8 : 1.1) : 0.08}
              metalness={0.96}
              roughness={0.16}
            />
          </mesh>
        )
      })}

      {/* Solder landing pads for chip pins with shiny gold HASL/ENIG finish */}
      {pads.map((pad, i) => (
        <mesh
          key={`pad-${i}`}
          position={[pad.x, 0.001, pad.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[pad.w, pad.h]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive={powerSurge ? "#38bdf8" : "#ca8a04"}
            emissiveIntensity={powerSurge ? 0.6 : 0.15}
            metalness={0.98}
            roughness={0.12}
          />
        </mesh>
      ))}

      {/* Plated Through-Hole Vias with shiny gold annular rings */}
      {vias.map((via, i) => (
        <group key={`via-${i}`} position={[via.x, 0.002, via.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.024, 0.055, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.98}
              roughness={0.12}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.022, 16]} />
            <meshBasicMaterial color="#020406" />
          </mesh>
        </group>
      ))}

      {/* Animated Light/Data Pulses */}
      <group ref={pulsesGroupRef}>
        {pulseTracks.map((_, i) => (
          <mesh key={`pulse-${i}`} position={[0, 0.008, 0]}>
            <boxGeometry args={[powerSurge ? 0.24 : 0.18, 0.01, 0.03]} />
            <meshBasicMaterial
              color={pulseColor}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

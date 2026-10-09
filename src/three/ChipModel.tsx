import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

// Generates an ultra-crisp, authentic 2048x2048 laser-etched AAVESH microprocessor texture
function createAaveshChipTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 2048
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // 1. Deep piano black silicon die background with subtle anisotropic reflection
    const bgGrad = ctx.createRadialGradient(1024, 1024, 80, 1024, 1024, 1100)
    bgGrad.addColorStop(0, "#0c1017")
    bgGrad.addColorStop(0.5, "#06090e")
    bgGrad.addColorStop(1, "#020305")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 2048, 2048)

    // Brushed microscopic silicon die grain
    ctx.fillStyle = "rgba(255, 255, 255, 0.015)"
    for (let i = 0; i < 2048; i += 4) {
      ctx.fillRect(0, i, 2048, 1)
    }

    // Faint laser-etched micro-circuit bus lines on die surface
    ctx.strokeStyle = "rgba(234, 179, 8, 0.08)"
    ctx.lineWidth = 2
    for (let i = 240; i <= 1800; i += 160) {
      ctx.beginPath()
      ctx.moveTo(i, 200)
      ctx.lineTo(i, 1848)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(200, i)
      ctx.lineTo(1848, i)
      ctx.stroke()
    }

    // Outer double laser registration border in pure gold and electric cyan
    ctx.strokeStyle = "rgba(250, 204, 21, 0.9)" // Pure Gold
    ctx.lineWidth = 8
    ctx.strokeRect(100, 100, 1848, 1848)

    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)" // Bright Cyan
    ctx.lineWidth = 3
    ctx.strokeRect(124, 124, 1800, 1800)

    // Pin 1 Index Dot (Metallic gold dimple in upper-left corner)
    ctx.beginPath()
    ctx.arc(220, 220, 48, 0, Math.PI * 2)
    ctx.fillStyle = "#eab308"
    ctx.fill()
    ctx.strokeStyle = "#fef08a"
    ctx.lineWidth = 8
    ctx.stroke()

    // Inner concentric recess
    ctx.beginPath()
    ctx.arc(220, 220, 28, 0, Math.PI * 2)
    ctx.fillStyle = "#020305"
    ctx.fill()
    ctx.strokeStyle = "#facc15"
    ctx.lineWidth = 4
    ctx.stroke()

    // Registration fiducial crosses in corners
    const drawFiducial = (x: number, y: number) => {
      ctx.strokeStyle = "#facc15"
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(x - 32, y)
      ctx.lineTo(x + 32, y)
      ctx.moveTo(x, y - 32)
      ctx.lineTo(x, y + 32)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, 14, 0, Math.PI * 2)
      ctx.stroke()
    }
    drawFiducial(1828, 220)
    drawFiducial(220, 1828)
    drawFiducial(1828, 1828)

    // 2. Draw the actual AAVESH Logo Mark prominently in lustrous metallic gold
    ctx.save()
    // Mathematically center the AAVESH delta mark at (X: 1024, Y: 720)
    // Path original bounds: X in [6.5, 41.5] (width 35, center 24), Y in [8.0, 36.5] (height 28.5, center 22.25)
    const logoScale = 16.5
    ctx.translate(1024, 710)
    ctx.scale(logoScale, logoScale)
    ctx.translate(-24, -22.25)

    // Rich metallic gold gradient
    const goldGrad = ctx.createLinearGradient(6.5, 8, 41.5, 36.5)
    goldGrad.addColorStop(0, "#fffbeb") // Light gold specular highlight
    goldGrad.addColorStop(0.2, "#fef08a") // Brilliant yellow gold
    goldGrad.addColorStop(0.55, "#facc15") // Pure 24K gold
    goldGrad.addColorStop(0.85, "#eab308") // Deep amber gold
    goldGrad.addColorStop(1, "#ca8a04") // Burnished edge gold

    // Electric cyan drop-shadow glow
    ctx.shadowColor = "rgba(56, 189, 248, 0.85)"
    ctx.shadowBlur = 40
    ctx.fillStyle = goldGrad

    // Draw the exact official AAVESH circuit delta mark
    ctx.beginPath()
    ctx.moveTo(6.5, 36.5)
    ctx.lineTo(21.6, 9.4)
    ctx.arcTo(24, 5.2, 26.4, 9.4, 2.75)
    ctx.lineTo(41.5, 36.5)
    ctx.lineTo(32.8, 36.5)
    ctx.lineTo(24, 20.4)
    ctx.lineTo(18.8, 29.9)
    ctx.lineTo(24, 29.9)
    ctx.lineTo(27.7, 36.5)
    ctx.closePath()
    ctx.fill()

    // Crisp white laser edge contour
    ctx.shadowBlur = 0
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 0.85
    ctx.stroke()
    ctx.restore()

    // 3. Brand Inscription: A A V E S H in gold lettering
    ctx.textAlign = "center"
    const textGold = ctx.createLinearGradient(450, 1160, 1600, 1160)
    textGold.addColorStop(0, "#fffbeb")
    textGold.addColorStop(0.25, "#fef08a")
    textGold.addColorStop(0.5, "#facc15")
    textGold.addColorStop(0.75, "#eab308")
    textGold.addColorStop(1, "#fef08a")
    ctx.fillStyle = textGold
    ctx.font = "900 120px 'Space Grotesk', system-ui, -apple-system, sans-serif"
    ctx.fillText("A A V E S H", 1024, 1170)

    // White micro-stroke on brand name for extreme legibility
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)"
    ctx.lineWidth = 2
    ctx.strokeText("A A V E S H", 1024, 1170)

    // 4. Sub-title
    ctx.fillStyle = "#38bdf8"
    ctx.font = "700 52px 'IBM Plex Mono', monospace"
    ctx.fillText("IIIT UNA · HARDWARE FOUNDRY", 1024, 1290)

    // 5. Architecture Specs
    ctx.fillStyle = "#f8fafc"
    ctx.font = "600 44px 'IBM Plex Mono', monospace"
    ctx.fillText("SOC-M7 // 64-BIT DUAL CORE RISC-V", 1024, 1390)

    ctx.fillStyle = "#94a3b8"
    ctx.font = "500 36px 'IBM Plex Mono', monospace"
    ctx.fillText("ELECTRONICS · EMBEDDED · AI/ML · ROBOTICS", 1024, 1480)

    ctx.fillStyle = "#64748b"
    ctx.font = "500 30px 'IBM Plex Mono', monospace"
    ctx.fillText("240MHz PLL · 32MB PSRAM · 16MB SPI FLASH", 1024, 1560)

    // 6. Serial & Fab code
    ctx.textAlign = "left"
    ctx.font = "600 34px 'IBM Plex Mono', monospace"
    ctx.fillStyle = "#facc15"
    ctx.fillText("LOT #2026-IIITU-REV3.4", 220, 1740)

    ctx.textAlign = "right"
    ctx.fillStyle = "#38bdf8"
    ctx.fillText("FREQ 240MHz // 3.3V LVTTL", 1828, 1740)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

type ChipModelProps = {
  onHover?: (hovered: boolean) => void
  onClick?: () => void
  powerSurge?: boolean
  reverseFlow?: boolean
}

export default function ChipModel({
  onHover,
  onClick,
  powerSurge = false,
  reverseFlow = false,
}: ChipModelProps) {
  const [chipTopTexture, setChipTopTexture] = useState<THREE.CanvasTexture | null>(null)
  const rimLightRef = useRef<THREE.MeshStandardMaterial>(null)
  const chipGroupRef = useRef<THREE.Group>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Re-generate and wire texture cleanly without strict-mode disposal deadlocks
  useEffect(() => {
    const tex = createAaveshChipTexture()
    setChipTopTexture(tex)

    if (document.fonts) {
      document.fonts.ready.then(() => {
        const freshTex = createAaveshChipTexture()
        setChipTopTexture((prev) => {
          prev?.dispose()
          return freshTex
        })
      })
    }

    return () => {
      tex.dispose()
    }
  }, [])

  // Breathing pulse on illuminated chamfer perimeter
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (rimLightRef.current) {
      const baseFreq = powerSurge ? 5.5 : isHovered ? 3.0 : 1.8
      const baseIntensity = powerSurge ? 2.8 : isHovered ? 2.0 : 1.1
      rimLightRef.current.emissiveIntensity =
        baseIntensity + Math.sin(t * baseFreq) * (powerSurge ? 0.6 : 0.3)
    }
  })

  // Generate 48 realistic microchip pins (12 per side)
  const pins = useMemo(() => {
    const pinList: Array<{
      position: [number, number, number]
      rotation: [number, number, number]
    }> = []

    const countPerSide = 12
    const spacing = 0.24
    const halfSpan = ((countPerSide - 1) * spacing) / 2
    const pinDistance = 1.95

    // East (side 0)
    for (let i = 0; i < countPerSide; i++) {
      const offset = i * spacing - halfSpan
      pinList.push({
        position: [pinDistance, 0.08, offset],
        rotation: [0, 0, 0],
      })
    }
    // West (side 1)
    for (let i = 0; i < countPerSide; i++) {
      const offset = i * spacing - halfSpan
      pinList.push({
        position: [-pinDistance, 0.08, offset],
        rotation: [0, Math.PI, 0],
      })
    }
    // South (side 2)
    for (let i = 0; i < countPerSide; i++) {
      const offset = i * spacing - halfSpan
      pinList.push({
        position: [offset, 0.08, pinDistance],
        rotation: [0, -Math.PI / 2, 0],
      })
    }
    // North (side 3)
    for (let i = 0; i < countPerSide; i++) {
      const offset = i * spacing - halfSpan
      pinList.push({
        position: [offset, 0.08, -pinDistance],
        rotation: [0, Math.PI / 2, 0],
      })
    }

    return pinList
  }, [])

  const rimColor = powerSurge
    ? "#38bdf8"
    : reverseFlow
      ? "#a855f7"
      : "#0ea5e9"

  const rimEmissive = powerSurge
    ? "#e0f2fe"
    : reverseFlow
      ? "#c084fc"
      : "#00b4d8"

  return (
    <group
      ref={chipGroupRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onPointerEnter={(e) => {
        e.stopPropagation()
        setIsHovered(true)
        onHover?.(true)
      }}
      onPointerLeave={(e) => {
        e.stopPropagation()
        setIsHovered(false)
        onHover?.(false)
      }}
      position={[0, 0, 0]}
    >
      {/* 1. Main Microchip Base Package (Authentic Molded Black Epoxy Resin) */}
      <RoundedBox
        args={[3.8, 0.22, 3.8]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.11, 0]}
      >
        <meshStandardMaterial
          color="#06090e"
          roughness={0.35}
          metalness={0.15}
        />
      </RoundedBox>

      {/* 2. Raised Central Silicon Die / Mirror Heatspreader (Shiny Piano Black) */}
      <RoundedBox
        args={[3.24, 0.06, 3.24]}
        radius={0.03}
        smoothness={4}
        position={[0, 0.24, 0]}
      >
        <meshStandardMaterial
          color="#020305"
          roughness={0.08}
          metalness={0.55}
        />
      </RoundedBox>

      {/* 3. Top Printed Surface with Actual Club Logo & Gold Laser Etching */}
      {chipTopTexture && (
        <mesh position={[0, 0.272, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshStandardMaterial
            map={chipTopTexture}
            emissiveMap={chipTopTexture}
            emissive="#ffffff"
            emissiveIntensity={powerSurge ? 0.95 : isHovered ? 0.82 : 0.7}
            roughness={0.12}
            metalness={0.45}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 4. Fine Illuminated Laser Perimeter Rim around Die */}
      <mesh position={[0, 0.273, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.61, 1.635, 4]} />
        <meshStandardMaterial
          ref={rimLightRef}
          color={rimColor}
          emissive={rimEmissive}
          emissiveIntensity={powerSurge ? 2.8 : isHovered ? 2.0 : 1.1}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 5. Realistic 48 Metallic QFP Leads (12 per side) */}
      {pins.map((pin, i) => (
        <group key={`chip-pin-${i}`} position={pin.position} rotation={pin.rotation}>
          {/* Horizontal lead coming out of packaging */}
          <mesh position={[0.12, 0.04, 0]}>
            <boxGeometry args={[0.26, 0.035, 0.09]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.98}
              roughness={0.12}
            />
          </mesh>
          {/* Downward bend to PCB */}
          <mesh position={[0.25, -0.01, 0]}>
            <boxGeometry args={[0.035, 0.08, 0.09]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.98}
              roughness={0.12}
            />
          </mesh>
          {/* Solder foot firmly seated on pad */}
          <mesh position={[0.3, -0.045, 0]}>
            <boxGeometry args={[0.1, 0.025, 0.09]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

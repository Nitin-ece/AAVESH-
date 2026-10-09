import { Canvas } from "@react-three/fiber"
import { Component, type ReactNode, Suspense, useEffect, useState } from "react"
import PCBScene from "./PCBScene"

type HeroCanvasProps = {
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

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn("WebGL rendering fallback activated:", error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function FallbackBoard() {
  return (
    <div
      aria-hidden="true"
      className="hero-fallback-board"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "28rem",
          height: "22rem",
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, #070e17 0%, #03060a 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow:
            "0 0 60px rgba(2, 132, 199, 0.2), inset 0 0 30px rgba(56, 189, 248, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transform: "perspective(800px) rotateX(16deg) rotateY(-20deg) rotateZ(2deg)",
        }}
      >
        {/* Microchip */}
        <div
          style={{
            width: "12rem",
            height: "12rem",
            borderRadius: "8px",
            background: "linear-gradient(145deg, #0c1520, #05080e)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            boxShadow:
              "0 0 30px rgba(56, 189, 248, 0.35), inset 0 0 15px rgba(56, 189, 248, 0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <svg
            fill="none"
            viewBox="0 0 48 48"
            style={{
              width: "4.5rem",
              height: "4.5rem",
              color: "#38bdf8",
              filter: "drop-shadow(0 0 12px rgba(56, 189, 248, 0.8))",
            }}
          >
            <path
              d="M6.5 36.5 21.6 9.4a2.75 2.75 0 0 1 4.8 0l15.1 27.1h-8.7L24 20.4l-5.2 9.5H24l3.7 6.6H6.5Z"
              fill="currentColor"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.2em",
              color: "#f8fafc",
              marginTop: "0.5rem",
            }}
          >
            AAVESH
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.15em",
              color: "#38bdf8",
            }}
          >
            SOC-M7 // IIIT UNA
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HeroCanvas({
  scrollProgress,
  reducedMotion = false,
  reverseFlow = false,
  powerSurge = false,
  autoRotate = false,
  burstRipple = 0,
  onChipClick,
  onBoardClick,
  onChipHover,
}: HeroCanvasProps) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  // Smooth pointer tracking across the viewport
  useEffect(() => {
    if (reducedMotion) return

    const handlePointerMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      setPointer({ x: nx, y: ny })
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [reducedMotion])

  return (
    <div aria-hidden="true" className="hero-canvas-container">
      <CanvasErrorBoundary fallback={<FallbackBoard />}>
        <Suspense
          fallback={
            <div className="hero-canvas-loading">
              <div className="loading-pulse" />
            </div>
          }
        >
          <Canvas
            camera={{ position: [7.8, 6.8, 8.6], fov: 34 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <PCBScene
              autoRotate={autoRotate}
              burstRipple={burstRipple}
              onBoardClick={onBoardClick}
              onChipClick={onChipClick}
              onChipHover={onChipHover}
              pointer={pointer}
              powerSurge={powerSurge}
              reducedMotion={reducedMotion}
              reverseFlow={reverseFlow}
              scrollProgress={scrollProgress}
            />
          </Canvas>
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { PCBSceneEngine, THEME_CONFIGS } from "./pcb-scene"

export default function HeroCanvas({
  scrollProgress = 0,
  autoRotate = true,
  powerSurge = false,
  burstRipple = 0,
  onChipClick,
  onChipHover,
  onThemeChange,
}) {
  const containerRef = useRef(null)
  const engineRef = useRef(null)
  const [telemetry, setTelemetry] = useState(null)
  const [activeTheme, setActiveTheme] = useState(THEME_CONFIGS[0])
  const [showHint, setShowHint] = useState(true)

  // Initialize 3D PCB Engine
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const engine = new PCBSceneEngine(container, {
      autoRotate: autoRotate,
      onHoverChange: (info, clientX, clientY) => {
        if (info) {
          setTelemetry({ ...info, x: clientX, y: clientY })
          if (onChipHover) onChipHover(true)
        } else {
          setTelemetry(null)
          if (onChipHover) onChipHover(false)
        }
      },
      onThemeChange: (theme) => {
        setActiveTheme(theme)
        if (onThemeChange) onThemeChange(theme)
      },
      onChipClick: () => {
        if (onChipClick) onChipClick()
      },
    })

    engineRef.current = engine

    // Hide hint after first interaction
    const handleFirstTouch = () => {
      setShowHint(false)
    }
    container.addEventListener("pointerdown", handleFirstTouch, { once: true })

    return () => {
      container.removeEventListener("pointerdown", handleFirstTouch)
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // Sync autoRotate prop
  useEffect(() => {
    if (engineRef.current && engineRef.current.controls) {
      engineRef.current.controls.autoRotate = autoRotate
    }
  }, [autoRotate])

  // Sync powerSurge / burst ripple
  useEffect(() => {
    if (burstRipple && engineRef.current) {
      engineRef.current.triggerBurstPulse()
    }
  }, [burstRipple, powerSurge])

  return (
    <div
      ref={containerRef}
      className="hero-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        touchAction: "pan-y",
        cursor: "grab",
      }}
    >
      {/* Telemetry Tooltip when hovering over components or AAVESH logo */}
      {telemetry && (
        <div
          className="pcb-telemetry-tooltip glass-panel"
          style={{
            position: "fixed",
            left: Math.min(
              window.innerWidth - 300,
              Math.max(20, telemetry.x + 18),
            ),
            top: Math.min(
              window.innerHeight - 150,
              Math.max(20, telemetry.y - 12),
            ),
            zIndex: 100,
            pointerEvents: "none",
            padding: "0.65rem 0.95rem",
            background: "rgba(3, 7, 14, 0.88)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: "8px",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.2)",
            backdropFilter: "blur(12px)",
            maxWidth: "280px",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              fontSize: "0.76rem",
              fontWeight: 700,
              fontFamily: "'IBM Plex Mono', monospace",
              color: "#38bdf8",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00f0ff",
                boxShadow: "0 0 6px #00f0ff",
                display: "inline-block",
              }}
            />
            <span>{telemetry.name}</span>
          </div>
          <p
            style={{
              fontSize: "0.68rem",
              color: "#cbd5e1",
              margin: "0 0 0.35rem 0",
              lineHeight: 1.35,
            }}
          >
            {telemetry.desc}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.62rem",
              fontFamily: "'IBM Plex Mono', monospace",
              color: "#94a3b8",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "0.3rem",
            }}
          >
            <span>{telemetry.voltage || "3.3V"}</span>
            <span>{telemetry.freq || "ACTIVE"}</span>
          </div>
        </div>
      )}

      {/* Floating Interactive Badge (bottom-right of Hero 3D background) */}
      <div
        className="pcb-theme-badge"
        style={{
          position: "absolute",
          bottom: "1.2rem",
          right: "1.5rem",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.45rem 0.85rem",
          background: "rgba(2, 6, 12, 0.72)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "999px",
          backdropFilter: "blur(10px)",
          fontSize: "0.68rem",
          fontFamily: "'IBM Plex Mono', monospace",
          color: "#94a3b8",
          userSelect: "none",
          transition: "all 0.3s ease",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: `#${activeTheme.hex.toString(16).padStart(6, "0")}`,
            boxShadow: `0 0 10px #${activeTheme.hex.toString(16).padStart(6, "0")}`,
            display: "inline-block",
          }}
        />
        <span>
          RESONANCE:{" "}
          <strong
            style={{
              color: `#${activeTheme.hex.toString(16).padStart(6, "0")}`,
              fontWeight: 600,
            }}
          >
            {activeTheme.name}
          </strong>{" "}
          ({activeTheme.speed}x)
        </span>
      </div>

      {/* Interactive Micro-hint */}
      {showHint && (
        <div
          style={{
            position: "absolute",
            bottom: "3.2rem",
            right: "1.5rem",
            zIndex: 19,
            fontSize: "0.62rem",
            fontFamily: "'IBM Plex Mono', monospace",
            color: "rgba(148, 163, 184, 0.7)",
            pointerEvents: "none",
            display: "none",
          }}
          className="desktop-pcb-hint"
        >
          💡 Click AAVESH logo to cycle theme • Drag to rotate • Scroll to
          navigate page
        </div>
      )}
    </div>
  )
}

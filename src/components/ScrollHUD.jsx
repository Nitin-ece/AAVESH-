import { ArrowUp, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { soundFX } from "../utils/soundEffects"

export default function ScrollHUD({
  reverseFlow = false,
  onToggleReverseFlow,
}) {
  const [scrollPercent, setScrollPercent] = useState(0)
  const [direction, setDirection] = useState("down")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const pct =
        maxScroll > 0 ? Math.round((currentScrollY / maxScroll) * 100) : 0

      setScrollPercent(Math.min(100, Math.max(0, pct)))
      setIsVisible(currentScrollY > 180)

      if (Math.abs(currentScrollY - lastScrollY) > 4) {
        setDirection(currentScrollY < lastScrollY ? "up" : "down")
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    soundFX.playClick()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleReverseClick = () => {
    soundFX.playReverse()
    onToggleReverseFlow?.()
  }

  if (!isVisible) return null

  return (
    <div
      aria-label="Scroll telemetry and controls"
      className={`scroll-hud ${direction === "up" ? "is-reversing" : ""}`}
    >
      {/* Scroll Direction & Status Pill */}
      <div className="scroll-hud-status">
        <span className="scroll-hud-indicator">
          {direction === "up" ? (
            <span className="reverse-tag">
              <span className="pulse-dot pulse-purple" />▲ REVERSING
            </span>
          ) : (
            <span className="forward-tag">
              <span className="pulse-dot pulse-cyan" />▼ FORWARD
            </span>
          )}
        </span>
        <span className="scroll-hud-pct">{scrollPercent}%</span>
      </div>

      {/* Global Reverse Signal Flow Button */}
      {onToggleReverseFlow && (
        <button
          aria-label={
            reverseFlow ? "Restore normal signal flow" : "Reverse signal flow"
          }
          className={`scroll-hud-btn reverse-toggle-btn ${
            reverseFlow ? "is-active" : ""
          }`}
          onClick={handleReverseClick}
          title={
            reverseFlow
              ? "Flow: Reversed (Click to Normal)"
              : "Invert Circuit Flow"
          }
          type="button"
        >
          <RefreshCw className={reverseFlow ? "spin-reverse" : ""} size={14} />
          <span>{reverseFlow ? "REV FLOW" : "INVERT"}</span>
        </button>
      )}

      {/* Rewind / Scroll To Top Button with Circular Progress Gauge */}
      <button
        aria-label="Rewind to top"
        className="scroll-hud-btn rewind-btn"
        onClick={scrollToTop}
        title="Rewind to top"
        type="button"
      >
        <svg className="scroll-progress-ring" height="38" width="38">
          <circle
            cx="19"
            cy="19"
            fill="transparent"
            r="16"
            stroke="rgba(56, 189, 248, 0.15)"
            strokeWidth="2.5"
          />
          <circle
            cx="19"
            cy="19"
            fill="transparent"
            r="16"
            stroke={direction === "up" ? "#c084fc" : "#38bdf8"}
            strokeDasharray="100.5"
            strokeDashoffset={100.5 - (100.5 * scrollPercent) / 100}
            strokeLinecap="round"
            strokeWidth="2.5"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease",
            }}
          />
        </svg>
        <ArrowUp className="rewind-icon" size={15} />
      </button>
    </div>
  )
}

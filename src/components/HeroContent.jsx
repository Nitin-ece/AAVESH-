import { useEffect, useState } from "react"
import HeroActions from "./HeroActions"

export default function HeroContent({
  powerSurge = false,
  reverseFlow = false,
}) {
  const [clockJitter, setClockJitter] = useState(0)
  const [busLoad, setBusLoad] = useState(42)

  // Subtle real-time fluctuating telemetry numbers
  useEffect(() => {
    const interval = setInterval(() => {
      setClockJitter((Math.random() - 0.5) * 0.8)
      setBusLoad((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 6)
        return Math.min(88, Math.max(28, prev + delta))
      })
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  const currentClock = powerSurge
    ? (480.0 + clockJitter).toFixed(1)
    : (240.0 + clockJitter).toFixed(1)

  const currentTemp = powerSurge ? "44.6°C" : "38.2°C"

  return (
    <div className="hero-content-wrapper">
      {/* Top Technical Metadata Eyebrow */}
      <div className="hero-eyebrow">
        <span className="hero-eyebrow-index">01</span>
        <span className="hero-eyebrow-divider" />
        <span className="hero-eyebrow-tag">AAVESH // IIIT UNA</span>
        <span className={`hero-status-pill ${powerSurge ? "is-boosted" : ""}`}>
          <span className="hero-status-dot" />
          {powerSurge
            ? "CORE OVERCLOCKED"
            : reverseFlow
              ? "POLARITY INVERTED"
              : "SYS.ONLINE"}
        </span>
      </div>

      {/* Primary Headline with interactive accent glow */}
      <h1 className="hero-headline" id="hero-headline">
        <span className="hero-headline-line hero-line-1">
          <span className="hero-line-inner">IDEAS</span>
        </span>
        <span className="hero-headline-line hero-line-2">
          <span className="hero-line-inner">BUILT</span>
        </span>
        <span className="hero-headline-line hero-line-3">
          <span
            className={`hero-line-inner hero-accent-text ${
              powerSurge ? "is-surging" : ""
            } ${reverseFlow ? "is-reversed" : ""}`}
          >
            DIFFERENTLY
          </span>
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="hero-supporting-copy">
        Electronics, AI/ML, IoT and robotics. A student technical community of
        builders, designers, and systems architects at IIIT Una.
      </p>

      {/* Call to Actions */}
      <HeroActions />

      {/* Technical Telemetry Strip with live metrics */}
      <div aria-label="System parameters" className="hero-telemetry-strip">
        <div className="telemetry-item">
          <span className="telemetry-label">CORE FREQ</span>
          <span className="telemetry-value">{currentClock} MHz</span>
        </div>
        <div className="telemetry-separator" />
        <div className="telemetry-item">
          <span className="telemetry-label">DIE TEMP</span>
          <span className="telemetry-value">{currentTemp}</span>
        </div>
        <div className="telemetry-separator" />
        <div className="telemetry-item">
          <span className="telemetry-label">BUS TRAFFIC</span>
          <span className="telemetry-value">{busLoad}% LOAD</span>
        </div>
        <div className="telemetry-separator" />
        <div className="telemetry-item">
          <span className="telemetry-label">CAMPUS FOUNDRY</span>
          <span className="telemetry-value">IIIT UNA (HP)</span>
        </div>
      </div>
    </div>
  )
}

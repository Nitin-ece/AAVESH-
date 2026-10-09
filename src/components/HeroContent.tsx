import {
  Activity,
  Cpu,
  Flame,
  Orbit,
  RefreshCw,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { soundFX } from "../utils/soundEffects"
import HeroActions from "./HeroActions"
import Oscilloscope from "./Oscilloscope"

type HeroContentProps = {
  powerSurge: boolean
  reverseFlow: boolean
  autoRotate: boolean
  onTogglePowerSurge: () => void
  onToggleReverseFlow: () => void
  onToggleAutoRotate: () => void
  chipHovered?: boolean
}

export default function HeroContent({
  powerSurge,
  reverseFlow,
  autoRotate,
  onTogglePowerSurge,
  onToggleReverseFlow,
  onToggleAutoRotate,
  chipHovered = false,
}: HeroContentProps) {
  const [sfxMuted, setSfxMuted] = useState(soundFX.isMuted())
  const [clockJitter, setClockJitter] = useState(0)
  const [busLoad, setBusLoad] = useState(42)

  // Subtle real-time fluctuating telemetry numbers for true high-tech vitality
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

  const handleSoundToggle = () => {
    const newMuted = soundFX.toggleMute()
    setSfxMuted(newMuted)
  }

  const handleOverclockClick = () => {
    soundFX.playSurge()
    onTogglePowerSurge()
  }

  const handleReverseClick = () => {
    soundFX.playReverse()
    onToggleReverseFlow()
  }

  const handleRotateClick = () => {
    soundFX.playClick()
    onToggleAutoRotate()
  }

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
          {powerSurge ? "CORE OVERCLOCKED" : reverseFlow ? "POLARITY INVERTED" : "SYS.ONLINE"}
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
          <span className={`hero-line-inner hero-accent-text ${powerSurge ? "is-surging" : ""} ${reverseFlow ? "is-reversed" : ""}`}>
            DIFFERENTLY
          </span>
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="hero-supporting-copy">
        Electronics, AI/ML, IoT and robotics. A student technical community of builders, designers, and systems architects at IIIT Una.
      </p>

      {/* Call to Actions */}
      <HeroActions />

      {/* Interactive 3D Hardware Telemetry & Control Deck */}
      <div className="hero-interactive-deck" aria-label="Interactive Hardware Controls">
        <div className="interactive-deck-label">
          <Cpu size={13} />
          <span>HARDWARE CONTROLLER // CLICK TO TEST</span>
        </div>

        <div className="deck-controls-row">
          {/* Overclock Button */}
          <button
            aria-pressed={powerSurge}
            className={`deck-btn ${powerSurge ? "is-active surge-glow" : ""}`}
            onClick={handleOverclockClick}
            title="Accelerate core clock and circuit pulse propagation"
            type="button"
          >
            <Zap className="deck-btn-icon" size={14} />
            <span>{powerSurge ? "480MHz (ACTIVE)" : "⚡ BOOST CLOCK"}</span>
          </button>

          {/* Reverse Signal Flow Button */}
          <button
            aria-pressed={reverseFlow}
            className={`deck-btn ${reverseFlow ? "is-active reverse-glow" : ""}`}
            onClick={handleReverseClick}
            title="Reverse data pulse direction across circuit traces"
            type="button"
          >
            <RefreshCw className={`deck-btn-icon ${reverseFlow ? "spin-reverse" : ""}`} size={14} />
            <span>{reverseFlow ? "FLOW: REVERSED" : "⇄ REVERSE FLOW"}</span>
          </button>

          {/* 360 Orbit Rotate Button */}
          <button
            aria-pressed={autoRotate}
            className={`deck-btn ${autoRotate ? "is-active" : ""}`}
            onClick={handleRotateClick}
            title="Continuous 360-degree orbital rotation"
            type="button"
          >
            <Orbit className={`deck-btn-icon ${autoRotate ? "spin-orbit" : ""}`} size={14} />
            <span>{autoRotate ? "ORBITING" : "🔄 360° INSPECT"}</span>
          </button>

          {/* Sound FX Toggle Button */}
          <button
            aria-label={sfxMuted ? "Enable sound effects" : "Mute sound effects"}
            className={`deck-btn deck-btn--icon ${!sfxMuted ? "is-active" : ""}`}
            onClick={handleSoundToggle}
            title={sfxMuted ? "Audio: Muted (Click to enable synth SFX)" : "Audio: Enabled"}
            type="button"
          >
            {sfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Live Signal Oscilloscope & Chip Inspection Badge */}
        <div className="deck-telemetry-row">
          <Oscilloscope
            powerSurge={powerSurge}
            reverseFlow={reverseFlow}
          />

          {chipHovered && (
            <div className="chip-hover-badge animate-fade-in">
              <span className="badge-dot" />
              <span>SOC-M7 // RISC-V DUAL-CORE ACTIVE // 40+ GPIO READY</span>
            </div>
          )}
        </div>
      </div>

      {/* Technical Telemetry Strip with live metrics */}
      <div aria-label="System parameters" className="hero-telemetry-strip">
        <div className="telemetry-item">
          <span className="telemetry-label">CORE FREQ</span>
          <span className="telemetry-value">
            {currentClock} MHz
          </span>
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

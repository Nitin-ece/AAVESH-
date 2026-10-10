import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CircuitBoard,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import BrandMark from "../components/BrandMark"
import SloshGauge from "../components/SloshGauge"

const TOTAL_FRAMES = 101 // frame_000.webp to frame_100.webp

function getFramePath(index) {
  const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, index))
  const padded = String(clamped).padStart(3, "0")
  return `/energy-frames/frame_${padded}.webp`
}

const domainsData = [
  {
    code: "HW.01",
    copy: "High-speed circuit design, multilayer PCB development, and signal integrity.",
    icon: CircuitBoard,
    title: "Electronics",
  },
  {
    code: "EM.02",
    copy: "Bare-metal firmware, RTOS, sensor telemetry, and low-power hardware.",
    icon: Cpu,
    title: "Embedded Systems",
  },
  {
    code: "RB.03",
    copy: "Autonomous rovers, kinematic motion systems, and distributed IoT.",
    icon: Bot,
    title: "Robotics & IoT",
  },
  {
    code: "AI.04",
    copy: "On-device edge inference, real-time computer vision, and neural models.",
    icon: BrainCircuit,
    title: "AI & Intelligence",
  },
]

const sponsorTiers = [
  "Hardware Lab Partner",
  "Component & Chip Grants",
  "Hackathon Title Patron",
  "Mentorship & Technical Fellowships",
]

export default function ScrollShowcase() {
  const trackRef = useRef(null)
  const canvasRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const [gaugeColor, setGaugeColor] = useState("#FF1238")

  // Animation and frame management refs
  const imagesRef = useRef([])
  const loadedCountRef = useRef(0)
  const currentFrameRef = useRef(0)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const staticBaseFrameRef = useRef(0)
  const staticStartTimeRef = useRef(0)
  const rafIdRef = useRef(null)

  // Preload frames progressively
  useEffect(() => {
    const images = new Array(TOTAL_FRAMES)
    imagesRef.current = images

    // Load initial frame immediately
    const img0 = new Image()
    img0.src = getFramePath(0)
    img0.onload = () => {
      images[0] = img0
      loadedCountRef.current += 1
      drawFrame(0)
    }

    // Load remaining frames in batches
    let currentBatch = 1
    const loadNextBatch = () => {
      const batchSize = 10
      const end = Math.min(TOTAL_FRAMES, currentBatch + batchSize)
      for (let i = currentBatch; i < end; i += 1) {
        const img = new Image()
        img.src = getFramePath(i)
        img.onload = () => {
          images[i] = img
          loadedCountRef.current += 1
        }
      }
      currentBatch = end
      if (currentBatch < TOTAL_FRAMES) {
        setTimeout(loadNextBatch, 40)
      }
    }

    const timer = setTimeout(loadNextBatch, 50)
    return () => clearTimeout(timer)
  }, [])

  // Draw frame to canvas with aspect-ratio preserving math
  const drawFrame = useCallback(
    (frameIndex) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const images = imagesRef.current
      let targetImg = images[frameIndex]

      // Fall back to nearest loaded frame if current frame is still loading
      if (!targetImg || !targetImg.complete) {
        for (let d = 1; d <= 25; d += 1) {
          if (images[frameIndex - d]?.complete) {
            targetImg = images[frameIndex - d]
            break
          }
          if (images[frameIndex + d]?.complete) {
            targetImg = images[frameIndex + d]
            break
          }
        }
      }

      if (!targetImg || !targetImg.complete) return

      const { height: cHeight, width: cWidth } = canvas
      const imgWidth = targetImg.naturalWidth || targetImg.width
      const imgHeight = targetImg.naturalHeight || targetImg.height

      if (!imgWidth || !imgHeight) return

      // Calculate cover dimensions
      const scale = Math.max(cWidth / imgWidth, cHeight / imgHeight)
      const drawWidth = imgWidth * scale
      const drawHeight = imgHeight * scale
      const drawX = (cWidth - drawWidth) / 2
      const drawY = (cHeight - drawHeight) / 2

      ctx.clearRect(0, 0, cWidth, cHeight)
      ctx.drawImage(targetImg, drawX, drawY, drawWidth, drawHeight)
    },
    [],
  )

  // Resize canvas according to device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.imageSmoothingEnabled = true
      drawFrame(Math.round(currentFrameRef.current))
    }

    handleResize()
    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [drawFrame])

  // Scroll detection & progress computation
  useEffect(() => {
    const handleScroll = () => {
      const track = trackRef.current
      if (!track) return

      const rect = track.getBoundingClientRect()
      const totalScrollable = rect.height - window.innerHeight
      if (totalScrollable <= 0) return

      const rawProgress = -rect.top / totalScrollable
      const progress = Math.max(0, Math.min(1, rawProgress))

      setScrollProgress(progress)

      // Determine active stage
      let stage = 0
      if (progress >= 0.64) {
        stage = 2 // Sponsors (kept at last)
      } else if (progress >= 0.32) {
        stage = 1 // Technical Domains
      } else {
        stage = 0 // About
      }
      setActiveStage(stage)

      // Dynamic theme liquid accent color matching active section
      if (stage === 0) setGaugeColor("#FF1238")
      else if (stage === 1) setGaugeColor("#00E5FF")
      else setGaugeColor("#FFB800")

      // Flag scrolling state
      isScrollingRef.current = true
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
        staticBaseFrameRef.current = currentFrameRef.current
        staticStartTimeRef.current = performance.now()
      }, 160)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  // Continuous animation loop: handles scroll playback & idle video loop
  useEffect(() => {
    let lastTime = performance.now()

    const loop = (now) => {
      rafIdRef.current = requestAnimationFrame(loop)

      if (isScrollingRef.current) {
        // Scrolling: smoothly chase target frame corresponding to scroll progress (0-100)
        const targetFrame = scrollProgress * (TOTAL_FRAMES - 1)
        currentFrameRef.current +=
          (targetFrame - currentFrameRef.current) * 0.22
        staticBaseFrameRef.current = currentFrameRef.current
        staticStartTimeRef.current = now
      } else {
        // Static (not scrolling): oscillate through adjacent frames in a smooth continuous loop
        const elapsed = (now - (staticStartTimeRef.current || now)) * 0.001
        // Smooth sine wave swaying ±4 frames around current position
        const loopOffset = Math.sin(elapsed * 2.8) * 4.2
        const desiredFrame = staticBaseFrameRef.current + loopOffset
        currentFrameRef.current +=
          (desiredFrame - currentFrameRef.current) * 0.15
      }

      const frameToDraw = Math.round(
        Math.max(0, Math.min(TOTAL_FRAMES - 1, currentFrameRef.current)),
      )
      drawFrame(frameToDraw)
      lastTime = now
    }

    rafIdRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [drawFrame, scrollProgress])

  // Pager click navigation
  const scrollToStage = (stageIndex) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const scrollTop = window.scrollY + rect.top
    const total = track.offsetHeight - window.innerHeight

    let targetPct = 0.05
    if (stageIndex === 1) targetPct = 0.48
    if (stageIndex === 2) targetPct = 0.88

    window.scrollTo({
      behavior: "smooth",
      top: scrollTop + total * targetPct,
    })
  }

  // Calculate 3D Revolving Orbital Transforms around the SloshGauge
  // Stage 0: About (revolves on Left side)
  // Stage 1: Domains (revolves on Right side)
  // Stage 2: Sponsors (revolves to envelop Left and Right with SloshGauge at 100% full capacity)
  const getAboutTransform = () => {
    const p = scrollProgress
    if (p > 0.38)
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: "rotateY(40deg) translateZ(-250px) translateX(-80px)",
      }
    const dist = Math.abs(p - 0.16)
    const opacity = Math.max(0, 1 - dist * 4.5)
    const rotY = (p - 0.16) * 55
    const tx = (p - 0.16) * -80
    const tz = (1 - opacity) * -120
    return {
      opacity,
      transform: `perspective(1200px) rotateY(${rotY.toFixed(1)}deg) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px)`,
    }
  }

  const getDomainsTransform = () => {
    const p = scrollProgress
    if (p < 0.28 || p > 0.72)
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: "rotateY(-40deg) translateZ(-250px) translateX(80px)",
      }
    const dist = Math.abs(p - 0.5)
    const opacity = Math.max(0, 1 - dist * 4.5)
    const rotY = (p - 0.5) * -55
    const tx = (p - 0.5) * 80
    const tz = (1 - opacity) * -120
    return {
      opacity,
      transform: `perspective(1200px) rotateY(${rotY.toFixed(1)}deg) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px)`,
    }
  }

  const getSponsorsLeftTransform = () => {
    const p = scrollProgress
    if (p < 0.6)
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: "rotateY(-35deg) translateZ(-200px) translateX(-60px)",
      }
    const dist = Math.max(0, 0.86 - p)
    const opacity = Math.max(0, 1 - dist * 4.2)
    const rotY = (0.86 - Math.min(0.86, p)) * -30
    const tz = (opacity - 1) * 120
    return {
      opacity,
      transform: `perspective(1200px) rotateY(${rotY.toFixed(1)}deg) translateZ(${tz.toFixed(1)}px)`,
    }
  }

  const getSponsorsRightTransform = () => {
    const p = scrollProgress
    if (p < 0.6)
      return {
        opacity: 0,
        pointerEvents: "none",
        transform: "rotateY(35deg) translateZ(-200px) translateX(60px)",
      }
    const dist = Math.max(0, 0.86 - p)
    const opacity = Math.max(0, 1 - dist * 4.2)
    const rotY = (0.86 - Math.min(0.86, p)) * 30
    const tz = (opacity - 1) * 120
    return {
      opacity,
      transform: `perspective(1200px) rotateY(${rotY.toFixed(1)}deg) translateZ(${tz.toFixed(1)}px)`,
    }
  }

  const gaugeValue = Math.round(scrollProgress * 100)

  return (
    <section className="showcase-track" ref={trackRef}>
      {/* Hash anchors for navigation links */}
      <span className="showcase-anchor" id="about" style={{ top: "4%" }} />
      <span className="showcase-anchor" id="domains" style={{ top: "38%" }} />
      <span className="showcase-anchor" id="sponsors" style={{ top: "72%" }} />

      <div className="showcase-sticky">
        {/* Dynamic Energy Currents Canvas Background */}
        <div className="showcase-canvas-container">
          <canvas className="showcase-canvas" ref={canvasRef} />
          <div className="showcase-overlay" />
          <div className="showcase-grid-lines" />
        </div>

        {/* 3D Stage & SloshGauge Revolving Layout */}
        <div className="showcase-stage-layout">
          {/* STAGE 1: ABOUT (Revolves on Left Side of SloshGauge) */}
          <div
            className={`showcase-stage-card showcase-stage-card--about ${
              activeStage === 0 ? "is-active" : ""
            }`}
            style={getAboutTransform()}
          >
            <div className="showcase-glass-panel">
              <div className="section-label">
                <span>02</span>
                <span className="section-label__line" />
                <span>About AAVESH</span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <BrandMark />
                <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white m-0">
                  AAVESH
                </h2>
              </div>

              <p className="text-[#FF1238] font-mono text-xs uppercase tracking-wider mb-2 font-semibold">
                Electronics &amp; Technology Society · IIIT Una
              </p>

              <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                A student-driven technical society dedicated to hands-on
                engineering, hardware innovation, and collaborative building. We
                bridge the boundary between silicon architecture, intelligent
                systems, and embedded firmware.
              </p>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
                <div className="text-xs">
                  <span className="text-gray-400 block font-mono">
                    Institutional Home
                  </span>
                  <strong className="text-white">
                    Indian Institute of Information Technology Una
                  </strong>
                </div>
              </div>

              <button
                className="button button--text inline-flex items-center gap-2 text-xs font-mono"
                onClick={() => scrollToStage(1)}
                type="button"
              >
                <span>Scroll down or jump to domains</span>
                <ArrowRight aria-hidden="true" size={14} />
              </button>
            </div>
          </div>

          {/* CENTRAL ANCHOR: SLOSHGAUGE REACTOR HOUSING */}
          <div className="showcase-reactor-col">
            <div className="showcase-reactor-housing">
              <div className="showcase-reactor-header">
                <span className="showcase-reactor-tag">FLUX CORE</span>
                <span className="font-mono text-[10px] text-gray-400">
                  {isScrollingRef.current ? "ACTIVE FLOW" : "HARMONIC LOOP"}
                </span>
              </div>

              {/* Authentic SloshGauge with fluid physics simulation */}
              <SloshGauge
                ariaLabel="Energy Flux Capacity"
                glassColor="rgba(11, 16, 26, 0.85)"
                height={200}
                interactive={false}
                liquidColor={gaugeColor}
                radius={24}
                showValue={true}
                splash={0.45}
                ticks={5}
                tilt={0.5}
                unit="%"
                value={gaugeValue}
                viscosity={0.16}
                width={92}
              />

              <div className="showcase-reactor-footer">
                <span className="showcase-reactor-stage-badge">
                  {activeStage === 0 && "STAGE 01 · ABOUT"}
                  {activeStage === 1 && "STAGE 02 · DOMAINS"}
                  {activeStage === 2 && "STAGE 03 · SPONSORS"}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {gaugeValue === 100
                    ? "MAX CAPACITY REACHED"
                    : `${gaugeValue}% SYSTEM CHARGE`}
                </span>
              </div>
            </div>

            {/* Quick-Stage Navigation Pager */}
            <div className="showcase-pager">
              <button
                className={`showcase-pager-btn ${
                  activeStage === 0 ? "is-active" : ""
                }`}
                onClick={() => scrollToStage(0)}
                type="button"
              >
                01 About
              </button>
              <button
                className={`showcase-pager-btn ${
                  activeStage === 1 ? "is-active" : ""
                }`}
                onClick={() => scrollToStage(1)}
                type="button"
              >
                02 Domains
              </button>
              <button
                className={`showcase-pager-btn ${
                  activeStage === 2 ? "is-active" : ""
                }`}
                onClick={() => scrollToStage(2)}
                type="button"
              >
                03 Sponsors
              </button>
            </div>
          </div>

          {/* STAGE 2: TECHNICAL DOMAINS (Revolves on Right Side of SloshGauge) */}
          <div
            className={`showcase-stage-card showcase-stage-card--domains ${
              activeStage === 1 ? "is-active" : ""
            }`}
            style={getDomainsTransform()}
          >
            <div className="showcase-glass-panel showcase-glass-panel--cyan">
              <div className="section-label">
                <span>03</span>
                <span className="section-label__line" />
                <span>Technical Domains</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white my-2">
                Built Across The Stack.
              </h2>

              <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-3">
                Hardware is where ideas meet reality. Software gives them
                behavior. AAVESH operates at the active intersection.
              </p>

              {/* Interactive domain cards */}
              <div className="showcase-domains-grid">
                {domainsData.map((domain) => {
                  const Icon = domain.icon
                  return (
                    <div className="showcase-domain-item" key={domain.title}>
                      <div className="showcase-domain-header">
                        <Icon aria-hidden="true" size={18} />
                        <span className="showcase-domain-code">
                          {domain.code}
                        </span>
                      </div>
                      <h3 className="showcase-domain-title">{domain.title}</h3>
                      <p className="showcase-domain-desc">{domain.copy}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  className="button button--text inline-flex items-center gap-2 text-xs font-mono"
                  onClick={() => scrollToStage(2)}
                  type="button"
                >
                  <span>Continue to sponsors</span>
                  <ArrowRight aria-hidden="true" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* STAGE 3: SPONSORS (Revolves around SloshGauge to envelop Left and Right - Kept at Last) */}
          {activeStage === 2 && (
            <>
              {/* Sponsors Left Panel */}
              <div
                className="showcase-stage-card showcase-stage-card--sponsors-left is-active"
                style={getSponsorsLeftTransform()}
              >
                <div className="showcase-glass-panel showcase-glass-panel--gold">
                  <div className="section-label">
                    <span>08</span>
                    <span className="section-label__line" />
                    <span>Sponsors &amp; Partnerships</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white my-2">
                    Build The Next Thing{" "}
                    <span className="text-[#FFB800]">With Us.</span>
                  </h2>

                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    Partnerships empower student builders with state-of-the-art
                    tools, component fabrication, compute access, and direct
                    industry mentorship. Join us in shaping tomorrow&apos;s
                    engineers.
                  </p>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2 shadow-[0_0_8px_#fbbf24]" />
                    Official corporate partnerships &amp; lab grants welcome for
                    the upcoming academic year.
                  </div>
                </div>
              </div>

              {/* Sponsors Right Panel */}
              <div
                className="showcase-stage-card showcase-stage-card--sponsors-right is-active"
                style={getSponsorsRightTransform()}
              >
                <div className="showcase-glass-panel showcase-glass-panel--gold">
                  <div className="section-label">
                    <span>OPPORTUNITIES</span>
                    <span className="section-label__line" />
                    <span>Active Tiers</span>
                  </div>

                  <div className="showcase-sponsor-tiers">
                    {sponsorTiers.map((tier) => (
                      <span className="showcase-tier-pill" key={tier}>
                        {tier}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-start gap-3">
                    <a className="button button--primary" href="#contact">
                      <span>Discuss a partnership</span>
                      <ArrowRight aria-hidden="true" size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

interface CinematicIntroProps {
  onComplete?: () => void
  forcePlay?: boolean
}

export default function CinematicIntro({
  onComplete,
  forcePlay,
}: CinematicIntroProps) {
  // Always mount and play whenever website is opened
  const [mounted, setMounted] = useState(true)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const logoWrapperRef = useRef<HTMLDivElement | null>(null)
  const logoSilhouetteRef = useRef<HTMLImageElement | null>(null)
  const logoWhiteRef = useRef<HTMLImageElement | null>(null)
  const logoRedGlitchRef = useRef<HTMLImageElement | null>(null)
  const logoCyanGlitchRef = useRef<HTMLImageElement | null>(null)
  const redStripRef = useRef<HTMLDivElement | null>(null)
  const slashStreakRef = useRef<HTMLDivElement | null>(null)
  const impactFlashRef = useRef<HTMLDivElement | null>(null)
  const percentTextRef = useRef<HTMLSpanElement | null>(null)
  const loadingTextRef = useRef<HTMLSpanElement | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    // Guard refs
    if (
      !containerRef.current ||
      !logoSilhouetteRef.current ||
      !logoWhiteRef.current
    ) {
      setMounted(false)
      onComplete?.()
      return
    }

    // Lock body scroll during fixed intro loading
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Failsafe timer (6.5s) to guarantee site accessibility
    const failsafeTimer = setTimeout(() => {
      document.body.style.overflow = originalOverflow
      setMounted(false)
      onComplete?.()
    }, 6500)

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeout(failsafeTimer)
          document.body.style.overflow = originalOverflow
          setMounted(false)
          onComplete?.()
        },
      })
      timelineRef.current = tl

      if (prefersReducedMotion) {
        // Reduced motion: simple fade
        tl.to(containerRef.current, { opacity: 1, duration: 0.1 })
          .set(logoWhiteRef.current, { clipPath: "inset(0% 0 0 0)" })
          .fromTo(
            logoWhiteRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 1.2, ease: "power2.out" }
          )
          .fromTo(
            redStripRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" },
            "-=0.4"
          )
          .to({}, { duration: 1.2 })
          .to(containerRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
          })
        return
      }

      // Initial States
      gsap.set(containerRef.current, { opacity: 1 })
      gsap.set(logoWrapperRef.current, { scale: 1, opacity: 1 })
      gsap.set(logoSilhouetteRef.current, { opacity: 0 })
      // Start white logo completely empty from bottom (clip-path inset 100% from top)
      gsap.set(logoWhiteRef.current, {
        opacity: 1,
        clipPath: "inset(100% 0 0 0)",
      })
      gsap.set(logoRedGlitchRef.current, { opacity: 0, x: 0, y: 0 })
      gsap.set(logoCyanGlitchRef.current, { opacity: 0, x: 0, y: 0 })
      gsap.set(redStripRef.current, {
        scaleX: 0,
        opacity: 0,
        display: "none",
        transformOrigin: "left center",
      })
      gsap.set(slashStreakRef.current, {
        scaleX: 0,
        xPercent: -120,
        opacity: 0,
        display: "none",
      })
      gsap.set(impactFlashRef.current, { opacity: 0 })
      gsap.set([loadingTextRef.current, percentTextRef.current], {
        opacity: 0,
      })

      // ========================================================
      // SCENE 1: Darkness & Dark Silhouette Emergence (0.0s - 0.5s)
      // ========================================================
      // Brief pure black anticipation
      tl.to({}, { duration: 0.3 })

      // Reveal dark-grey base logo & bottom counters
      tl.to(
        logoSilhouetteRef.current,
        {
          opacity: 0.45,
          duration: 0.45,
          ease: "power2.out",
        },
        "+=0.0"
      )
      tl.to(
        [loadingTextRef.current, percentTextRef.current],
        {
          opacity: 0.75,
          duration: 0.35,
          ease: "power2.out",
        },
        "-=0.3"
      )

      // ========================================================
      // SCENE 2: Filling from Bottom to Top (0.5s - 2.3s)
      // White rises cleanly from 0% to 100%
      // ========================================================
      const fillProgress = { val: 0 }

      tl.to(
        fillProgress,
        {
          val: 100,
          duration: 1.75,
          ease: "power1.inOut",
          onUpdate: () => {
            const current = fillProgress.val
            // Inset from top = (100 - current)%
            const topInset = (100 - current).toFixed(2)
            if (logoWhiteRef.current) {
              logoWhiteRef.current.style.clipPath = `inset(${topInset}% 0 0 0)`
            }
            if (percentTextRef.current) {
              percentTextRef.current.textContent = `${Math.min(100, Math.round(current))}%`
            }
          },
        },
        "+=0.05"
      )

      // Brief tension freeze right at 100% full (0.1s)
      tl.to({}, { duration: 0.1 })

      // ========================================================
      // SCENE 3: 100% Filled -> Red Strip Slash Slices In! (2.4s - 2.85s)
      // Angled vivid red strip cuts across center
      // ========================================================
      tl.addLabel("stripImpact")

      // 1. Blade streak speed cut - reveal display at exact impact frame
      tl.set(slashStreakRef.current, { display: "block" }, "stripImpact")
      tl.fromTo(
        slashStreakRef.current,
        { scaleX: 0.1, xPercent: -100, opacity: 1 },
        {
          scaleX: 1.4,
          xPercent: 120,
          duration: 0.18,
          ease: "power4.inOut",
        },
        "stripImpact"
      )

      // 2. White anime impact frame flash (60ms)
      tl.to(
        impactFlashRef.current,
        {
          opacity: 0.95,
          duration: 0.04,
          ease: "power1.in",
        },
        "stripImpact+=0.06"
      )
      tl.to(
        impactFlashRef.current,
        {
          opacity: 0,
          duration: 0.08,
          ease: "power2.out",
        },
        "stripImpact+=0.10"
      )

      // 3. Red strip slams across horizontally with high-speed expansion
      tl.set(
        redStripRef.current,
        { display: "flex", opacity: 1, scaleX: 0 },
        "stripImpact+=0.07"
      )
      tl.to(
        redStripRef.current,
        {
          scaleX: 1,
          duration: 0.22,
          ease: "power4.out",
        },
        "stripImpact+=0.07"
      )

      // 4. Glitch & chromatic RGB channel split right on strike
      tl.set(
        logoRedGlitchRef.current,
        { opacity: 0.85, x: -7, y: 1 },
        "stripImpact+=0.07"
      )
      tl.set(
        logoCyanGlitchRef.current,
        { opacity: 0.75, x: 7, y: -1 },
        "stripImpact+=0.07"
      )

      // Screen shake
      tl.to(
        logoWrapperRef.current,
        {
          x: 4,
          duration: 0.03,
          ease: "none",
        },
        "stripImpact+=0.09"
      )
      tl.set(
        logoRedGlitchRef.current,
        { opacity: 0.5, x: 5, y: -1 },
        "stripImpact+=0.11"
      )
      tl.set(
        logoCyanGlitchRef.current,
        { opacity: 0.4, x: -4, y: 1 },
        "stripImpact+=0.11"
      )
      tl.to(
        logoWrapperRef.current,
        {
          x: 0,
          duration: 0.05,
          ease: "power2.out",
        },
        "stripImpact+=0.14"
      )
      tl.to(
        [logoRedGlitchRef.current, logoCyanGlitchRef.current],
        {
          opacity: 0,
          x: 0,
          y: 0,
          duration: 0.08,
          ease: "power2.out",
        },
        "stripImpact+=0.15"
      )

      // Fade out streak remnants and completely hide
      tl.to(
        slashStreakRef.current,
        {
          opacity: 0,
          duration: 0.08,
          onComplete: () => {
            if (slashStreakRef.current) slashStreakRef.current.style.display = "none"
          },
        },
        "stripImpact+=0.22"
      )

      // Fade out bottom loading indicator
      tl.to(
        [loadingTextRef.current, percentTextRef.current],
        { opacity: 0, duration: 0.3 },
        "stripImpact+=0.1"
      )

      // ========================================================
      // SCENE 4: Full Title Hold (2.85s - 3.8s)
      // Holds the completed 100% white logo + vivid red banner
      // ========================================================
      tl.to({}, { duration: 1.05 })

      // ========================================================
      // SCENE 5: Cinematic Smooth Exit (3.8s - 4.5s)
      // Smooth fade into the actual website
      // ========================================================
      tl.to(logoWrapperRef.current, {
        scale: 1.03,
        duration: 0.7,
        ease: "power2.inOut",
      })
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.7,
          ease: "power2.inOut",
        },
        "-=0.7"
      )
    })

    return () => {
      clearTimeout(failsafeTimer)
      document.body.style.overflow = originalOverflow
      ctx.revert()
    }
  }, [onComplete])

  if (!mounted) return null

  return (
    <div
      ref={containerRef}
      id="aavesh-cinematic-intro"
      aria-label="AAVESH Cinematic Loading Reveal"
      className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden select-none pointer-events-auto"
      style={{
        backgroundColor: "#000000",
        isolation: "isolate",
      }}
    >
      {/* Subtle Anime Vignette Accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10, 0, 0, 0) 35%, rgba(0, 0, 0, 0.9) 100%)",
        }}
      />

      {/* Main Centered Stage */}
      <div
        ref={logoWrapperRef}
        className="relative flex flex-col items-center justify-center px-4 w-full max-w-[700px]"
      >
        {/* Logo Container maintaining exact proportions */}
        <div className="relative flex items-center justify-center w-[230px] sm:w-[290px] md:w-[350px] max-w-[85vw] aspect-[1024/853]">
          {/* Layer 1: Base Dark-Grey Silhouette (visible beneath fill) */}
          <img
            ref={logoSilhouetteRef}
            src="/images/aavesh-logo-grey.png"
            alt="AAVESH"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_12px_rgba(255,255,255,0.05)]"
            style={{ willChange: "transform, opacity" }}
          />

          {/* Layer 2: White Logo that fills upwards from bottom */}
          <img
            ref={logoWhiteRef}
            src="/images/aavesh-logo-white.png"
            alt="AAVESH"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_24px_rgba(255,255,255,0.22)]"
            style={{ willChange: "clip-path, transform" }}
          />

          {/* Layer 3: RGB Red Channel Glitch on Impact */}
          <img
            ref={logoRedGlitchRef}
            src="/images/aavesh-logo-red.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
            style={{ willChange: "transform, opacity" }}
          />

          {/* Layer 4: RGB Cyan Channel Glitch on Impact */}
          <img
            ref={logoCyanGlitchRef}
            src="/images/aavesh-logo-white.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
            style={{
              filter: "drop-shadow(0 0 8px #00f0ff)",
              willChange: "transform, opacity",
            }}
          />

          {/* Signature Red Strip / Banner (Angled Skewed Ribbon like Reference Image) */}
          <div
            ref={redStripRef}
            className="absolute z-20 flex items-center justify-center pointer-events-none origin-left"
            style={{
              display: "none",
              opacity: 0,
              top: "calc(55% - 20px)",
              width: "128%",
              left: "-14%",
              height: "40px",
              transform: "skewX(-16deg)",
              background: "#FF1238",
              boxShadow:
                "0 0 24px rgba(255, 18, 56, 0.75), 0 0 45px rgba(255, 18, 56, 0.4)",
              willChange: "transform, opacity",
            }}
          >
            {/* Inner Bold Text: WELCOME TO THE AAVESH */}
            <span
              className="text-black font-black uppercase text-[11px] sm:text-[13px] md:text-[15px] select-none tracking-[0.24em] whitespace-nowrap"
              style={{
                fontFamily: "var(--display, 'Space Grotesk', sans-serif)",
                transform: "skewX(16deg)", // unskew text for razor sharpness
                letterSpacing: "0.24em",
              }}
            >
              WELCOME TO THE AAVESH
            </span>
          </div>

          {/* High-speed Slash Streak Line Container */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div
              ref={slashStreakRef}
              className="absolute w-[200%] h-[3px] origin-left pointer-events-none"
              style={{
                display: "none",
                opacity: 0,
                top: "calc(55% - 1.5px)",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,18,56,0.3) 25%, #FF1238 75%, #ffffff 100%)",
                boxShadow:
                  "0 0 16px #FF1238, 0 0 32px #FF1238, 0 0 2px #ffffff",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Corner HUD */}
      <div className="absolute bottom-6 left-8 z-10 pointer-events-none">
        <span
          ref={loadingTextRef}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 select-none"
        >
          LOADING
        </span>
      </div>
      <div className="absolute bottom-6 right-8 z-10 pointer-events-none">
        <span
          ref={percentTextRef}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 select-none"
        >
          0%
        </span>
      </div>

      {/* Impact Frame White Flash (FullScreen Brief Sakuga Flash) */}
      <div
        ref={impactFlashRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[#ffffff] z-[10000000]"
        style={{ willChange: "opacity" }}
      />
    </div>
  )
}

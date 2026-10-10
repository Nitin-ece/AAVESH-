import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef, useState } from "react"
import HeroContent from "../components/HeroContent"
import { useReducedMotion } from "../hooks/useReducedMotion"
import HeroCanvas from "../three/HeroCanvas"
import { soundFX } from "../utils/soundEffects"

gsap.registerPlugin(ScrollTrigger)

export default function Hero({ reverseFlow = false, onToggleReverseFlow }) {
  const heroRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [powerSurge, setPowerSurge] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [burstRipple, setBurstRipple] = useState(0)
  const [chipHovered, setChipHovered] = useState(false)
  const [mouseSpotlight, setMouseSpotlight] = useState({ x: 50, y: 50 })
  const reducedMotion = useReducedMotion()

  // Track mouse for dynamic radial hero background spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      const heroEl = heroRef.current
      if (!heroEl) return
      const rect = heroEl.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return

      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMouseSpotlight({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // GSAP Coordinated entrance and bidirectional scroll-driven scrub
  useEffect(() => {
    const heroEl = heroRef.current
    if (!heroEl) return

    const ctx = gsap.context(() => {
      // Scroll-driven transition using GSAP ScrollTrigger
      ScrollTrigger.create({
        trigger: heroEl,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        onUpdate: (self) => {
          setScrollProgress(self.progress)
        },
      })

      if (reducedMotion) {
        gsap.set(
          [
            "#site-navbar",
            ".hero-grid-overlay",
            ".hero-3d-container",
            ".hero-line-inner",
            ".hero-supporting-copy",
            ".hero-actions-group",
            ".hero-telemetry-strip",
            ".hero-footer-bar",
          ],
          { opacity: 1, y: 0, scale: 1 },
        )
        return
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      })

      gsap.set("#site-navbar", { opacity: 0, y: -24 })
      gsap.set(".hero-grid-overlay", { opacity: 0 })
      gsap.set(".hero-3d-container", { opacity: 0, scale: 0.95 })
      gsap.set(".hero-line-inner", { opacity: 0, y: 44 })
      gsap.set(".hero-supporting-copy", { opacity: 0, y: 20 })
      gsap.set(".hero-actions-group", { opacity: 0, y: 16 })
      gsap.set(".hero-telemetry-strip", { opacity: 0 })
      gsap.set(".hero-footer-bar", { opacity: 0 })

      tl.to("#site-navbar", {
        opacity: 1,
        y: 0,
        duration: 0.65,
      })
        .to(
          ".hero-grid-overlay",
          {
            opacity: 0.22,
            duration: 0.8,
          },
          "-=0.4",
        )
        .to(
          ".hero-3d-container",
          {
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "power2.out",
          },
          "-=0.7",
        )
        .to(
          ".hero-line-inner",
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          "-=0.7",
        )
        .to(
          ".hero-supporting-copy",
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          "-=0.35",
        )
        .to(
          ".hero-actions-group",
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
          },
          "-=0.3",
        )
        .to(
          [".hero-telemetry-strip", ".hero-footer-bar"],
          {
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
          },
          "-=0.25",
        )
    }, heroEl)

    return () => {
      ctx.revert()
    }
  }, [reducedMotion])

  const handleTogglePowerSurge = () => {
    setPowerSurge((prev) => !prev)
    setBurstRipple(Date.now())
  }

  const handleToggleAutoRotate = () => {
    setAutoRotate((prev) => !prev)
  }

  const handleChipClick = () => {
    soundFX.playSurge()
    setBurstRipple(Date.now())
    setPowerSurge((prev) => !prev)
  }

  return (
    <section
      aria-labelledby="hero-headline"
      className="hero-section"
      id="top"
      ref={heroRef}
    >
      {/* Background Technical Grid with interactive cursor spotlight */}
      <div
        aria-hidden="true"
        className="hero-grid-overlay"
        style={{
          maskImage: `radial-gradient(circle 500px at ${mouseSpotlight.x}% ${mouseSpotlight.y}%, black 30%, rgba(0,0,0,0.15) 80%)`,
          WebkitMaskImage: `radial-gradient(circle 500px at ${mouseSpotlight.x}% ${mouseSpotlight.y}%, black 30%, rgba(0,0,0,0.15) 80%)`,
        }}
      />

      {/* Interactive Ambient Glow Orb that follows in reverse parallax */}
      <div
        aria-hidden="true"
        className="hero-ambient-orb"
        style={{
          transform: `translate3d(${(mouseSpotlight.x - 50) * 0.4}px, ${(mouseSpotlight.y - 50) * 0.4}px, 0)`,
        }}
      />

      {/* Interactive 3D PCB Canvas (New 3D PCB from 3d pcb folder) */}
      <div className="hero-3d-container">
        <HeroCanvas
          autoRotate={autoRotate}
          burstRipple={burstRipple}
          onChipClick={handleChipClick}
          onChipHover={setChipHovered}
          powerSurge={powerSurge}
          scrollProgress={scrollProgress}
        />
      </div>

      {/* Shadow Veil for text contrast protection */}
      <div aria-hidden="true" className="hero-contrast-veil" />

      {/* Foreground Hero Content */}
      <div className="hero-main-container">
        <HeroContent
          autoRotate={autoRotate}
          chipHovered={chipHovered}
          onToggleAutoRotate={handleToggleAutoRotate}
          onTogglePowerSurge={handleTogglePowerSurge}
          onToggleReverseFlow={onToggleReverseFlow || (() => {})}
          powerSurge={powerSurge}
          reverseFlow={reverseFlow}
        />
      </div>

      {/* Technical Footer Bar / Scroll Indicator */}
      <div className="hero-footer-bar">
        <span>01 // HARDWARE & EMBEDDED FOUNDRY</span>
        <a className="hero-scroll-indicator" href="#about">
          <span>SCROLL TO EXPLORE</span>
          <span className="hero-scroll-line" />
        </a>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from "react"

export default function TechCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [visible, setVisible] = useState(false)
  const [ripples, setRipples] = useState([])
  const rippleIdRef = useRef(0)

  useEffect(() => {
    // Check if device has fine pointer (mouse/trackpad) and not reduced motion
    const hasPointer = window.matchMedia("(pointer: fine)").matches
    if (!hasPointer) return

    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (!visible) setVisible(true)

      // Check if hovering interactive element
      const target = e.target
      if (target) {
        const interactive = target.closest(
          "a, button, [role='button'], input, textarea, select, .domain-card, .project-card, .event-feature, canvas",
        )
        setIsHovered(!!interactive)
      }
    }

    const handleMouseDown = (e) => {
      setIsClicked(true)
      const newRipple = {
        id: ++rippleIdRef.current,
        x: e.clientX,
        y: e.clientY,
      }
      setRipples((prev) => [...prev.slice(-4), newRipple])

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 700)
    }

    const handleMouseUp = () => {
      setIsClicked(false)
    }

    const handleMouseLeave = () => {
      setVisible(false)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [visible])

  if (!visible) return null

  return (
    <>
      {/* Floating crosshair cursor follower */}
      <div
        className={`tech-cursor ${isHovered ? "is-hovered" : ""} ${
          isClicked ? "is-clicked" : ""
        }`}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        }}
      >
        <div className="cursor-dot" />
        <div className="cursor-ring" />
        <div className="cursor-crosshair crosshair-top" />
        <div className="cursor-crosshair crosshair-bottom" />
        <div className="cursor-crosshair crosshair-left" />
        <div className="cursor-crosshair crosshair-right" />
      </div>

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <span
          className="tech-click-ripple"
          key={ripple.id}
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}
    </>
  )
}

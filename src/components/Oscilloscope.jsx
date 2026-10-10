import { useEffect, useRef } from "react"

export default function Oscilloscope({
  powerSurge = false,
  reverseFlow = false,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId
    let time = 0

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const midY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Oscilloscope background grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)"
      ctx.lineWidth = 1

      // Vertical grid lines
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      // Horizontal grid lines
      for (let y = 0; y < height; y += 16) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw active waveform
      const speed = (powerSurge ? 0.08 : 0.035) * (reverseFlow ? -1 : 1)
      time += speed

      const mainColor = powerSurge
        ? "#38bdf8"
        : reverseFlow
          ? "#a78bfa"
          : "#38bdf8"

      // Glow effect
      ctx.shadowColor = mainColor
      ctx.shadowBlur = powerSurge ? 14 : 7
      ctx.strokeStyle = mainColor
      ctx.lineWidth = powerSurge ? 2.5 : 1.8

      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        // Compound wave: carrier sine + harmonic clock pulse
        const freq1 = powerSurge ? 0.06 : 0.03
        const freq2 = powerSurge ? 0.12 : 0.07
        const amp = powerSurge ? 22 : 14

        const y =
          midY +
          Math.sin(x * freq1 + time * 3) * amp +
          Math.cos(x * freq2 - time * 2) * (amp * 0.35)

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Sweep head dot
      const sweepX = (((time * 80) % width) + width) % width
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(sweepX, midY, 2.5, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [powerSurge, reverseFlow])

  return (
    <div
      className="oscilloscope-wrapper"
      title="Real-time Hardware Clock & Bus Frequency"
    >
      <div className="oscilloscope-header">
        <span className="oscilloscope-status">
          <span
            className={`oscilloscope-ping ${
              powerSurge ? "is-overclocked" : ""
            }`}
          />
          CH1 //{" "}
          {powerSurge
            ? "480 MHz (OC)"
            : reverseFlow
              ? "240 MHz (REV)"
              : "240 MHz (NOM)"}
        </span>
        <span className="oscilloscope-scale">
          {powerSurge ? "25ns/DIV" : "50ns/DIV"} · 3.3V
        </span>
      </div>
      <canvas
        className="oscilloscope-canvas"
        height={54}
        ref={canvasRef}
        width={240}
      />
    </div>
  )
}

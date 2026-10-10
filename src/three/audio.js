// Procedural Web Audio FX for cybernetic PCB interaction
class SoundManager {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  // Chirp when mouse touches an indicator LED or logo
  playLedTouch(freq = 880) {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        freq * 1.5,
        this.ctx.currentTime + 0.08,
      )

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.12,
      )

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.12)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Resonant pulse chime when cycling theme on AAVESH logo
  playThemeChange(colorIndex = 0) {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return

      const baseFreqs = [523.25, 659.25, 783.99, 987.77, 1046.5] // C5, E5, G5, B5, C6
      const freq = baseFreqs[colorIndex % baseFreqs.length]

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        freq * 1.25,
        this.ctx.currentTime + 0.18,
      )

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.22,
      )

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.22)
    } catch {}
  }

  // Power burst sound when clicking central AIC chip
  playChipPulse() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(140, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        420,
        this.ctx.currentTime + 0.25,
      )
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.55,
      )

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.55)
    } catch {}
  }
}

export const sounds = new SoundManager()

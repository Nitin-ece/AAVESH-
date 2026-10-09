// Elegant Web Audio API synthesizer for tactile sci-fi sound effects
// Completely zero external audio assets, instantly ready, client-side synthesized

class SoundFX {
  private ctx: AudioContext | null = null
  private muted: boolean = true // Default muted for respectful UX

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aavesh_sfx_enabled")
      this.muted = saved !== "true"
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  public toggleMute(): boolean {
    this.muted = !this.muted
    if (typeof window !== "undefined") {
      localStorage.setItem("aavesh_sfx_enabled", (!this.muted).toString())
    }
    if (!this.muted) {
      this.initCtx()
      this.playChirp(880, 0.08, "sine")
    }
    return this.muted
  }

  public setMuted(muted: boolean) {
    this.muted = muted
    if (typeof window !== "undefined") {
      localStorage.setItem("aavesh_sfx_enabled", (!muted).toString())
    }
  }

  // Short chirp / click feedback
  public playClick() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.04)
    } catch {
      // Safe fallback
    }
  }

  // Overclock energy surge sound
  public playSurge() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(980, this.ctx.currentTime + 0.22)

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.25)
    } catch {
      // Safe fallback
    }
  }

  // Reverse flow / phase inverter sound
  public playReverse() {
    if (this.muted) return
    this.initCtx()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(840, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.18)

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.2)
    } catch {
      // Safe fallback
    }
  }

  // Short frequency chirp
  private playChirp(freq: number, duration: number, type: OscillatorType) {
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch {
      // Safe fallback
    }
  }
}

export const soundFX = new SoundFX()

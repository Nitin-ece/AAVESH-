import { PCBShowcase } from "./pcb-scene"
import { sounds } from "./audio"

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas-container")
  if (!container) return

  const telemetryCard = document.getElementById("telemetry-card")
  const telName = document.getElementById("tel-name")
  const telDesc = document.getElementById("tel-desc")
  const telVolt = document.getElementById("tel-volt")
  const telFreq = document.getElementById("tel-freq")

  // Initialize Showcase Studio
  const showcase = new PCBShowcase(container, (info, clientX, clientY) => {
    if (info && telemetryCard) {
      if (telName) telName.textContent = info.name
      if (telDesc) telDesc.textContent = info.desc
      if (telVolt) telVolt.textContent = info.voltage
      if (telFreq) telFreq.textContent = info.freq

      telemetryCard.style.left = `${clientX}px`
      telemetryCard.style.top = `${clientY}px`
      telemetryCard.classList.add("visible")
    } else if (telemetryCard) {
      telemetryCard.classList.remove("visible")
    }
  })

  // 1. Download .GLB Button
  const btnDownload = document.getElementById("btn-download")
  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      sounds.playChipPulse()
      const link = document.createElement("a")
      link.href = "/aavesh-pcb.glb"
      link.download = "aavesh-pcb.glb"
      link.click()
    })
  }

  // 2. Pulse Burst Wave Button
  const btnBurst = document.getElementById("btn-burst")
  if (btnBurst) {
    btnBurst.addEventListener("click", () => {
      showcase.triggerBurstPulse()
      sounds.playChipPulse()
    })
  }

  // 3. Sound Toggle Button
  const btnSound = document.getElementById("btn-sound")
  if (btnSound) {
    btnSound.addEventListener("click", () => {
      sounds.enabled = !sounds.enabled
      btnSound.textContent = sounds.enabled ? "🔊 Sound: ON" : "🔇 Sound: OFF"
      if (sounds.enabled) sounds.playLedTouch()
    })
  }

  // 4. Camera Presets
  const camBtns = document.querySelectorAll<HTMLButtonElement>(".cam-btn")
  camBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      camBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      const view = btn.getAttribute(
        "data-view",
      ) as "hero" | "top" | "chip" | "iso"
      if (view) showcase.setCameraView(view)
      sounds.playLedTouch(1200)
    })
  })

  // 5. Sliders
  const sliderSpeed = document.getElementById(
    "slider-speed",
  ) as HTMLInputElement
  if (sliderSpeed) {
    sliderSpeed.addEventListener("input", () => {
      showcase.options.pulseSpeed = parseFloat(sliderSpeed.value)
    })
  }

  const sliderBloom = document.getElementById(
    "slider-bloom",
  ) as HTMLInputElement
  if (sliderBloom) {
    sliderBloom.addEventListener("input", () => {
      showcase.bloomPass.strength = parseFloat(sliderBloom.value)
    })
  }

  // 6. Color Themes
  const themeDots = document.querySelectorAll<HTMLElement>(".theme-dot")
  themeDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      themeDots.forEach((d) => d.classList.remove("active"))
      dot.classList.add("active")
      const theme = dot.getAttribute(
        "data-theme",
      ) as "cyan" | "gold" | "emerald" | "crimson"
      if (theme) showcase.setTheme(theme)
      sounds.playLedTouch(950)
    })
  })

  // 7. Auto-rotate Toggle
  const btnAutoRotate = document.getElementById("btn-autorotate")
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener("click", () => {
      showcase.controls.autoRotate = !showcase.controls.autoRotate
      btnAutoRotate.textContent = showcase.controls.autoRotate
        ? "🔄 Rotate: ON"
        : "⏸️ Rotate: OFF"
    })
  }

  // 8. Integration Code Modal
  const btnCode = document.getElementById("btn-code")
  const codeModal = document.getElementById("code-modal")
  const modalCloseBtn = document.getElementById("modal-close-btn")
  const btnCopyCode = document.getElementById("btn-copy-code")

  if (btnCode && codeModal) {
    btnCode.addEventListener("click", () => {
      codeModal.classList.add("open")
    })
  }

  if (modalCloseBtn && codeModal) {
    modalCloseBtn.addEventListener("click", () => {
      codeModal.classList.remove("open")
    })
  }

  if (codeModal) {
    codeModal.addEventListener("click", (e) => {
      if (e.target === codeModal) codeModal.classList.remove("open")
    })
  }

  if (btnCopyCode) {
    btnCopyCode.addEventListener("click", () => {
      const code = `import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'

function PCBHeroModel() {
  const { scene } = useGLTF('/aavesh-pcb.glb')
  return <primitive object={scene} scale={1.2} rotation={[0.4, -0.6, 0]} />
}

export function Hero3D() {
  return (
    <Canvas camera={{ position: [6.2, 5.2, 7.8], fov: 40 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 12, 6]} intensity={2.2} />
      <directionalLight position={[-9, 6, -6]} color="#00d4ff" intensity={2.8} />
      <PCBHeroModel />
      <OrbitControls enableDamping autoRotate />
    </Canvas>
  )
}`
      navigator.clipboard.writeText(code).then(() => {
        btnCopyCode.textContent = "✅ Copied to Clipboard!"
        setTimeout(() => {
          btnCopyCode.textContent = "📋 Copy React Three Fiber Snippet"
        }, 2000)
      })
    })
  }
})

import { ArrowRight, Terminal } from "lucide-react"

export default function HeroActions() {
  return (
    <div className="hero-actions-group" id="hero-actions">
      <a className="hero-btn-primary" href="#projects">
        <span>Our Work</span>
        <ArrowRight aria-hidden="true" className="hero-btn-icon" size={17} />
      </a>
      <a className="hero-btn-secondary" href="#contact">
        <Terminal
          aria-hidden="true"
          className="hero-btn-icon-subtle"
          size={15}
        />
        <span>Get in Touch</span>
      </a>
    </div>
  )
}

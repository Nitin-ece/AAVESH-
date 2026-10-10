import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import BrandMark from "./BrandMark"

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
  { label: "Team", href: "#team" },
  { label: "Sponsors", href: "#sponsors" },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track subtle scroll for header border opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  return (
    <header
      className={`navbar-root ${scrolled ? "is-scrolled" : ""}`}
      id="site-navbar"
    >
      <div className="navbar-container">
        {/* Brand / Logo */}
        <a
          aria-label="AAVESH homepage"
          className="navbar-brand"
          href="#top"
          onClick={() => setMenuOpen(false)}
        >
          <div className="navbar-brand-icon">
            <BrandMark />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">AAVESH</span>
            <span className="navbar-brand-sub">IIIT UNA</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="navbar-links">
          {navLinks.map(({ label, href }) => (
            <a
              className="navbar-link"
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right CTA & Mobile Toggle */}
        <div className="navbar-actions">
          <a className="navbar-contact-btn" href="#contact">
            <span>Contact</span>
          </a>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="navbar-toggle-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <div
        aria-hidden={!menuOpen}
        className={`navbar-mobile-drawer ${menuOpen ? "is-active" : ""}`}
      >
        <div className="navbar-mobile-inner">
          <nav aria-label="Mobile Navigation" className="navbar-mobile-links">
            {navLinks.map(({ label, href }) => (
              <a
                className="navbar-mobile-link"
                href={href}
                key={href}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <a
              className="navbar-mobile-link navbar-mobile-contact"
              href="#contact"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}

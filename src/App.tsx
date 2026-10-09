import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CircuitBoard,
  Code2,
  Cpu,
  Mail,
  MapPin,
  Menu,
  Radio,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  type FormEvent,
  type ReactNode,
  Suspense,
  useEffect,
  lazy,
  useLayoutEffect,
  useState,
} from "react"
import BrandMark from "./components/BrandMark"
import CinematicIntro from "./components/CinematicIntro"
import Navbar from "./components/Navbar"
import ScrollHUD from "./components/ScrollHUD"
import TechCursor from "./components/TechCursor"
import Hero from "./sections/Hero"

gsap.registerPlugin(ScrollTrigger)

type LinkProps = {
  children: ReactNode
  className?: string
  href: string
  label?: string
  onClick?: () => void
}

function Link({ children, className = "", href, label, onClick }: LinkProps) {
  return (
    <a aria-label={label} className={className} href={href} onClick={onClick}>
      {children}
    </a>
  )
}

type ButtonLinkProps = LinkProps & {
  variant?: "primary" | "secondary" | "text"
}

function ButtonLink({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`button button--${variant} ${className}`} {...props}>
      {children}
    </Link>
  )
}

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4"
  children: ReactNode
  className?: string
  id?: string
}

function Heading({
  as: Tag = "h2",
  children,
  className = "",
  id,
}: HeadingProps) {
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  )
}

function SectionLabel({
  index,
  children,
}: {
  index: string
  children: ReactNode
}) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <span className="section-label__line" />
      <span>{children}</span>
    </div>
  )
}

type SectionIntroProps = {
  index: string
  label: string
  title: ReactNode
  description: string
  action?: { href: string; label: string }
}

function SectionIntro({
  index,
  label,
  title,
  description,
  action,
}: SectionIntroProps) {
  return (
    <div className="section-intro" data-reveal>
      <SectionLabel index={index}>{label}</SectionLabel>
      <Heading className="section-title">{title}</Heading>
      <p className="section-description">{description}</p>
      {action ? (
        <ButtonLink href={action.href} variant="text">
          {action.label}
          <ArrowRight aria-hidden="true" size={16} />
        </ButtonLink>
      ) : null}
    </div>
  )
}

function ContentBadge({ children }: { children: ReactNode }) {
  return <span className="content-badge">{children}</span>
}

function ImageWithCredit({
  alt,
  className = "",
  credit,
  src,
}: {
  alt: string
  className?: string
  credit: string
  src: string
}) {
  return (
    <figure className={`image-frame ${className}`}>
      <img alt={alt} loading="lazy" src={src} />
      <figcaption>{credit}</figcaption>
    </figure>
  )
}

const navigation = [
  ["About", "#about"],
  ["Domains", "#domains"],
  ["Projects", "#projects"],
  ["Events", "#events"],
  ["Gallery", "#gallery"],
  ["Team", "#team"],
  ["Sponsors", "#sponsors"],
]

const domains: Array<{
  icon: LucideIcon
  title: string
  copy: string
  code: string
}> = [
  {
    icon: CircuitBoard,
    title: "Electronics",
    copy: "Circuit design, PCB development, instrumentation, and the fundamentals that turn a concept into working hardware.",
    code: "HW.01",
  },
  {
    icon: Cpu,
    title: "Embedded systems",
    copy: "Microcontrollers, firmware, sensors, and connected devices built around reliable real-world interaction.",
    code: "EM.02",
  },
  {
    icon: Bot,
    title: "Robotics & IoT",
    copy: "Integrated mechanical, electronic, and networked systems for autonomous and remotely operated applications.",
    code: "RB.03",
  },
  {
    icon: BrainCircuit,
    title: "AI & machine learning",
    copy: "Practical intelligent systems spanning computer vision, data-led automation, and edge inference.",
    code: "AI.04",
  },
]

const projectDirections = [
  {
    title: "Embedded sensing",
    copy: "A preview category for sensor networks, edge devices, and connected hardware work.",
    image: "/images/soldering.jpg",
    tags: ["IoT", "Firmware", "Sensors"],
  },
  {
    title: "Robotic systems",
    copy: "A preview category for automation, motion, control, and competition robotics.",
    image: "/images/robotics.jpg",
    tags: ["Robotics", "Control", "Vision"],
  },
  {
    title: "Intelligent electronics",
    copy: "A preview category for computer vision and machine-learning systems connected to hardware.",
    image: "/images/circuit-board.jpg",
    tags: ["AI/ML", "Edge", "Electronics"],
  },
]

const gallery = [
  {
    alt: "Close-up of hands working on an electronic circuit board",
    credit: "Illustrative image · Minh Đức / Unsplash",
    image: "/images/soldering.jpg",
    label: "Build",
    title: "Hands-on electronics",
  },
  {
    alt: "A robot prototype being reviewed by people",
    credit: "Illustrative image · C.F. Photography / Unsplash",
    image: "/images/robotics.jpg",
    label: "Test",
    title: "Robotics in motion",
  },
  {
    alt: "Engineering students collaborating in a workshop",
    credit: "Illustrative image · ThisisEngineering / Unsplash",
    image: "/images/workshop.jpg",
    label: "Learn",
    title: "Collaborative workshops",
  },
  {
    alt: "Detailed dark-blue circuit board",
    credit: "Illustrative image · Vishnu Mohanan / Unsplash",
    image: "/images/circuit-board.jpg",
    label: "Explore",
    title: "Inside the hardware",
  },
]


function About() {
  return (
    <section aria-labelledby="about-title" className="section" id="about">
      <div className="container about-grid">
        <div className="about-copy" data-reveal>
          <SectionLabel index="02">About</SectionLabel>
          <span className="eyebrow">We are</span>
          <Heading className="about-title" id="about-title">
            <BrandMark />
            AAVESH
          </Heading>
          <p className="about-lead">
            Electronics & Technology Society at IIIT Una.
          </p>
          <p className="section-description">
            A student technical community for learning through building. AAVESH
            brings together electronics, software, and intelligent systems
            through projects, workshops, competitions, and peer collaboration.
          </p>
          <ButtonLink href="#domains" variant="text">
            Explore our domains
            <ArrowRight aria-hidden="true" size={16} />
          </ButtonLink>
        </div>

        <div className="about-media" data-reveal>
          <ImageWithCredit
            alt="Detailed dark-blue circuit board"
            credit="Illustrative image · Vishnu Mohanan / Unsplash"
            src="/images/circuit-board.jpg"
          />
          <div className="about-note">
            <span className="status-dot" />
            <div>
              <span className="eyebrow">Institutional home</span>
              <strong>Indian Institute of Information Technology Una</strong>
              <p>Himachal Pradesh, India</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Domains() {
  return (
    <section
      aria-labelledby="domains-title"
      className="section section--ruled"
      id="domains"
    >
      <div className="container">
        <div className="section-heading-row">
          <SectionIntro
            description="Connected disciplines, one build culture—from first principles to integrated intelligent systems."
            index="03"
            label="Technical domains"
            title={
              <>
                Built across
                <br />
                the stack.
              </>
            }
          />
          <p className="section-kicker" data-reveal>
            Hardware is where ideas meet reality. Software gives them behavior.
            AAVESH operates at the intersection.
          </p>
        </div>

        <div className="domain-grid">
          {domains.map(({ code, copy, icon: Icon, title }) => (
            <article className="domain-card" data-reveal key={title}>
              <div className="domain-card__top">
                <Icon aria-hidden="true" />
                <span>{code}</span>
              </div>
              <div>
                <Heading as="h3">{title}</Heading>
                <p>{copy}</p>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="card-arrow"
                size={18}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section
      aria-labelledby="projects-title"
      className="section section--ruled"
      id="projects"
    >
      <div className="container split-section">
        <SectionIntro
          description="The cards below demonstrate the intended project taxonomy. They are not claims of completed AAVESH work."
          index="04"
          label="Projects"
          title={
            <>
              From ideas to
              <br />
              real-world <span className="accent-text">impact.</span>
            </>
          }
        />

        <div className="project-area">
          <div className="content-notice" data-reveal>
            <ContentBadge>Placeholder content</ContentBadge>
            <p>
              Verified project names, outcomes, media, and contributors will
              replace these concept directions.
            </p>
          </div>
          <div className="project-grid">
            {projectDirections.map((project, index) => (
              <article className="project-card" data-reveal key={project.title}>
                <div className="project-card__image">
                  <img alt="" loading="lazy" src={project.image} />
                  <span>0{index + 1}</span>
                </div>
                <div className="project-card__body">
                  <ContentBadge>Concept direction</ContentBadge>
                  <Heading as="h3">{project.title}</Heading>
                  <p>{project.copy}</p>
                  <div className="tag-row">
                    {project.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Events() {
  return (
    <section
      aria-labelledby="events-title"
      className="section section--ruled"
      id="events"
    >
      <div className="container split-section">
        <SectionIntro
          description="Workshops, competitions, hackathons, and technical sessions designed for learning by doing."
          index="05"
          label="Events"
          title={
            <>
              Upcoming
              <br />
              events.
            </>
          }
        />

        <div className="events-grid">
          <article className="event-feature" data-reveal>
            <ImageWithCredit
              alt="Engineering students collaborating in a workshop"
              credit="Illustrative image · ThisisEngineering / Unsplash"
              src="/images/workshop.jpg"
            />
            <div className="event-feature__body">
              <ContentBadge>Schedule awaiting confirmation</ContentBadge>
              <Heading as="h3">The next AAVESH event</Heading>
              <div className="event-meta">
                <span>
                  <CalendarDays aria-hidden="true" size={16} />
                  Date to be announced
                </span>
                <span>
                  <MapPin aria-hidden="true" size={16} />
                  IIIT Una
                </span>
              </div>
              <p>
                Verified event details and registration information will appear
                here when published by the society.
              </p>
              <ButtonLink href="#contact" variant="secondary">
                Ask about events
                <ArrowRight aria-hidden="true" size={16} />
              </ButtonLink>
            </div>
          </article>

          <div className="event-stack">
            {[
              {
                icon: CircuitBoard,
                label: "Workshops",
                copy: "Hands-on technical learning",
              },
              {
                icon: Code2,
                label: "Hackathons",
                copy: "Rapid, collaborative building",
              },
              {
                icon: Radio,
                label: "Competitions",
                copy: "Applied engineering challenges",
              },
            ].map(({ copy, icon: Icon, label }) => (
              <article className="event-mini" data-reveal key={label}>
                <Icon aria-hidden="true" />
                <div>
                  <ContentBadge>Programming preview</ContentBadge>
                  <Heading as="h3">{label}</Heading>
                  <p>{copy}</p>
                </div>
                <ChevronRight aria-hidden="true" size={18} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Gallery() {
  return (
    <section
      aria-labelledby="gallery-title"
      className="section section--ruled"
      id="gallery"
    >
      <div className="container">
        <div className="section-heading-row">
          <SectionIntro
            description="An illustrative preview of the visual storytelling intended for the final verified AAVESH gallery."
            index="06"
            label="Gallery"
            title={
              <>
                Moments that
                <br />
                build tomorrow.
              </>
            }
          />
          <div className="content-notice content-notice--compact" data-reveal>
            <ContentBadge>Illustrative imagery</ContentBadge>
            <p>Replace with approved AAVESH photography before publication.</p>
          </div>
        </div>

        <div className="gallery-grid">
          {gallery.map((item, index) => (
            <article
              className={`gallery-card gallery-card--${index + 1}`}
              data-reveal
              key={item.title}
            >
              <img alt={item.alt} loading="lazy" src={item.image} />
              <div className="gallery-card__overlay">
                <span>{item.label}</span>
                <Heading as="h3">{item.title}</Heading>
                <small>{item.credit}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const teamGroups = [
  {
    icon: Users,
    title: "Faculty coordination",
    role: "Guidance & institutional support",
    code: "TEAM.01",
  },
  {
    icon: Radio,
    title: "Student council",
    role: "Society leadership",
    code: "TEAM.02",
  },
  {
    icon: Cpu,
    title: "Core electronics",
    role: "Hardware & embedded systems",
    code: "TEAM.03",
  },
  {
    icon: Code2,
    title: "Software & intelligence",
    role: "AI/ML & development",
    code: "TEAM.04",
  },
]

function Team() {
  return (
    <section
      aria-labelledby="team-title"
      className="section section--ruled"
      id="team"
    >
      <div className="container split-section">
        <SectionIntro
          description="A student-led technical community supported by faculty and shaped by its contributors."
          index="07"
          label="Team"
          title={
            <>
              People behind
              <br />
              <span className="accent-text">AAVESH.</span>
            </>
          }
        />

        <div className="team-area">
          <div className="content-notice" data-reveal>
            <ContentBadge>Roster pending</ContentBadge>
            <p>
              Names, roles, portraits, and profile links require the current
              verified AAVESH team roster.
            </p>
          </div>
          <div className="team-grid">
            {teamGroups.map(({ code, icon: Icon, role, title }) => (
              <article className="team-card" data-reveal key={title}>
                <div className="team-card__portrait">
                  <Icon aria-hidden="true" />
                  <span>{code}</span>
                </div>
                <Heading as="h3">{title}</Heading>
                <p>{role}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Sponsors() {
  return (
    <section
      aria-labelledby="sponsors-title"
      className="section section--ruled"
      id="sponsors"
    >
      <div className="container sponsors-layout">
        <SectionIntro
          description="Partnerships can help student builders access tools, mentorship, components, and opportunities."
          index="08"
          label="Sponsors"
          title={
            <>
              Build the next
              <br />
              thing with us.
            </>
          }
        />
        <div className="sponsor-panel" data-reveal>
          <div className="sponsor-panel__status">
            <span className="status-dot" />
            <div>
              <ContentBadge>Verified roster required</ContentBadge>
              <Heading as="h3">
                Sponsor logos are intentionally not invented.
              </Heading>
              <p>
                Approved partner identities and links can be added here when
                supplied by AAVESH.
              </p>
            </div>
          </div>
          <ButtonLink href="#contact">
            Discuss a partnership
            <ArrowRight aria-hidden="true" size={17} />
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function ContactField({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string
  name: string
  placeholder: string
  type?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} placeholder={placeholder} required type={type} />
    </label>
  )
}

function Contact() {
  const [status, setStatus] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(
      "Preview only: no message was sent. Connect a verified AAVESH inbox before launch.",
    )
  }

  return (
    <section
      aria-labelledby="contact-title"
      className="contact-section"
      id="contact"
    >
      <div aria-hidden="true" className="contact-section__image" />
      <div className="container contact-grid">
        <div className="contact-copy" data-reveal>
          <SectionLabel index="09">Contact</SectionLabel>
          <Heading className="section-title" id="contact-title">
            Let&apos;s build
            <br />
            something <span className="accent-text">real.</span>
          </Heading>
          <p>
            Have a collaboration idea, workshop proposal, or question for the
            society? The production form will route messages to a verified
            AAVESH inbox.
          </p>
          <div className="contact-detail">
            <Mail aria-hidden="true" />
            <span>Official contact address required before launch</span>
          </div>
        </div>

        <form className="contact-form" data-reveal onSubmit={handleSubmit}>
          <div className="field-row">
            <ContactField
              label="Your name"
              name="name"
              placeholder="Enter your name"
            />
            <ContactField
              label="Email address"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          <label className="field">
            <span>Inquiry type</span>
            <select defaultValue="" name="type" required>
              <option disabled value="">
                Select an inquiry
              </option>
              <option>General question</option>
              <option>Workshop collaboration</option>
              <option>Project collaboration</option>
              <option>Sponsorship</option>
            </select>
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              name="message"
              placeholder="Tell AAVESH what you have in mind"
              required
              rows={5}
            />
          </label>
          <div className="form-footer">
            <button className="button button--primary" type="submit">
              Prepare enquiry
              <ArrowRight aria-hidden="true" size={17} />
            </button>
            <p
              aria-live="polite"
              className={status ? "form-status is-visible" : "form-status"}
            >
              {status}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

function Footer({ onReplayIntro }: { onReplayIntro?: () => void }) {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <BrandMark />
          <div>
            <strong>AAVESH</strong>
            <span>Electronics & Technology Society</span>
            <span>IIIT Una</span>
          </div>
        </div>
        <nav aria-label="Footer navigation" className="footer-nav">
          {navigation.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
          <Link href="#contact">Contact</Link>
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="text-xs uppercase tracking-wider text-[#FF1238] hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-left font-mono"
            >
              [Replay Intro]
            </button>
          )}
        </nav>
        <div className="footer-social" aria-label="Social link placeholders">
          <span>Verified social URLs required</span>
          <p>Instagram · LinkedIn · GitHub</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Website preview for AAVESH, IIIT Una</span>
        <span>Production copyright details pending verification</span>
      </div>
    </footer>
  )
}

export default function App() {
  const [reverseFlow, setReverseFlow] = useState(false)
  const [introKey, setIntroKey] = useState(0)
  const [forceIntro, setForceIntro] = useState(false)

  const handleReplayIntro = () => {
    sessionStorage.removeItem("aavesh_intro_seen")
    setForceIntro(true)
    setIntroKey((prev) => prev + 1)
  }

  const handleToggleReverseFlow = () => {
    setReverseFlow((prev) => !prev)
  }

  // Interactive 3D Tilt & Radial Spotlight for cards
  useEffect(() => {
    const handleCardMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest(
        ".domain-card, .project-card, .event-feature, .gallery-card, .team-card",
      ) as HTMLElement | null
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      card.style.setProperty("--mouse-x", `${x}px`)
      card.style.setProperty("--mouse-y", `${y}px`)

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotX = ((y - centerY) / centerY) * -5
      const rotY = ((x - centerX) / centerX) * 5
      card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-3px)`
    }

    const handleCardLeave = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest(
        ".domain-card, .project-card, .event-feature, .gallery-card, .team-card",
      ) as HTMLElement | null
      if (card) {
        card.style.transform = ""
      }
    }

    window.addEventListener("mousemove", handleCardMove, { passive: true })
    window.addEventListener("mouseout", handleCardLeave, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleCardMove)
      window.removeEventListener("mouseout", handleCardLeave)
    }
  }, [])

  // Bidirectional GSAP ScrollTriggers: plays forward on scroll down AND in reverse on scroll up
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (reduceMotion) return

    const context = gsap.context(() => {
      // 1. Bidirectional section reveal with reverse playback
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              start: "top 88%",
              end: "bottom 8%",
              trigger: element,
              toggleActions: "play reverse play reverse",
            },
          },
        )
      })

      // 2. Bidirectional reverse parallax on section numbers and labels
      gsap.utils.toArray<HTMLElement>(".section-label span:first-child").forEach((el) => {
        gsap.fromTo(
          el,
          { y: -14 },
          {
            y: 14,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        )
      })
    })

    return () => context.revert()
  }, [])

  return (
    <div className={`app-wrapper ${reverseFlow ? "is-polarity-reversed" : ""}`}>
      <CinematicIntro
        key={introKey}
        forcePlay={forceIntro}
        onComplete={() => setForceIntro(false)}
      />
      <Link className="skip-link" href="#main">
        Skip to content
      </Link>
      <Navbar />
      <main id="main">
        <Hero
          onToggleReverseFlow={handleToggleReverseFlow}
          reverseFlow={reverseFlow}
        />
        <About />
        <Domains />
        <Projects />
        <Events />
        <Gallery />
        <Team />
        <Sponsors />
        <Contact />
      </main>
      <Footer onReplayIntro={handleReplayIntro} />
      <TechCursor />
      <ScrollHUD
        onToggleReverseFlow={handleToggleReverseFlow}
        reverseFlow={reverseFlow}
      />
    </div>
  )
}

// Utility Functions
const throttle = (func, limit) => {
  let inThrottle
  return function () {
    const args = arguments

    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

const debounce = (func, wait, immediate) => {
  let timeout
  return function () {
    const args = arguments
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}

const requestIdleCallbackFallback = (callback) => {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback)
  } else {
    return setTimeout(callback, 1)
  }
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
const supportsIntersectionObserver = "IntersectionObserver" in window
const supportsRequestAnimationFrame = "requestAnimationFrame" in window

document.addEventListener("DOMContentLoaded", () => {
  const AOS = window.AOS
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: prefersReducedMotion ? 0 : 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 100,
      disable: prefersReducedMotion,
      mirror: false,
      anchorPlacement: "top-bottom",
    })
  }

  // Update current year in footer
  const currentYearElement = document.getElementById("currentYear")
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear()
  }
})

// Navbar Scroll Behavior
class NavbarController {
  constructor() {
    this.navbar = document.getElementById("navbar")
    this.navLinks = document.querySelectorAll(".nav-link")
    this.sections = document.querySelectorAll("section[id]")
    this.navToggle = document.getElementById("navToggle")
    this.navMenu = document.getElementById("navMenu")
    this.scrollThreshold = 50
    this.isMenuOpen = false
    this.isAnimating = false
    this.lastScrollY = 0
    this.ticking = false
    this.currentSection = ""

    this.init()
  }

  init() {
    window.addEventListener("scroll", this.handleScrollOptimized.bind(this), { passive: true })
    this.navLinks.forEach((link) => {
      link.addEventListener("click", this.handleNavClick.bind(this))
    })

    if (this.navToggle) {
      this.navToggle.addEventListener("click", this.toggleMobileMenu.bind(this))
      // Add touch event for better mobile responsiveness
      this.navToggle.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: true })
    }

    document.addEventListener("click", this.handleOutsideClick.bind(this))
    document.addEventListener("keydown", this.handleKeyDown.bind(this))

    window.addEventListener(
      "orientationchange",
      debounce(() => {
        if (this.isMenuOpen) {
          this.closeMobileMenu()
        }
      }, 150),
    )
  }

  handleScrollOptimized() {
    this.lastScrollY = window.scrollY
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.handleScroll()
        this.ticking = false
      })
      this.ticking = true
    }
  }

  handleTouchStart(e) {
    // Prevent double-tap zoom on mobile
    e.preventDefault()
  }

  toggleMobileMenu() {
    if (this.isAnimating) return

    this.isAnimating = true
    this.isMenuOpen = !this.isMenuOpen

    if (supportsRequestAnimationFrame) {
      requestAnimationFrame(() => {
        this.navToggle.classList.toggle("active", this.isMenuOpen)
        this.navMenu.classList.toggle("active", this.isMenuOpen)
        this.navbar.classList.toggle("menu-active", this.isMenuOpen)

        if (this.isMenuOpen) {
          const scrollY = window.scrollY
          document.body.style.position = "fixed"
          document.body.style.top = `-${scrollY}px`
          document.body.style.width = "100%"
          document.body.style.overflow = "hidden"
          this.navToggle.setAttribute("aria-expanded", "true")
        } else {
          const scrollY = document.body.style.top
          document.body.style.position = ""
          document.body.style.top = ""
          document.body.style.width = ""
          document.body.style.overflow = ""
          window.scrollTo(0, Number.parseInt(scrollY || "0") * -1)
          this.navToggle.setAttribute("aria-expanded", "false")
        }

        setTimeout(() => {
          this.isAnimating = false
        }, 400)
      })
    }
  }

  closeMobileMenu() {
    if (this.isMenuOpen && !this.isAnimating) {
      this.isAnimating = true
      this.isMenuOpen = false

      if (supportsRequestAnimationFrame) {
        requestAnimationFrame(() => {
          this.navToggle.classList.remove("active")
          this.navMenu.classList.remove("active")
          this.navbar.classList.remove("menu-active")

          const scrollY = document.body.style.top
          document.body.style.position = ""
          document.body.style.top = ""
          document.body.style.width = ""
          document.body.style.overflow = ""
          window.scrollTo(0, Number.parseInt(scrollY || "0") * -1)
          this.navToggle.setAttribute("aria-expanded", "false")

          setTimeout(() => {
            this.isAnimating = false
          }, 400)
        })
      }
    }
  }

  handleScroll() {
    const scrollY = this.lastScrollY

    const shouldBeScrolled = scrollY > this.scrollThreshold
    const isScrolled = this.navbar.classList.contains("scrolled")

    if (shouldBeScrolled !== isScrolled) {
      this.navbar.classList.toggle("scrolled", shouldBeScrolled)
    }

    this.updateActiveNavLink()
    this.updateBackToTopButton(scrollY)
  }

  updateActiveNavLink() {
    let current = ""
    const scrollY = this.lastScrollY

    for (const section of this.sections) {
      const sectionTop = section.offsetTop - 150
      const sectionHeight = section.offsetHeight

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id")
        break
      }
    }

    if (this.currentSection !== current) {
      this.currentSection = current
      this.navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${current}`
        link.classList.toggle("active", isActive)
      })
    }
  }

  updateBackToTopButton(scrollY) {
    const backToTopBtn = document.getElementById("backToTop")
    if (backToTopBtn) {
      const shouldBeVisible = scrollY > 300
      const isVisible = backToTopBtn.classList.contains("visible")

      if (shouldBeVisible !== isVisible) {
        backToTopBtn.classList.toggle("visible", shouldBeVisible)
      }
    }
  }

  handleNavClick(e) {
    e.preventDefault()
    const targetId = e.target.getAttribute("href")
    const targetSection = document.querySelector(targetId)

    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 80
      if ("scrollBehavior" in document.documentElement.style) {
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        })
      } else {
        // Fallback for browsers without smooth scroll support
        this.smoothScrollTo(offsetTop, 800)
      }

      this.closeMobileMenu()
    }
  }

  smoothScrollTo(target, duration) {
    const start = window.scrollY
    const distance = target - start
    let startTime = null

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const run = this.easeInOutQuad(timeElapsed, start, distance, duration)
      window.scrollTo(0, run)
      if (timeElapsed < duration) requestAnimationFrame(animation)
    }

    requestAnimationFrame(animation)
  }

  easeInOutQuad(t, b, c, d) {
    t /= d / 2
    if (t < 1) return (c / 2) * t * t + b
    t--
    return (-c / 2) * (t * (t - 2) - 1) + b
  }

  handleKeyDown(e) {
    if (e.key === "Escape" && this.isMenuOpen) {
      this.closeMobileMenu()
    }
  }

  handleOutsideClick(e) {
    if (this.isMenuOpen && !this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
      this.closeMobileMenu()
    }
  }
}

// Typed Text Effect
class TypedTextEffect {
  constructor(element, texts, options = {}) {
    this.element = element
    this.texts = texts
    this.options = {
      typeSpeed: options.typeSpeed || 100,
      deleteSpeed: options.deleteSpeed || 50,
      pauseTime: options.pauseTime || 2000,
      loop: options.loop !== false,
      ...options,
    }

    this.currentTextIndex = 0
    this.currentCharIndex = 0
    this.isDeleting = false
    this.isPaused = false
    this.cursor = null

    if (!prefersReducedMotion) {
      this.init()
    } else {
      this.element.textContent = this.texts[0]
    }
  }

  init() {
    this.addCursor()
    this.type()
  }

  addCursor() {
    this.cursor = document.createElement("span")
    this.cursor.className = "typing-cursor"
    this.cursor.textContent = "|"
    this.cursor.style.cssText = `
      animation: blink 1s infinite;
      color: currentColor;
      font-weight: normal;
    `
    this.element.parentNode.insertBefore(this.cursor, this.element.nextSibling)
  }

  type() {
    const currentText = this.texts[this.currentTextIndex]

    if (this.isDeleting) {
      this.element.textContent = currentText.substring(0, this.currentCharIndex - 1)
      this.currentCharIndex--
    } else {
      this.element.textContent = currentText.substring(0, this.currentCharIndex + 1)
      this.currentCharIndex++
    }

    let typeSpeed = this.isDeleting ? this.options.deleteSpeed : this.options.typeSpeed

    if (!this.isDeleting && this.currentCharIndex === currentText.length) {
      typeSpeed = this.options.pauseTime
      this.isDeleting = true
    } else if (this.isDeleting && this.currentCharIndex === 0) {
      this.isDeleting = false
      this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length
    }

    setTimeout(() => this.type(), typeSpeed)
  }
}

// Particle System
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.particles = []
    this.animationId = null
    this.isVisible = true
    this.lastFrameTime = 0
    this.frameCount = 0
    this.fps = 60

    this.init()
    this.setupIntersectionObserver()
    this.setupResizeHandler()
  }

  init() {
    this.resize()
    this.createParticles()
    if (!prefersReducedMotion) {
      this.animate()
    }
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.canvas.style.width = rect.width + "px"
    this.canvas.style.height = rect.height + "px"
    this.ctx.scale(dpr, dpr)
  }

  createParticles() {
    const particleCount = prefersReducedMotion
      ? 0
      : Math.min(50, Math.floor((this.canvas.width * this.canvas.height) / 15000)) // Reduced particle density for better performance

    this.particles = []
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * (this.canvas.width / (window.devicePixelRatio || 1)),
        y: Math.random() * (this.canvas.height / (window.devicePixelRatio || 1)),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: `hsl(${240 + Math.random() * 60}, 70%, 60%)`,
        life: Math.random() * 100 + 100,
        maxLife: Math.random() * 100 + 100,
      })
    }
  }

  animate(currentTime = 0) {
    if (!this.isVisible) return

    if (currentTime - this.lastFrameTime < 1000 / this.fps) {
      this.animationId = requestAnimationFrame((time) => this.animate(time))
      return
    }

    this.lastFrameTime = currentTime
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.particles.forEach((particle, index) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--

      // Wrap around edges
      const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1)
      const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1)

      if (particle.x < 0) particle.x = canvasWidth
      if (particle.x > canvasWidth) particle.x = 0
      if (particle.y < 0) particle.y = canvasHeight
      if (particle.y > canvasHeight) particle.y = 0

      const lifeRatio = particle.life / particle.maxLife
      const currentOpacity = particle.opacity * Math.max(0, lifeRatio)

      // Draw particle
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fillStyle = particle.color
      this.ctx.globalAlpha = currentOpacity
      this.ctx.fill()

      if (particle.life <= 0) {
        this.particles[index] = {
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: `hsl(${240 + Math.random() * 60}, 70%, 60%)`,
          life: Math.random() * 100 + 100,
          maxLife: Math.random() * 100 + 100,
        }
      }
    })

    this.ctx.globalAlpha = 1
    this.animationId = requestAnimationFrame((time) => this.animate(time))
  }

  setupIntersectionObserver() {
    if (!supportsIntersectionObserver) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting
          if (this.isVisible && !this.animationId && !prefersReducedMotion) {
            this.animate()
          } else if (!this.isVisible && this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
          }
        })
      },
      { threshold: 0.1 },
    ) // Added threshold for better performance

    observer.observe(this.canvas.parentElement)
  }

  setupResizeHandler() {
    window.addEventListener(
      "resize",
      debounce(() => {
        this.resize()
        this.createParticles()
      }, 250),
    )
  }
}

// Tools Section Interactions
class ToolsController {
  constructor() {
    this.toolCards = document.querySelectorAll(".tool-card")
    this.init()
  }

  init() {
    this.toolCards.forEach((card) => {
      card.addEventListener("mouseenter", this.handleMouseEnter.bind(this))
      card.addEventListener("mouseleave", this.handleMouseLeave.bind(this))
    })
  }

  handleMouseEnter(e) {
    if (!prefersReducedMotion) {
      const icon = e.currentTarget.querySelector(".tool-icon")
      icon.classList.add("shimmer-active")
    }
  }

  handleMouseLeave(e) {
    const icon = e.currentTarget.querySelector(".tool-icon")
    icon.classList.remove("shimmer-active")
  }
}

// Project Cards Enhancement
class ProjectsController {
  constructor() {
    this.projectCards = document.querySelectorAll(".project-card")
    this.init()
  }

  init() {
    this.projectCards.forEach((card) => {
      card.addEventListener("mouseenter", this.handleMouseEnter.bind(this))
      card.addEventListener("mouseleave", this.handleMouseLeave.bind(this))
      card.addEventListener("mousemove", this.handleMouseMove.bind(this))
    })
  }

  handleMouseEnter(e) {
    if (prefersReducedMotion) return

    const card = e.currentTarget
    card.style.transition = "transform 0.1s ease-out"
  }

  handleMouseLeave(e) {
    const card = e.currentTarget
    card.style.transform = ""
    card.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  }

  handleMouseMove(e) {
    if (prefersReducedMotion || window.innerWidth < 768) return

    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`
  }
}

// Contact Form Handler
class ContactFormController {
  constructor() {
    this.form = document.getElementById("contactForm")
    this.init()
  }

  init() {
    if (this.form) {
      this.form.addEventListener("submit", this.handleSubmit.bind(this))
    }
  }

  handleSubmit(e) {
    e.preventDefault()

    const formData = new FormData(this.form)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    }

    if (this.validateForm(data)) {
      this.sendEmail(data)
      this.showToast("Message sent successfully! I'll get back to you soon.", "success")
      this.form.reset()
    }
  }

  validateForm(data) {
    const errors = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long")
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push("Please enter a valid email address")
    }

    if (!data.subject || data.subject.trim().length < 3) {
      errors.push("Subject must be at least 3 characters long")
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push("Message must be at least 10 characters long")
    }

    if (errors.length > 0) {
      this.showToast(errors[0], "error")
      return false
    }

    return true
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  sendEmail(data) {
    const subject = encodeURIComponent(`Portfolio Contact: ${data.subject}`)
    const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`)
    const mailtoLink = `mailto:gunjansoni27official@gmail.com?subject=${subject}&body=${body}`

    window.open(mailtoLink)
  }

  showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    toastContainer.appendChild(toast)

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("show")
    })

    // Remove toast after 5 seconds
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 5000)
  }
}

// Back to Top Button
class BackToTopController {
  constructor() {
    this.button = document.getElementById("backToTop")
    this.init()
  }

  init() {
    if (this.button) {
      this.button.addEventListener("click", this.scrollToTop.bind(this))
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }
}

// CV Download Handler
class CVDownloadController {
  constructor() {
    this.button = document.getElementById("downloadCV")
    this.init()
  }

  init() {
    if (this.button) {
      this.button.addEventListener("click", this.generateAndDownloadCV.bind(this))
    }
  }

  generateAndDownloadCV() {
    // Create a simple PDF-like content as data URI
    const cvContent = this.generateCVContent()
    const blob = new Blob([cvContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "Gunjan_Soni_CV.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Show success toast
    this.showToast("CV downloaded successfully!", "success")
  }

  generateCVContent() {
    return `
GUNJAN SONI
Full-Stack Web Developer

Contact Information:
Email: gunjansoni27official@gmail.com
Phone: +91 7974970843
Location: Bhopal, India

Professional Summary:
Passionate full-stack developer building fast, modern, animated web experiences with clean code and great UX.

Technical Skills:
- Frontend: HTML5, CSS3, JavaScript, React, Vue.js
- Backend: Node.js, Express.js, Python
- Databases: MongoDB, MySQL, Firebase
- Tools: VS Code, Git, GitHub, Docker, Figma
- Cloud: Firebase, AWS, Vercel

Experience:
[Your experience details would go here]

Education:
[Your education details would go here]

Projects:
- E-Commerce Platform: Full-stack solution with React, Node.js, and Firebase
- Task Management App: Collaborative tool with real-time updates
- Weather Dashboard: Beautiful weather app with interactive charts

Generated on: ${new Date().toLocaleDateString()}
        `.trim()
  }

  showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    toastContainer.appendChild(toast)

    requestAnimationFrame(() => {
      toast.classList.add("show")
    })

    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}

// Global scroll to top function
window.scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

function initializeControllers() {
  requestIdleCallbackFallback(() => {
    try {
      // Initialize all controllers with error handling
      const navbar = new NavbarController()
      const backToTop = new BackToTopController()
      const contactForm = new ContactFormController()
      const cvDownload = new CVDownloadController()

      // Initialize typed text effect with error handling
      const typedTextElement = document.getElementById("typedText")
      if (typedTextElement) {
        new TypedTextEffect(typedTextElement, [
          "Full-Stack Web Developer",
          "Frontend Craftsman",
          "Firebase Enthusiast",
          "UI/UX Designer",
          "Problem Solver",
        ])
      }

      // Initialize particle system with error handling
      const particleCanvas = document.getElementById("particleCanvas")
      if (particleCanvas) {
        new ParticleSystem(particleCanvas)
      }

      // Initialize tools and projects controllers
      new ToolsController()
      new ProjectsController()

      // Mark body as loaded for fade-in effect
      document.body.classList.add("loaded")
    } catch (error) {
      console.warn("Some features may not be available:", error)
      // Ensure body is still marked as loaded even if some features fail
      document.body.classList.add("loaded")
    }
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeControllers)
} else {
  initializeControllers()
}

const style = document.createElement("style")
style.textContent = `
  .tab-hidden * {
    animation-play-state: paused !important;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  body {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  
  body.loaded {
    opacity: 1;
  }
  
  .typing-cursor {
    display: inline-block;
    margin-left: 2px;
  }
`
document.head.appendChild(style)


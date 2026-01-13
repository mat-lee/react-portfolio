import React, { useEffect, useState, useRef } from "react";
import { Menu, X, Github, Linkedin, Mail, ExternalLink, ChevronUp, FlaskConical } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import projectsData from "./data/projects.json";
import labsData from "./data/labs.json";

function MainApp() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [showToTop, setShowToTop] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 80;
      const elementPosition = el.offsetTop - navHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  };

  // Simple scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "projects", "contact"];
      const scrollPosition = window.scrollY + 100;
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActive(sectionId);
            break;
          }
        }
      }
      
      // Progress and to-top
      const doc = document.documentElement;
      const pct = (window.scrollY / Math.max(1, doc.scrollHeight - doc.clientHeight)) * 100;
      setScrollPct(Math.min(100, Math.max(0, pct)));
      setShowToTop(window.scrollY > 400);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NavLink = ({ id, children, mobile = false }) => (
    <button
      onClick={() => scrollTo(id)}
      className={`group relative ${mobile ? "w-full text-left py-3 text-lg" : "text-sm"} font-medium text-gray-600 transition-colors hover:text-gray-900`}
    >
      <span className={active === id ? "text-gray-900" : ""}>{children}</span>
      <span
        className={`absolute left-0 -bottom-1 h-[2px] rounded-full transition-all duration-300 bg-gray-900 ${
          active === id ? "w-full" : "w-0 group-hover:w-2/3"
        }`}
      />
    </button>
  );

  const SectionTitle = ({ kicker, title, subtitle }) => (
    <div className="mb-12">
      {kicker && (
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300" /> {kicker}
        </p>
      )}
      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-3 max-w-2xl text-gray-600">{subtitle}</p>}
    </div>
  );

  const Pill = ({ children }) => (
    <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
      {children}
    </span>
  );

  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      color: '#111827',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.5'
    }}>
      
      {/* Global styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        html {
          scroll-behavior: auto;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        #root {
          margin: 0 !important;
          padding: 0 !important;
          max-width: none !important;
          text-align: left !important;
        }
        
        .card-animate {
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.6s ease-out;
        }
        
        .card-animate.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        // .hero-title {
        //   background: linear-gradient(to bottom, #111827, #6b7280);
        //   -webkit-background-clip: text;
        //   background-clip: text;
        //   color: transparent;
        //   animation: fadeInUp 0.8s ease-out forwards;
        //   opacity: 0;
        // }
        
        .hero-title {
          color: #111827;
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .mobile-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }
        
        .mobile-menu.open {
          max-height: 300px;
        }
        
        @media (min-width: 768px) {
          .md\\:hidden {
            display: none !important;
          }
          .md\\:flex {
            display: flex !important;
          }
          .md\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .md\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .lg\\:col-span-2 {
            grid-column: span 2 / span 2 !important;
          }
        }
      `}</style>

      {/* Progress bar */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '4px',
          backgroundColor: '#111827',
          width: `${scrollPct}%`,
          zIndex: 60,
          transition: 'width 0.1s ease-out'
        }}
      />

      {/* Background decorations */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(135deg, #f3f4f6, #ffffff)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.7
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, #ffffff, #f3f4f6)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.7
        }} />
      </div>

      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '80px'
        }}>
          <button onClick={() => scrollTo("home")} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: 'none',
            background: 'none',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#111827',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              ML
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.2' }}>
                Matthew Lee
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.2' }}>
                CS + Math @ UNC
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
            <NavLink id="about">About</NavLink>
            <NavLink id="projects">Projects</NavLink>
            <NavLink id="contact">Contact</NavLink>
            <a
              href="mailto:matthewlee01234@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Mail size={16} /> Email
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: 'block',
              padding: '8px',
              border: 'none',
              background: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            className="md:hidden"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''} md:hidden`} style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <NavLink id="about" mobile>About</NavLink>
              <NavLink id="projects" mobile>Projects</NavLink>
              <NavLink id="contact" mobile>Contact</NavLink>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <a href="mailto:matthewlee01234@gmail.com" style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                textDecoration: 'none'
              }}>
                Email me
              </a>
              <a href="https://github.com/mat-lee" target="_blank" rel="noreferrer" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                textDecoration: 'none'
              }}>
                <Github size={16} /> GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{
        padding: '120px 24px 80px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h1 className="hero-title" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            Matthew Lee
          </h1>
          <p style={{
            fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
            color: '#6b7280',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Computer Science & Mathematics @ UNC Chapel Hill — building ML/RL systems that go from research ideas to working software.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <a
              href="https://github.com/mat-lee"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#111827',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <Github size={16} /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/matthew-lee-155896333/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Linkedin size={16} /> LinkedIn
            </a>
            <a
              href="mailto:matthewlee01234@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <Mail size={16} /> Email
            </a>
          </div>
        </div>
        <div
        style={{
          marginTop: '48px',
          height: '1px',
          backgroundColor: '#e5e7eb',
          width: "100%"
        }}
      />
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Projects Section */}
      <ProjectsSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <p>© {new Date().getFullYear()} Matthew Lee. Built with React + Tailwind.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="https://github.com/mat-lee" target="_blank" rel="noreferrer" style={{
              color: '#6b7280',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#374151'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
              <Github size={18} />
            </a>
            <a href="https://www.linkedin.com/in/matthew-lee-155896333/" target="_blank" rel="noreferrer" style={{
              color: '#6b7280',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#374151'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
              <Linkedin size={18} />
            </a>
            <a href="mailto:matthewlee01234@gmail.com" style={{
              color: '#6b7280',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#374151'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
              <Mail size={18} />
            </a>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      {showToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 50,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#111827',
            color: 'white',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          <ChevronUp size={16} /> Top
        </button>
      )}
    </div>
  );
}

// About Section Component
function AboutSection() {
  const aboutRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={aboutRef} style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div className={`card-animate ${isVisible ? 'visible' : ''}`}>
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            marginBottom: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#6b7280'
          }}>
            <span style={{
              display: 'inline-block',
              height: '8px',
              width: '8px',
              borderRadius: '50%',
              backgroundColor: '#d1d5db'
            }} /> About
          </p>
          <h2 style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '12px'
          }}>
            Curious, practical, impact-oriented
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px'
        }}>
          {/* Main content card */}
          <div style={{
            gridColumn: 'span 1',
            padding: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}
          className="lg:col-span-2">
            <div style={{ maxWidth: 'none' }}>
              <p style={{
                fontSize: '18px',
                color: '#374151',
                marginBottom: '16px'
              }}>
                I'm a student at the University of North Carolina at Chapel Hill, pursuing a dual major in Computer Science and Mathematics.
              </p>
              <p style={{
                color: '#374151'
              }}>
                I have a deep passion for learning and trying new things—while my main interests are machine learning and artificial intelligence, there's always something new to explore in the world of technology. I'm constantly seeking out new challenges and opportunities to grow my skills, and I am passionate about using these technologies to solve real world problems and create a meaningful impact in the world.
              </p>
            </div>
            <div style={{
              marginTop: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {["Python", "PyTorch", "Tensorflow", "Pandas", "Scikit-learn", "Frontend", "Backend"].map((tech) => (
                <span key={tech} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Projects Section Component
function ProjectsSection() {
  const projectsRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (projectsRef.current) {
      observer.observe(projectsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="projects" ref={projectsRef} style={{
      padding: '80px 24px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div className={`card-animate ${isVisible ? 'visible' : ''}`}>
          <div style={{ marginBottom: '48px' }}>
            <p style={{
              marginBottom: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280'
            }}>
              <span style={{
                display: 'inline-block',
                height: '8px',
                width: '8px',
                borderRadius: '50%',
                backgroundColor: '#d1d5db'
              }} /> Projects
            </p>
            <h2 style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
              fontWeight: '800',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Selected Work
            </h2>
            <p style={{
              color: '#6b7280',
              maxWidth: '500px'
            }}>
              A few things I've built and iterated on.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }}>
            {projectsData.map(project => {
              const projectLabs = labsData.filter(lab => lab.projectId === project.id);
              return (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={project.summary}
                  github={project.github}
                  link={project.link}
                  linkText={project.linkText || "View"}
                  tags={project.tags || []}
                  status={project.status || "Ongoing"}
                  labs={projectLabs}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ title, description, link, linkText = "Demo", github, tags = [], status, labs = [] }) {
  const linkBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    textDecoration: 'none',
    transition: 'color 0.2s'
  };

  const getStatusColor = (status) => {
    if (status.toLowerCase().includes("ongoing")) return "#facc15"; // yellow
    if (status.toLowerCase().includes("public") || status.toLowerCase().includes("complete")) return "#22c55e"; // green
    return "#ef4444"; // red
  };

  return (
    <div
      style={{
        padding: '32px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)')}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</h3>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              aria-label={`${title} – ${linkText}`}
              style={linkBaseStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
            >
              {linkText} <ExternalLink size={16} />
            </a>
          )}
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              aria-label={`${title} – GitHub repository`}
              style={linkBaseStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
            >
              GitHub <Github size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', flex: 1 }}>
        {description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6b7280'
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Labs and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
        {labs.length > 0 && (
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lab Notes
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {labs.map(lab => (
                <a
                  key={lab.id}
                  href={lab.url || `https://labs.codebymatthewlee.com/${lab.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  <FlaskConical size={12} />
                  {lab.title}
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280', flexShrink: 0, marginTop: labs.length > 0 ? '16px' : '0' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(status)
            }}
          />
          {status}
        </div>
      </div>
    </div>
  );
}

// Contact Section Component
function ContactSection() {
  const contactRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (contactRef.current) {
      observer.observe(contactRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="contact" ref={contactRef} style={{
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div className={`card-animate ${isVisible ? 'visible' : ''}`}>
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            marginBottom: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#6b7280'
          }}>
            <span style={{
              display: 'inline-block',
              height: '8px',
              width: '8px',
              borderRadius: '50%',
              backgroundColor: '#d1d5db'
            }} /> Contact
          </p>
          <h2 style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.25rem)',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '12px'
          }}>
            Say hello
          </h2>
          <p style={{
            color: '#6b7280',
            maxWidth: '600px'
          }}>
            I'm always open to discussing opportunities, projects, or just having a conversation about technology and machine learning. Feel free to reach out!
          </p>
        </div>

        <div style={{
          padding: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }}>
            <ContactCard
              href="mailto:matthewlee01234@gmail.com"
              icon={<Mail />}
              text="matthewlee01234@gmail.com"
            />
            <ContactCard
              href="https://github.com/mat-lee"
              icon={<Github />}
              text="github.com/mat-lee"
              external
            />
            <ContactCard
              href="https://www.linkedin.com/in/matthew-lee-155896333/"
              icon={<Linkedin />}
              text="linkedin.com/in/matthew-lee-155896333"
              external
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactCard({ href, icon, text, external }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        textDecoration: 'none',
        color: '#374151',
        transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      {icon}
      <span style={{ fontSize: '14px' }}>{text}</span>
    </a>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
}
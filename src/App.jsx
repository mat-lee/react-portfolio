import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const NavLink = ({ href, children, mobile = false }) => (
    <button
      onClick={() => scrollToSection(href.slice(1))}
      className={`${mobile ? 'block w-full text-left py-3' : 'py-2'} 
                 text-gray-600 hover:text-gray-900 transition-colors duration-200 
                 ${activeSection === href.slice(1) ? 'text-gray-900 font-medium' : ''}
                 ${mobile ? 'text-lg border-b border-gray-100 last:border-b-0' : 'text-sm font-medium'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => scrollToSection('home')}
              className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Matthew Lee
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <NavLink href="#about">About</NavLink>
              <NavLink href="#projects">Projects</NavLink>
              <NavLink href="#contact">Contact</NavLink>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 -mr-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="space-y-1">
                <NavLink href="#about" mobile>About</NavLink>
                <NavLink href="#projects" mobile>Projects</NavLink>
                <NavLink href="#contact" mobile>Contact</NavLink>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-6">
              Matthew Lee
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-8">
              Computer Science & Math student at UNC Chapel Hill with a passion for AI and machine learning.
            </p>
            <div className="flex justify-center space-x-6 text-lg">
              <a
                href="mailto:matthewlee01234@gmail.com"
                className="text-gray-600 hover:text-gray-900 transition-colors underline"
              >
                Email
              </a>
              <a
                href="https://github.com/mat-lee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors underline"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/matthew-lee-155896333/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors underline"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">About</h2>
          <div className="max-w-4xl">
            <div className="prose prose-lg prose-gray">
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-6">
                I'm a student at the University of North Carolina at Chapel Hill, 
                pursuing a dual major in Computer Science and Mathematics.
              </p>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-8">
                Machine learning and artificial intelligence are my main interests. I'm passionate about 
                using these technologies to solve real-world problems and create meaningful impact.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                <span className="font-medium">Focus areas:</span> UNC Chapel Hill, Computer Science, Mathematics, Machine Learning, AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">Projects</h2>
          
          <div className="space-y-12">
            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:space-x-8">
                <div className="flex-1">
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                    Reinforcement Learning with TETRIS
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    An implementation of reinforcement learning algorithms and AI to play 1-on-1 TETRIS. 
                    Built with Python and implemented with PyTorch and Keras for deep learning. 
                    Incorporates machine learning concepts from both Chess and Go to accelerate learning.
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    <span className="font-medium">Technologies:</span> Python, PyTorch, Keras, Reinforcement Learning
                  </p>
                  <a 
                    href="https://github.com/mat-lee/tetris-reinforcement-learning"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors underline"
                  >
                    View Project →
                  </a>
                </div>
              </div>
            </div>

            {/* Placeholder for future projects */}
            {/* <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-500 mb-2">More Projects Coming Soon</h3>
                <p className="text-gray-400">I'm constantly working on new projects and learning new technologies.</p>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">Contact</h2>
          <div className="max-w-4xl">
            <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-8">
              I'm always open to discussing opportunities, projects, or just having a conversation about 
              technology and machine learning. Feel free to reach out!
            </p>
            
            <div className="space-y-3 text-lg">
              <div>
                <span className="text-gray-500 font-medium">Email:</span>{' '}
                <a
                  href="mailto:matthewlee01234@gmail.com"
                  className="text-gray-600 hover:text-gray-900 transition-colors underline"
                >
                  matthewlee01234@gmail.com
                </a>
              </div>
              
              <div>
                <span className="text-gray-500 font-medium">GitHub:</span>{' '}
                <a
                  href="https://github.com/mat-lee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors underline"
                >
                  github.com/mat-lee
                </a>
              </div>
              
              <div>
                <span className="text-gray-500 font-medium">LinkedIn:</span>{' '}
                <a
                  href="https://www.linkedin.com/in/matthew-lee-155896333/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors underline"
                >
                  linkedin.com/in/matthew-lee-155896333
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-gray-500 text-sm">
            © 2025 Matthew Lee. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { Mail, Github, Linkedin, ExternalLink, Code, Database, Globe, Cpu, ChevronDown, Menu, X } from 'lucide-react';

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
      className={`${mobile ? 'block w-full text-left px-4 py-2' : 'px-4 py-2'} 
                 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 
                 ${activeSection === href.slice(1) ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}
                 ${mobile ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Matthew Lee
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              <NavLink href="#home">Home</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="#projects">Projects</NavLink>
              <NavLink href="#contact">Contact</NavLink>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? <X size={24} className="text-gray-700 dark:text-gray-300" /> : <Menu size={24} className="text-gray-700 dark:text-gray-300" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-2 border-t border-gray-100 dark:border-gray-800">
              <NavLink href="#home" mobile>Home</NavLink>
              <NavLink href="#about" mobile>About</NavLink>
              <NavLink href="#projects" mobile>Projects</NavLink>
              <NavLink href="#contact" mobile>Contact</NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Matthew Lee
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Computer Science & Math student at UNC Chapel Hill with a passion for 
              <span className="text-blue-600 dark:text-blue-400 font-semibold"> AI and Machine Learning</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={() => scrollToSection('projects')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 hover:scale-105"
              >
                View My Work
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-full font-semibold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 transition-all duration-300"
              >
                Get In Touch
              </button>
            </div>
          </div>
          <div className="mt-12 lg:mt-16 animate-bounce">
            <ChevronDown size={32} className="mx-auto text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">About Me</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 text-center lg:text-left">
              <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                I'm a student at the University of North Carolina at Chapel Hill, 
                pursuing a dual major in Computer Science and Mathematics.
              </p>
              <p className="text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                Machine learning and Artificial Intelligence are my main interests; using my skills to solve real-world problems is my passion.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4">
                <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">UNC Chapel Hill</span>
                <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">Computer Science</span>
                <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">Mathematics</span>
                <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">Machine Learning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Featured Projects</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Reinforcement Learning with TETRIS
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  An implementation of reinforcement learning algorithms and AI to play 1 on 1 TETRIS. 
                  Built with Python and implemented with Pytorch and Keras for deep learning, and 
                  incorporates machine learning ideas from both Chess and Go to accelerate learning.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm">Machine Learning</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">Python</span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">Keras</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">Pytorch</span>
              </div>
              <a 
                href="https://github.com/mat-lee/tetris-reinforcement-learning"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                <span>View Project</span>
                <ExternalLink size={16} />
              </a>
            </div>

            {/* <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Reinforcement Learning with Poker
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  An implementation of reinforcement learning algorithms to play poker. Features 
                  regret minimization, Monte Carlo sampling, and behavioral strategies to 
                  optimize decision making in a poker game environment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">Regret Minimization</span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">Python</span>
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm">Reinforcement Learning</span>
              </div>
              <button className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors">
                <span>View Project</span>
                <ExternalLink size={16} />
              </button>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Let's Connect</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6 rounded-full"></div>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              I'm always open to discussing new opportunities, interesting projects, 
              or just having a conversation about technology and innovation.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 shadow-xl dark:shadow-2xl max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <a
                href="mailto:matthewlee01234@gmail.com"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Mail className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900 dark:text-white">Email</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">matthewlee01234@gmail.com</span>
              </a>
              
              <a
                href="https://github.com/mat-lee"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Github className="text-gray-800 dark:text-gray-300 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900 dark:text-white">GitHub</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">View my code</span>
              </a>
              
              <a
                href="https://www.linkedin.com/in/matthew-lee-155896333/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <Linkedin className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900 dark:text-white">LinkedIn</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Let's connect</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            © 2025 Matthew Lee. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
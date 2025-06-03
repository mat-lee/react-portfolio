import React, { useState, useEffect } from 'react';
import { Mail, Github, Linkedin, ExternalLink, Code, Database, Globe, Cpu, ChevronDown, Menu, X } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      // const sections = ['home', 'about', 'projects', 'skills', 'contact'];
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
                 text-gray-700 hover:text-blue-600 transition-colors duration-300 
                 ${activeSection === href.slice(1) ? 'text-blue-600 font-semibold' : ''}
                 ${mobile ? 'hover:bg-gray-50' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Matthew Lee
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              <NavLink href="#home">Home</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="#projects">Projects</NavLink>
              {/* <NavLink href="#skills">Skills</NavLink> */}
              <NavLink href="#contact">Contact</NavLink>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-2 border-t border-gray-100">
              <NavLink href="#home" mobile>Home</NavLink>
              <NavLink href="#about" mobile>About</NavLink>
              <NavLink href="#projects" mobile>Projects</NavLink>
              {/* <NavLink href="#skills" mobile>Skills</NavLink> */}
              <NavLink href="#contact" mobile>Contact</NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Matthew Lee
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Computer Science & Math student at UNC Chapel Hill with a passion for 
              <span className="text-blue-600 font-semibold"> AI and Machine Learning</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => scrollToSection('projects')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                View My Work
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                Get In Touch
              </button>
            </div>
          </div>
          <div className="mt-16 animate-bounce">
            <ChevronDown size={32} className="mx-auto text-gray-400" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Me</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </div>
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                I'm a student at the University of North Carolina at Chapel Hill, 
                pursuing a dual major in Computer Science and Mathematics.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Machine learning and Artificial Intelligence are my main interests; using my skills to solve real-world problems is my passion.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">UNC Chapel Hill</span>
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Computer Science</span>
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">Mathematics</span>
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">Machine Learning</span>
              </div>
            </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Reinforcement Learning with TETRIS
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  An implementation of reinforcement learning algorithms and AI to play 1 on 1 TETRIS. 
                  Built with Python and implemented with Pytorch and Keras for deep learning, and 
                  incorporates machine learning ideas from both Chess and Go to accelerate learning.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Machine Learning</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Python</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Keras</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Pytorch</span>
              </div>
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                <span>View Project</span>
                <ExternalLink size={16} />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Reinforcement Learning with Poker
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  An implementation of reinforcement learning algorithms to play poker. Features 
                  regret minimization, Monte Carlo sampling, and behavioral strategyies to 
                  optimize decision making in a poker game environment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Regret Minimization</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Python</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Reinforcement Learning</span>
              </div>
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                <span>View Project</span>
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      {/* <section id="skills" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technical Skills</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl mb-4">
                <Code className="mx-auto text-blue-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Frontend Development</h3>
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">JavaScript/TypeScript</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">React/Next.js</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">Tailwind CSS</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl mb-4">
                <Database className="mx-auto text-green-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Backend & Data</h3>
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">Python</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">AWS Services</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">Git & GitHub</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl mb-4">
                <Cpu className="mx-auto text-purple-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI & Machine Learning</h3>
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">TensorFlow/PyTorch</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">Data Analysis</div>
                  <div className="px-4 py-2 bg-white rounded-lg text-sm font-medium">Statistical Modeling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Let's Connect</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              I'm always open to discussing new opportunities, interesting projects, 
              or just having a conversation about technology and innovation.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid md:grid-cols-3 gap-8">
              <a
                href="mailto:your.email@example.com"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <Mail className="text-blue-600 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900">Email</span>
                <span className="text-gray-600 text-sm">your.email@example.com</span>
              </a>
              
              <a
                href="https://github.com/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <Github className="text-gray-800 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900">GitHub</span>
                <span className="text-gray-600 text-sm">View my code</span>
              </a>
              
              <a
                href="https://linkedin.com/in/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center space-y-3 p-6 rounded-xl hover:bg-blue-50 transition-colors group"
              >
                <Linkedin className="text-blue-600 group-hover:scale-110 transition-transform" size={32} />
                <span className="font-semibold text-gray-900">LinkedIn</span>
                <span className="text-gray-600 text-sm">Let's connect</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Matthew Lee. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider } from "./AppContext";
import { Scene3D } from "./components/Scene3D";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeTransition } from "./components/ThemeTransition";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";
import { Contact } from "./pages/Contact";
import { LabsIndex } from "./pages/labs/LabsIndex";
import { LabsPost } from "./pages/labs/LabsPost";

// How long a clicked crane's own fly-away reads on screen before we actually
// swap routes. Crane3D's release spring (tension 50, friction 14) doesn't
// fully settle until ~1.2s, but the crane is well off-screen well before
// that — this just needs to outlast the "it flew away" read, not the whole
// spring.
const NAVIGATE_DELAY_MS = 550;

// Home's only navigation is 3D-canvas clicks — invisible to a keyboard,
// screen reader, or anything crawling the site without driving a mouse into
// a WebGL canvas. This is the real, always-in-the-DOM way through the site;
// plain instant navigation on purpose, it's not meant to compete with the
// cranes as the primary interaction.
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/labs", label: "Labs" },
  { to: "/contact", label: "Contact" },
];

function SiteNav() {
  const location = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed top-6 left-6 sm:left-8 z-40 flex gap-3 sm:gap-4 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400"
    >
      {NAV_LINKS.map(({ to, label }) => {
        const isCurrent = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={isCurrent ? "page" : undefined}
            className={
              isCurrent
                ? "text-slate-900 dark:text-slate-100"
                : "hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  // Non-null while a crane's exit is playing, between click and the actual
  // navigate() call below. Passed to Scene3D as `leavingPage` so every
  // *other* crane starts its own exit too (see Crane3D's isLeaving effect).
  const [leavingPage, setLeavingPage] = useState(null);

  const handleCraneClick = (route) => {
    if (leavingPage) return;
    setLeavingPage(route);
    setTimeout(() => {
      navigate(route);
      setLeavingPage(null);
    }, NAVIGATE_DELAY_MS);
  };

  // Returning home (e.g. a page's Back button) doesn't go through
  // handleCraneClick, so nothing else clears leavingPage for that path —
  // and Crane3D's own reset (isInitialized, localTimeRef, idle state) is
  // gated on isLeaving/leavingPage going back to null.
  useEffect(() => {
    if (isHome) setLeavingPage(null);
  }, [isHome]);

  return (
    <div className="relative min-h-screen">
      <Scene3D visible={isHome} leavingPage={leavingPage} onCraneClick={handleCraneClick} />

      <SiteNav />
      <ThemeToggle simple={!isHome} />
      <ThemeTransition />

      <main className="relative z-10 w-full min-h-screen pointer-events-none">
        {/* `location` is captured and handed to <Routes> explicitly so the
            outgoing page keeps rendering during its exit animation instead
            of instantly unmounting when the URL changes. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={isHome ? "pointer-events-none w-full h-full" : "pointer-events-auto w-full h-full"}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/labs" element={<LabsIndex />} />
              <Route path="/labs/*" element={<LabsPost />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed bottom-4 right-6 z-40 text-2xl opacity-70 pointer-events-none mix-blend-difference text-white">
        mat-lee
      </div>

      {isHome && (
        <a
          href="https://sketchfab.com/3d-models/3d-origami-crane-38fe6bfec0664af3b7660b2d18cfaf94"
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-4 left-6 z-40 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Crane model by JuanG3D (CC Attribution)
        </a>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

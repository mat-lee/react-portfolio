import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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

      <ThemeToggle simple={!isHome} />
      <ThemeTransition />

      <div className="relative z-10 w-full min-h-screen pointer-events-none">
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
      </div>

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

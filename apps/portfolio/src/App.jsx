import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { AppProvider } from "./AppContext";
import { TransitionProvider } from "./TransitionContext";
import { Scene3D } from "./components/Scene3D";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeTransition } from "./components/ThemeTransition";
import { KamiTransition } from "./components/KamiTransition";
import { captureDomSnapshot } from "./lib/domSnapshot";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";
import { Publications } from "./pages/Publications";
import { SimplePage } from "./pages/SimplePage";
import { Contact } from "./pages/Contact";
import { LabsIndex } from "./pages/labs/LabsIndex";
import { LabsPost } from "./pages/labs/LabsPost";

// Shelved, not deleted: KamiTransition/triggerKami/TransitionProvider below
// are all still fully wired up, just unreachable with this set empty — every
// route now gets the plain fade. Re-enable a route by adding it back here
// (kami's own accompanying pages' Back buttons would also need switching
// back from a plain navigate() to triggerKami() — see About.jsx/LabsIndex.jsx).
const KAMI_ROUTES = new Set([]);
// How long the OTHER cranes get to visibly react (their own exit animation)
// before the snapshot is taken and we navigate — shorter than the plain
// fade's NAVIGATE_DELAY_MS since the fold itself is the main event here.
const KAMI_LEAD_MS = 180;

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
  // { texture, clickPos } while the kami overlay is actively folding; null
  // the rest of the time. KamiTransition's Canvas stays permanently
  // mounted regardless (see its own comment) — this only toggles its
  // visibility/frameloop.
  const [kami, setKami] = useState(null);

  const triggerKami = async (route, clickPos) => {
    if (leavingPage || kami) return;
    setLeavingPage(route);
    await new Promise((resolve) => setTimeout(resolve, KAMI_LEAD_MS));

    let canvas;
    try {
      canvas = await captureDomSnapshot();
    } catch (err) {
      console.error("kami snapshot failed, navigating without it", err);
      navigate(route);
      setLeavingPage(null);
      return;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;

    navigate(route);
    setLeavingPage(null);
    setKami({ texture, clickPos });
  };

  const handleKamiSettled = () => {
    setKami((prev) => {
      prev?.texture.dispose();
      return null;
    });
  };

  const handleCraneClick = (route, clickPos) => {
    if (leavingPage || kami) return;
    if (KAMI_ROUTES.has(route)) {
      triggerKami(route, clickPos);
      return;
    }
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

      <TransitionProvider triggerKami={triggerKami}>
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
                <Route path="/publications" element={<Publications />} />
                <Route path="/simple" element={<SimplePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/labs" element={<LabsIndex />} />
                <Route path="/labs/*" element={<LabsPost />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </TransitionProvider>

      <KamiTransition active={!!kami} texture={kami?.texture} clickPos={kami?.clickPos} onSettled={handleKamiSettled} />

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

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
import { Contact, CONTACT_LINKS } from "./pages/Contact";
import { ArrowLeft } from "lucide-react";
import { WriteupsIndex } from "./pages/writeups/WriteupsIndex";
import { WriteupsPost } from "./pages/writeups/WriteupsPost";

// Shelved, not deleted: KamiTransition/triggerKami/TransitionProvider below
// are all still fully wired up, just unreachable with this set empty — every
// route now gets the plain fade. Re-enable a route by adding it back here
// (kami's own accompanying pages' Back buttons would also need switching
// back from a plain navigate() to triggerKami() — see About.jsx/WriteupsIndex.jsx).
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
  // Whether the inline contact card (below the "Contact" text button) is
  // open — replaces navigating to /contact for that one entry point.
  const [showContactCard, setShowContactCard] = useState(false);
  useEffect(() => {
    if (!isHome) setShowContactCard(false);
  }, [isHome]);

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

      {location.pathname === "/simple" && (
        <button
          onClick={() => navigate("/")}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} /> Back
        </button>
      )}

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
              // The simple page appears/disappears instantly, no fade — it's
              // meant to read as an immediate plain alternative, not another
              // animated destination.
              transition={{ duration: location.pathname === "/simple" ? 0 : 0.25 }}
              className={isHome ? "pointer-events-none w-full h-full" : "pointer-events-auto w-full h-full"}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/publications" element={<Publications />} />
                <Route path="/simple" element={<SimplePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/writeups" element={<WriteupsIndex />} />
                <Route path="/writeups/*" element={<WriteupsPost />} />
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

      {/* Simple Version and Contact used to be their own grounded 3D objects
          (see Scene3D) — shelved for now in favor of plain clickable text,
          smaller and pushed to the sides rather than sitting in the scene. */}
      {isHome && (
        // Instant, no fly-away/fade — this isn't a crane, and the simple
        // page is meant to feel like flipping a switch, not a transition.
        <button
          onClick={() => navigate("/simple")}
          className="fixed bottom-14 left-6 z-40 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Simple Version
        </button>
      )}
      {isHome && (
        <div className="fixed bottom-14 right-6 z-40 flex flex-col items-end gap-2">
          {showContactCard && (
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              {CONTACT_LINKS.map(({ href, icon: Icon, text, external }) => (
                <a
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  aria-label={text}
                  title={text}
                  className="hover:text-slate-900 dark:hover:text-slate-100 hover:scale-110 transition-all"
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowContactCard((v) => !v)}
            className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Contact
          </button>
        </div>
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

import { motion } from "framer-motion";
import { Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useAppContext } from "../AppContext";
import { audio } from "../audio";
import { useRef, useEffect } from "react";

// About/Projects/Contact are plain content pages, not the crane mobile — the
// dangling hand-physics string reads as out of place there, so those pages
// get plain fixed icon buttons instead (see the early return below).
export function ThemeToggle({ simple = false, leading = null }) {
  const { theme, setTheme, soundEnabled, setSoundEnabled, isTransitioningTheme } = useAppContext();

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const stringRef1 = useRef(null);
  const stringRef2 = useRef(null);

  const y1 = useRef(0);
  const y2 = useRef(0);
  const a1 = useRef(0);
  const a2 = useRef(0);
  const vy1 = useRef(0);
  const vy2 = useRef(0);
  const va1 = useRef(0);
  const va2 = useRef(0);

  const isDragging1 = useRef(false);
  const isDragging2 = useRef(false);
  const pointer1 = useRef({ x: 0, y: 0, startX: 0, startY: 0, baseY: 0, baseA: 0 });
  const pointer2 = useRef({ x: 0, y: 0, startX: 0, startY: 0, baseY: 0, baseA: 0 });

  const requestRef = useRef(0);

  useEffect(() => {
    if (simple) return; // no dangling string to simulate in this variant
    const updatePhysics = () => {
      const time = performance.now() / 1000;

      // Physics for Theme Toggle (Left)
      if (!isDragging1.current) {
        vy1.current += (0 - y1.current) * 0.01; // Spring back to 0 stretch (slower speed)
        vy1.current *= 0.96; // Bouncy Y (stretchy string)
        y1.current += vy1.current;

        va1.current += (0 - a1.current) * 0.001; // Slower pendulum gravity
        va1.current += Math.sin(time * 1.2) * 0.00005; // Ambient wind
        va1.current *= 0.992; // Low friction for slow jangle
        a1.current += va1.current;
      } else {
        const dx = pointer1.current.x - pointer1.current.startX;
        const dy = pointer1.current.y - pointer1.current.startY;

        // As cursor goes away, the impact on the icon grows weaker (asymptotic limit)
        const limitX = 100;
        const targetX = (dx * limitX) / (Math.abs(dx) + limitX);

        const limitY = 60;
        // Add an immediate +30 pull-down when clicked
        const rawDy = dy + 30;
        const targetY = (rawDy * limitY) / (Math.abs(rawDy) + limitY);

        const currentLen = 64 + y1.current;
        const targetA = Math.atan2(-targetX, currentLen + targetY);

        vy1.current += (targetY - y1.current) * 0.1;
        vy1.current *= 0.7;
        y1.current += vy1.current;

        va1.current += (targetA - a1.current) * 0.1;
        va1.current *= 0.7;
        a1.current += va1.current;
      }

      // Physics for Sound Toggle (Right)
      if (!isDragging2.current) {
        vy2.current += (0 - y2.current) * 0.01;
        vy2.current *= 0.96;
        y2.current += vy2.current;

        va2.current += (0 - a2.current) * 0.001;
        va2.current += Math.sin(time * 1.5 + 1) * 0.00005;
        va2.current *= 0.992;
        a2.current += va2.current;
      } else {
        const dx = pointer2.current.x - pointer2.current.startX;
        const dy = pointer2.current.y - pointer2.current.startY;

        const limitX = 100;
        const targetX = (dx * limitX) / (Math.abs(dx) + limitX);

        const limitY = 60;
        const rawDy = dy + 30;
        const targetY = (rawDy * limitY) / (Math.abs(rawDy) + limitY);

        const currentLen = 64 + y2.current;
        const targetA = Math.atan2(-targetX, currentLen + targetY);

        vy2.current += (targetY - y2.current) * 0.1;
        vy2.current *= 0.7;
        y2.current += vy2.current;

        va2.current += (targetA - a2.current) * 0.1;
        va2.current *= 0.7;
        a2.current += va2.current;
      }

      if (ref1.current) ref1.current.style.transform = `rotate(${a1.current}rad)`;
      if (stringRef1.current) stringRef1.current.style.height = `${Math.max(0, 64 + y1.current)}px`;

      if (ref2.current) ref2.current.style.transform = `rotate(${a2.current}rad)`;
      if (stringRef2.current) stringRef2.current.style.height = `${Math.max(0, 64 + y2.current)}px`;

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [simple]);

  const handleThemePointerDown = (e) => {
    if (isTransitioningTheme) return;
    e.target.setPointerCapture(e.pointerId);
    isDragging1.current = true;
    pointer1.current = {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      baseY: y1.current,
      baseA: a1.current,
    };
  };

  const handleThemePointerMove = (e) => {
    if (!isDragging1.current) return;
    pointer1.current.x = e.clientX;
    pointer1.current.y = e.clientY;
  };

  const handleThemePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    if (isTransitioningTheme) {
      isDragging1.current = false;
      return;
    }
    isDragging1.current = false;
    audio.playTug();
    setTheme(theme === "light" ? "dark" : "light");
    setTimeout(() => audio.playFly(), 200);
  };

  const handleSoundPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    isDragging2.current = true;
    pointer2.current = {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      baseY: y2.current,
      baseA: a2.current,
    };
  };

  const handleSoundPointerMove = (e) => {
    if (!isDragging2.current) return;
    pointer2.current.x = e.clientX;
    pointer2.current.y = e.clientY;
  };

  const handleSoundPointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    isDragging2.current = false;
    audio.playTug();
    setSoundEnabled(!soundEnabled);
  };

  const isDark = theme === "dark";

  if (simple) {
    // Fixed slate coloring (matching the Back link on these pages), not
    // isDark-driven — these buttons sit on a different surface than Home's.
    return (
      <div className="fixed top-6 right-12 sm:right-24 flex gap-3 z-50">
        {leading}
        <button
          onClick={() => {
            audio.playTug();
            setTheme(isDark ? "light" : "dark");
            setTimeout(() => audio.playFly(), 200);
          }}
          className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-110 transition-all"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Sun className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
        <button
          onClick={() => {
            audio.playTug();
            setSoundEnabled(!soundEnabled);
          }}
          className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-110 transition-all"
          aria-label="Toggle sound"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <VolumeX className="w-5 h-5 opacity-60" strokeWidth={1.5} />
          )}
        </button>
      </div>
    );
  }

  const shadowValue = isDark
    ? "drop-shadow(0px 30px 10px rgba(0,0,0,0.6))"
    : "drop-shadow(0px 30px 10px rgba(0,0,0,0.1))";

  const stringStyle = {
    width: "1px",
    backgroundColor: isDark ? "#4b5563" : "#9ca3af",
    opacity: isDark ? 0.3 : 0.4,
  };

  return (
    <div className="fixed top-0 right-12 sm:right-24 flex gap-3 z-50">
      <div
        ref={ref1}
        className="origin-top flex flex-col items-center group cursor-pointer"
        onPointerDown={handleThemePointerDown}
        onPointerMove={handleThemePointerMove}
        onPointerUp={handleThemePointerUp}
        onPointerLeave={() => {
          isDragging1.current = false;
        }}
      >
        <div ref={stringRef1} className="h-[64px]" style={stringStyle} />

        <motion.div
          className="w-10 h-10 flex items-center justify-center -mt-1 transition-colors duration-1000 ease-in-out"
          style={{ filter: shadowValue, color: isDark ? "#ffffff" : "#000000" }}
          whileHover={{ rotateZ: 5, scale: 1.15 }}
        >
          {theme === "light" ? (
            <Sun className="w-6 h-6" strokeWidth={1.5} />
          ) : (
            <Moon className="w-6 h-6" strokeWidth={1.5} />
          )}
        </motion.div>
      </div>

      <div
        ref={ref2}
        className="origin-top flex flex-col items-center group cursor-pointer"
        onPointerDown={handleSoundPointerDown}
        onPointerMove={handleSoundPointerMove}
        onPointerUp={handleSoundPointerUp}
        onPointerLeave={() => {
          isDragging2.current = false;
        }}
      >
        <div ref={stringRef2} className="h-[64px]" style={stringStyle} />

        <motion.div
          className="w-10 h-10 flex items-center justify-center -mt-1 transition-colors duration-1000 ease-in-out"
          style={{ filter: shadowValue, color: isDark ? "#ffffff" : "#000000" }}
          whileHover={{ rotateZ: 5, scale: 1.15 }}
        >
          {soundEnabled ? (
            <Volume2 className="w-6 h-6" strokeWidth={1.5} />
          ) : (
            <VolumeX className="w-6 h-6 opacity-60" strokeWidth={1.5} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

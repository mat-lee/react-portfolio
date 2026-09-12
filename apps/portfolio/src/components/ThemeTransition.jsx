import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useAppContext } from "../AppContext";
import { audio } from "../audio";

// This overlay represents the dropping "night" curtain. It stays mounted
// while in dark mode to act as the night sky behind the 3D scene.
export function ThemeTransition() {
  const { theme, isTransitioningTheme, setIsTransitioningTheme } = useAppContext();

  useEffect(() => {
    if (isTransitioningTheme) {
      if (theme === "dark") {
        // Day to Night is handled by Framer Motion's entry animation
        const timer = setTimeout(() => setIsTransitioningTheme(false), 800);
        return () => clearTimeout(timer);
      } else {
        // Night to Day is handled by Framer Motion's exit animation
        const timer = setTimeout(() => setIsTransitioningTheme(false), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [theme, isTransitioningTheme, setIsTransitioningTheme]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#F3F6F9]">
      <AnimatePresence>
        {theme === "dark" && (
          <motion.div
            className="absolute inset-0 bg-[#020514] overflow-hidden"
            initial={{ y: "-100%" }}
            animate={{ y: ["-100%", "0%", "-15%", "0%", "-4%", "0%"] }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
            transition={{
              duration: 0.8,
              times: [0, 0.4, 0.65, 0.85, 0.95, 1],
              ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
            }}
            onAnimationStart={() => {
              // Play a very subtle thud when it drops
              if (theme === "dark") {
                setTimeout(() => audio.playTug(), 320); // Exact time of first bounce
              }
            }}
          >
            <div className="absolute bottom-0 w-full h-[2px] bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

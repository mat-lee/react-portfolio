import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { CONTACT_LINKS } from "./Contact";

const SKILLS = ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-learn", "Frontend", "Backend"];

export function About() {
  const navigate = useNavigate();
  useDocumentMeta(
    "About — Matthew Lee",
    "Matthew Lee is a Computer Science & Mathematics dual major at UNC Chapel Hill, focused on machine learning and reinforcement learning."
  );

  return (
    <div className="w-full min-h-screen bg-[#FBFBF9] dark:bg-[#020617] text-slate-900 dark:text-slate-100 px-6 py-16 md:py-24">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 mb-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-6">About Me</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-6">
          I'm a student at the University of North Carolina at Chapel Hill, pursuing a dual major in
          Computer Science and Mathematics.
        </p>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-8">
          I have a deep passion for learning and trying new things — while my main interests are
          machine learning and artificial intelligence, there's always something new to explore in
          the world of technology. I'm constantly seeking out new challenges and opportunities to
          grow my skills, and I am passionate about using these technologies to solve real world
          problems and create a meaningful impact in the world.
        </p>

        {/* Editorial treatment: a plain letter-spaced line instead of pill
            badges — quieter, and one less shape competing with the crane's
            own faceted look. A real list (not a joined string) so a
            scraper/reader sees discrete skills, not one blob of text; the
            "/" between items is a CSS separator, not part of the content. */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <ul
            aria-label="Skills"
            className="flex flex-wrap gap-x-2 gap-y-1 text-xs tracking-[0.1em] uppercase text-slate-500 dark:text-slate-400 leading-loose list-none p-0 m-0"
          >
            {SKILLS.map((skill, i) => (
              <li key={skill} className="flex items-center gap-2">
                {skill}
                {i < SKILLS.length - 1 && <span aria-hidden="true">/</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* A copy of the Contact page's own links, so a visitor reading
            About doesn't have to leave the page to find them. */}
        <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {CONTACT_LINKS.map(({ href, icon: Icon, text, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-base">{text}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

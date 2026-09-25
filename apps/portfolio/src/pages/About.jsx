import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { CONTACT_LINKS } from "./Contact";
import { BIO_PARAGRAPHS, SKILLS } from "../data/bio";

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

        <div className="flex items-center gap-5 mb-6">
          {/* The source photo is a wide landscape shot with the face taking
              up a small fraction of it — object-cover alone only crops the
              sides here (still shows full height), so it stays scaled up
              and repositioned to actually crop in on the face. */}
          <div className="w-64 h-64 rounded-full overflow-hidden shrink-0">
            <img
              src="/headshot.jpg"
              alt="Matthew Lee"
              className="w-full h-full object-cover"
              style={{ transform: "scale(3)", transformOrigin: "48% 48%" }}
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">About Me</h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-6">{BIO_PARAGRAPHS[0]}</p>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-8">{BIO_PARAGRAPHS[1]}</p>

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
        <div className="flex items-center gap-6 pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
          {CONTACT_LINKS.map(({ href, icon: Icon, text, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              aria-label={text}
              title={text}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:scale-110 transition-all"
            >
              <Icon className="w-7 h-7" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

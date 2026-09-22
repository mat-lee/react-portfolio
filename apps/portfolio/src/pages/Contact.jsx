import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Github, Linkedin } from "lucide-react";
import { useDocumentMeta } from "../lib/useDocumentMeta";

export const CONTACT_LINKS = [
  { href: "mailto:matthewlee01234@gmail.com", icon: Mail, text: "matthewlee01234@gmail.com", external: false },
  { href: "https://github.com/mat-lee", icon: Github, text: "github.com/mat-lee", external: true },
  {
    href: "https://www.linkedin.com/in/matthew-lee-155896333/",
    icon: Linkedin,
    text: "linkedin.com/in/matthew-lee-155896333",
    external: true,
  },
];

export function Contact() {
  const navigate = useNavigate();
  useDocumentMeta("Contact — Matthew Lee", "Get in touch with Matthew Lee — email, GitHub, and LinkedIn.");

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

        <h1 className="text-3xl font-bold tracking-tight mb-8">Contact</h1>

        {/* Icon-only, not label + icon — text is still there for anyone who
            needs it (aria-label, title tooltip), just not painted on screen. */}
        <div className="flex items-center gap-6">
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

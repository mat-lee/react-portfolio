import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Github, Linkedin } from "lucide-react";

const LINKS = [
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

        <h1 className="text-3xl font-bold tracking-tight mb-4">Say hello</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-10">
          I'm always open to discussing opportunities, projects, or just having a conversation about
          technology and machine learning. Feel free to reach out!
        </p>

        <div className="space-y-3">
          {LINKS.map(({ href, icon: Icon, text, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="flex items-center gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow text-slate-700 dark:text-slate-300"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{text}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

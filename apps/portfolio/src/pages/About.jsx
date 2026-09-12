import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const TAGS = ["Python", "PyTorch", "Tensorflow", "Pandas", "Scikit-learn", "Frontend", "Backend"];

export function About() {
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

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

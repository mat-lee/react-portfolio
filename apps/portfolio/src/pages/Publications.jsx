import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useDocumentMeta } from "../lib/useDocumentMeta";

export function Publications() {
  const navigate = useNavigate();
  useDocumentMeta("Publications — Matthew Lee", "Publications by Matthew Lee.");

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

        <h1 className="text-3xl font-bold tracking-tight mb-4">Publications</h1>
        <p className="text-slate-500 dark:text-slate-400">Nothing published yet — check back soon.</p>
      </motion.div>
    </div>
  );
}

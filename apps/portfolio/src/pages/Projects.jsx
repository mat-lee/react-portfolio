import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Github, FlaskConical } from "lucide-react";
import { Tetrahedron } from "../components/Tetrahedron";
import projectsData from "../data/projects.json";
import labsData from "../data/labs.json";

const ACCENTS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];

function statusColor(status = "") {
  const s = status.toLowerCase();
  if (s.includes("ongoing")) return "#facc15";
  if (s.includes("public") || s.includes("complete")) return "#22c55e";
  return "#ef4444";
}

export function Projects() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10">A few things I've built and iterated on.</p>

        <ul className="space-y-10">
          {projectsData.map((project, i) => {
            const projectLabs = labsData.filter((lab) => project.labs?.includes(lab.id));
            return (
              <motion.li
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {/* items-center on the header row (not the whole li) so the
                    icon aligns with the title's own line box via flexbox's
                    native vertical centering. */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center">
                    <Tetrahedron color={ACCENTS[i % ACCENTS.length]} />
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        {project.linkText || "Demo"} <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        GitHub <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 mt-1 ml-9">{project.summary}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 ml-9">
                  <div className="flex flex-wrap gap-2">
                    {(project.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {projectLabs.map((lab) => (
                      <a
                        key={lab.id}
                        href={lab.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                      >
                        <FlaskConical className="w-3 h-3" /> {lab.title}
                      </a>
                    ))}
                  </div>
                  {project.status && (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 shrink-0">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: statusColor(project.status) }}
                      />
                      {project.status}
                    </span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { getWriteupsPost } from "../../lib/writeupsPosts";
import { formatDate } from "../../lib/date";
import { useDocumentMeta } from "../../lib/useDocumentMeta";
import "../../styles/writeups-prose.css";

export function WriteupsPost() {
  const { "*": id } = useParams();
  const navigate = useNavigate();
  const post = getWriteupsPost(id);
  useDocumentMeta(
    post ? `${post.frontmatter.title} — Writeups — Matthew Lee` : "Writeups — Matthew Lee",
    post ? post.frontmatter.description : undefined
  );

  return (
    <div className="w-full min-h-screen bg-[#FBFBF9] dark:bg-[#020617] text-slate-900 dark:text-slate-100 px-6 py-16 md:py-24">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/writeups")}
          className="flex items-center gap-2 mb-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {!post ? (
          <p className="text-slate-600 dark:text-slate-400">That writeup doesn't exist.</p>
        ) : (
          <>
            <header className="mb-10">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {formatDate(new Date(post.frontmatter.date))}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h1 className="text-3xl font-bold tracking-tight">{post.frontmatter.title}</h1>
                {post.frontmatter.kind && (
                  <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {post.frontmatter.kind}
                  </span>
                )}
              </div>
            </header>

            <article className="writeups-prose">
              <post.Component />
            </article>
          </>
        )}
      </motion.div>
    </div>
  );
}

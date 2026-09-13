import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LABS_GROUPS } from "../../data/labsGroups";
import { labsPosts } from "../../lib/labsPosts";
import { formatDate } from "../../lib/date";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

// A post's group is its folder, if that folder is declared in LABS_GROUPS.
function groupPosts(posts) {
  const grouped = new Map();
  const standalone = [];
  for (const post of posts) {
    const dir = post.id.includes("/") ? post.id.split("/")[0] : null;
    if (dir && LABS_GROUPS[dir]) {
      grouped.set(dir, [...(grouped.get(dir) ?? []), post]);
    } else {
      standalone.push(post);
    }
  }
  return { grouped, standalone };
}

// Sub-posts within a group list newest first, same as the top-level feed.
const readingOrder = (a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date);

export function LabsIndex() {
  const navigate = useNavigate();
  useDocumentMeta(
    "Labs — Matthew Lee",
    "Explorations and technical writeups by Matthew Lee, including an AlphaZero-style Tetris AI."
  );
  const posts = labsPosts.filter((p) => !p.frontmatter.draft);
  const { grouped, standalone } = groupPosts(posts);

  const items = [
    ...standalone.map((post) => ({ kind: "post", date: new Date(post.frontmatter.date), post })),
    ...[...grouped].map(([id, children]) => ({
      kind: "group",
      // A group is as recent as its newest child.
      date: new Date(Math.max(...children.map((c) => +new Date(c.frontmatter.date)))),
      group: LABS_GROUPS[id],
      children: children.sort(readingOrder),
    })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="w-full min-h-screen bg-[#FBFBF9] dark:bg-[#020617] text-slate-900 dark:text-slate-100 px-6 py-16 md:py-24">
      <motion.div
        className="max-w-2xl mx-auto"
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Labs</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-10">Explorations and writeups.</p>

        <ul className="space-y-10">
          {items.map((item) =>
            item.kind === "post" ? (
              <li key={item.post.id}>
                <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.date)}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <Link
                    to={`/labs/${item.post.id}`}
                    className="text-xl font-semibold hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {item.post.frontmatter.title}
                  </Link>
                  {item.post.frontmatter.kind && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {item.post.frontmatter.kind}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{item.post.frontmatter.description}</p>
              </li>
            ) : (
              <li key={item.group.title}>
                <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.date)}</div>
                <h2 className="text-xl font-semibold mt-1">{item.group.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1 mb-3">{item.group.description}</p>
                <ul className="space-y-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={`/labs/${child.id}`}
                        className="font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {child.frontmatter.title}
                      </Link>
                      {child.frontmatter.kind && (
                        <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 ml-2">
                          {child.frontmatter.kind}
                        </span>
                      )}
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                        {formatDate(new Date(child.frontmatter.date))}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          )}
        </ul>
      </motion.div>
    </div>
  );
}

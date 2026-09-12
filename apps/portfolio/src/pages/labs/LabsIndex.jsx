import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LABS_GROUPS } from "../../data/labsGroups";
import { labsPosts } from "../../lib/labsPosts";
import { formatDate } from "../../lib/date";

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

// Sub-posts read in series order: explicit `order` first, then oldest to newest.
const readingOrder = (a, b) =>
  (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity) ||
  new Date(a.frontmatter.date) - new Date(b.frontmatter.date);

export function LabsIndex() {
  const navigate = useNavigate();
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
                <Link
                  to={`/labs/${item.post.id}`}
                  className="block text-xl font-semibold mt-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {item.post.frontmatter.title}
                </Link>
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

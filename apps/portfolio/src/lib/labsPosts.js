// Central registry over the Labs MDX collection — replaces Astro's
// getCollection()/getStaticPaths(). Eager: there are only 4 small writeups,
// so loading every module upfront is simpler than chasing code-splitting
// here — Rollup won't split a module that's both statically and
// dynamically reachable from the same file anyway, so a lazy variant of
// this wouldn't actually shrink the bundle, just add Suspense boilerplate.
//
// Root-relative glob pattern (leading `/`) resolves from the project root
// regardless of which file imports this module.
const modules = import.meta.glob("/src/content/labs/**/*.mdx", { eager: true });

function idFromPath(path) {
  return path.replace("/src/content/labs/", "").replace(/\.mdx$/, "");
}

export const labsPosts = Object.entries(modules).map(([path, mod]) => ({
  id: idFromPath(path),
  frontmatter: mod.frontmatter,
  Component: mod.default,
}));

export function getLabsPost(id) {
  return labsPosts.find((p) => p.id === id);
}

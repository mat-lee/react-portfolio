// Central registry over the Writeups MDX collection — replaces Astro's
// getCollection()/getStaticPaths(). Eager: there are only 4 small writeups,
// so loading every module upfront is simpler than chasing code-splitting
// here — Rollup won't split a module that's both statically and
// dynamically reachable from the same file anyway, so a lazy variant of
// this wouldn't actually shrink the bundle, just add Suspense boilerplate.
//
// Root-relative glob pattern (leading `/`) resolves from the project root
// regardless of which file imports this module.
const modules = import.meta.glob("/src/content/writeups/**/*.mdx", { eager: true });

function idFromPath(path) {
  return path.replace("/src/content/writeups/", "").replace(/\.mdx$/, "");
}

export const writeupsPosts = Object.entries(modules).map(([path, mod]) => ({
  id: idFromPath(path),
  frontmatter: mod.frontmatter,
  Component: mod.default,
}));

export function getWriteupsPost(id) {
  return writeupsPosts.find((p) => p.id === id);
}

# Labs

[labs.codebymatthewlee.com](https://labs.codebymatthewlee.com) — an Astro site for
interactive explorations and writeups.

## Development

From the repo root:

```bash
pnpm dev:labs     # localhost:3000
pnpm build:labs   # static output in apps/labs/dist
```

## Adding a lab

1. Create `src/content/labs/<group>/<slug>.mdx`. It becomes `/<group>/<slug>`.
2. Frontmatter: `title`, `date`, `description` are required; `tags`, `order`
   (reading position within the group), and `draft` are optional.
3. To start a new group, add an entry to `src/data/groups.js` keyed by the folder
   name. Posts in a folder with no entry there render as standalone.

React components go in `packages/demos` and need `client:only="react"` when
imported into MDX if they touch the DOM on mount.

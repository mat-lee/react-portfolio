# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo containing:
- **Portfolio** (www.mat-lee.us) - React/Vite SPA. A persistent
  react-three-fiber origami-crane scene on Home; clicking a crane routes
  (react-router) to About/Projects/Contact/Writeups.
- **Labs** (labs.mat-lee.us) - retired as a standalone site; now just a
  static redirect shim to `mat-lee.us/writeups/...` (see `apps/labs/README.md`).
  The actual writeups live inside the Portfolio app.
- **Demos** - Shared React components used by the Portfolio app (both the
  Home scene's crane model rendering and the writeups' interactive demos).

## Commands

### Full Stack Development
```bash
pnpm install                 # Install all workspace dependencies
pnpm dev                     # Start all apps in parallel
pnpm dev:portfolio           # Start portfolio (localhost:5173) — the whole site, Writeups included
```

### Building
```bash
pnpm build                   # Build all apps
pnpm build:portfolio         # Build portfolio (output: repo-root dist/)
```

## Project Structure

```
my-portfolio/
├── apps/
│   ├── portfolio/           # React/Vite SPA — the whole site
│   │   └── src/
│   │       ├── App.jsx              # routes + persistent Scene3D + theme toggle/transition
│   │       ├── components/          # Scene3D, Crane3D, ThemeToggle, ThemeTransition, Callout
│   │       ├── pages/                # Home, About, Projects, Contact
│   │       │   └── writeups/         # WriteupsIndex (feed), WriteupsPost (writeup renderer)
│   │       ├── content/writeups/<group>/<slug>.mdx  # the writeups, routed at /writeups/<group>/<slug>
│   │       ├── data/
│   │       │   ├── projects.json     # project cards on the Projects page
│   │       │   ├── writeups.json     # writeup links shown on project cards
│   │       │   └── writeupsGroups.js # Writeups group folder → title/description
│   │       ├── lib/
│   │       │   ├── writeupsPosts.js  # import.meta.glob registry over content/writeups (replaces Astro's content collections)
│   │       │   └── date.js
│   │       └── styles/writeups-prose.css # long-form writeup typography (Writeups post page only)
│   └── labs/                # static redirect shim only — see apps/labs/README.md
└── packages/
    └── demos/               # Shared React components
        └── src/
            ├── index.js     # Barrel export
            ├── ShadowWrapper.jsx    # Shadow DOM style isolation
            └── TetrisMoveVisualizer/
```

## Adding a New Writeup

1. **Create the page** at `apps/portfolio/src/content/writeups/<group>/<slug>.mdx`.
   It routes to `/writeups/<group>/<slug>`.
   ```mdx
   ---
   title: My Writeup
   date: 2026-08-13
   description: One sentence, shown on the /writeups feed.
   tags: [optional]
   kind: Algorithm   # one-word/short-phrase label shown next to the title
   draft: false      # true excludes it from the feed/build
   ---
   ```
2. **New group?** Add an entry to `apps/portfolio/src/data/writeupsGroups.js`
   keyed by the folder name. Posts in an undeclared folder render as
   standalone feed entries.
3. **Add the link** to `apps/portfolio/src/data/writeups.json` so it appears
   on the matching project card too (separate from the feed listing).
4. **Add the URL** to `apps/portfolio/public/sitemap.xml`.

### Adding an interactive demo

1. **Create component** in `packages/demos/src/NewDemo/`
2. **Export** from `packages/demos/src/index.js`:
   ```js
   export { default as NewDemo } from './NewDemo/index.jsx';
   ```
3. **Import in MDX** — everything in the Portfolio SPA is already
   client-rendered, so just import and use it directly, no client directive:
   ```mdx
   import { NewDemo } from '@portfolio/demos';

   <NewDemo />
   ```

Demo components carry their own CSS (see `TetrisMoveVisualizer/styles.js`) and
render inside a Shadow DOM, so they need no CSS framework.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo containing:
- **Portfolio** (www.codebymatthewlee.com) - React/Vite personal website
- **Labs** (labs.codebymatthewlee.com) - Astro site for interactive explorations
- **Demos** - Shared React components used by both sites

## Commands

### Full Stack Development
```bash
pnpm install                 # Install all workspace dependencies
pnpm dev                     # Start all apps in parallel
pnpm dev:portfolio           # Start only portfolio (localhost:5173)
pnpm dev:labs                # Start only labs (localhost:3000)
```

### Building
```bash
pnpm build                   # Build all apps
pnpm build:portfolio         # Build only portfolio
pnpm build:labs              # Build only labs (output: apps/labs/dist)
```

## Project Structure

```
my-portfolio/
├── apps/
│   ├── portfolio/           # React/Vite main site
│   │   └── src/
│   │       ├── App.jsx      # Main portfolio page
│   │       └── data/labs.json  # Lab links shown on project cards
│   └── labs/                # Astro site
│       ├── public/img/      # Static images, served at /img/...
│       └── src/
│           ├── content/labs/<group>/<slug>.mdx  # the writeups
│           ├── content.config.js    # collection schema
│           ├── data/groups.js       # group folder → title/description
│           ├── layouts/             # Base.astro, Post.astro
│           ├── pages/               # index.astro (feed), [...slug].astro
│           └── styles/global.css    # all site CSS
└── packages/
    └── demos/               # Shared React components
        └── src/
            ├── index.js     # Barrel export
            ├── ShadowWrapper.jsx    # Shadow DOM style isolation
            └── TetrisMoveVisualizer/
```

## Adding a New Lab

1. **Create the page** at `apps/labs/src/content/labs/<group>/<slug>.mdx`.
   It routes to `/<group>/<slug>`.
   ```mdx
   ---
   title: My Lab
   date: 2026-08-13
   description: One sentence, shown on the home page feed.
   tags: [optional]
   order: 4          # reading position within the group
   draft: false      # true excludes it from the build
   ---
   ```
2. **New group?** Add an entry to `apps/labs/src/data/groups.js` keyed by the
   folder name. Posts in an undeclared folder render as standalone feed entries.
3. **Add the link** to `apps/portfolio/src/data/labs.json` so it appears on the
   matching project card.

### Adding an interactive demo

1. **Create component** in `packages/demos/src/NewDemo/`
2. **Export** from `packages/demos/src/index.js`:
   ```js
   export { default as NewDemo } from './NewDemo/index.jsx';
   ```
3. **Import in MDX** with a client directive — Astro renders components to
   static HTML by default, so anything touching the DOM on mount needs it:
   ```mdx
   import { NewDemo } from '@portfolio/demos';

   <NewDemo client:only="react" />
   ```

Demo components carry their own CSS (see `TetrisMoveVisualizer/styles.js`) and
render inside a Shadow DOM, so the labs site needs no CSS framework.

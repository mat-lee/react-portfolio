# Labs — Rebuild Spec

A from-scratch spec for recreating labs.mat-lee.us. Someone following
this exactly, with the same content files, produces a byte-for-byte-equivalent
site. Split into two parts: **Part 1** is the literal recreation (stack,
config, code). **Part 2** is the visual language (colors, type, spacing, and
the *reasoning* behind them) so a redesign in a different stack still reads as
"the same site."

---

## Part 1 — Exact recreation

### Stack

- **Astro 7** (`astro@^7.2.2`), static output, no SSR.
- `@astrojs/mdx` — content is MDX (Markdown + JSX).
- `@astrojs/react` — for interactive islands only, hydrated with
  `client:only="react"` (never `client:load`/`client:visible` — see below).
- No CSS framework. One hand-written stylesheet, no Tailwind/PostCSS.
- Package manager: pnpm workspace (`workspace:*` for internal packages).

`package.json` dependencies, verbatim:

```json
{
  "dependencies": {
    "@astrojs/mdx": "^7.0.5",
    "@astrojs/react": "^6.0.2",
    "@portfolio/demos": "workspace:*",
    "astro": "^7.2.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`astro.config.mjs`, verbatim:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://labs.mat-lee.us',
  integrations: [mdx(), react()],
  server: { port: 3000 },
});
```

### File tree

```
apps/labs/
├── astro.config.mjs
├── package.json
├── public/img/<n>/...           # static assets, one numbered folder per post's images
└── src/
    ├── content.config.js        # collection schema
    ├── content/labs/<group>/<slug>.mdx   # every writeup
    ├── data/groups.js           # folder name -> {title, description}
    ├── components/Callout.astro
    ├── layouts/Base.astro       # <html> shell, topbar, footer, theme script
    ├── layouts/Post.astro       # article wrapper (date + title + prose)
    ├── lib/date.js              # one shared date formatter
    ├── pages/index.astro        # the home feed
    ├── pages/[...slug].astro    # renders every collection entry
    └── styles/global.css        # the entire stylesheet
```

### Content model

`src/content.config.js`:

```js
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const labs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/labs' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),   // reading position within a group
    draft: z.boolean().default(false),
  }),
});

export const collections = { labs };
```

A post's **group** is just its parent folder name
(`content/labs/tetris/foo.mdx` → group `tetris`). `src/data/groups.js` maps a
folder name to a `{ title, description }` shown as the group heading on the
feed. A folder with no entry there renders its posts standalone instead of
nested. This means adding a project to a series costs one new `.mdx` file —
nothing else to register.

### Home feed — `pages/index.astro`

Logic, not just markup:

1. `getCollection('labs', ({ data }) => !data.draft)` — drafts never reach the
   build.
2. Bucket each post: if its folder key exists in `GROUPS`, it's a sub-post of
   that group; otherwise it's standalone.
3. Sort **groups and standalone posts together**, newest first, where a
   group's date is `max(child dates)` — a group is "as recent as its newest
   chapter."
4. Sort **children within a group** oldest-first (`order` frontmatter breaks
   ties) — a series reads start to finish, top to bottom.

### Interactive components — the Shadow DOM rule

Any React component from `@portfolio/demos` that touches the DOM on mount
(canvas, drag state, anything with `useEffect`) must be imported into MDX with
`client:only="react"`:

```mdx
import { SomeDemo } from '@portfolio/demos';

<SomeDemo client:only="react" />
```

Reason: Astro renders islands to static HTML by default; `client:only`
skips that and hydrates purely client-side. Demo components render inside a
Shadow DOM (see `packages/demos/src/ShadowWrapper.jsx`) so their own CSS never
touches the page and the page's CSS never touches them — this is why
`apps/labs` needs **no CSS framework**: nothing global has to fight a
component's internal styling.

### Admonitions

No remark-directive plugin. One component, `components/Callout.astro`:

```astro
---
const { type = 'note', title } = Astro.props;
---
<aside class={`callout callout-${type}`}>
  <div class="callout-title">{title ?? type}</div>
  <slot />
</aside>
```

Used as `<Callout type="tip" title="Try it out!">…</Callout>` — must have a
**blank line** after the opening tag and before the closing tag, or MDX parses
the inside as raw text instead of Markdown.

### Theme toggle — inline, before first paint

In `layouts/Base.astro`'s `<head>`, a synchronous inline script (not a
component, not deferred — it must run before the page paints):

```html
<script is:inline>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
</script>
```

Toggle button flips `data-theme` and writes `localStorage.theme`. Two states
only — no third "system" option in the UI. First visit follows the OS; once a
visitor picks a mode, that choice sticks across visits. Running this before
paint (rather than in a mounted framework component) is what avoids a flash
of the wrong theme.


---

## Part 2 — Visual language

The principles first, exact values after — a reimplementation in a different
stack should match the principles even where it can't copy the CSS.

### Principles

1. **Flat, no elevation.** No shadows, no gradients, no card borders around
   list items. The background is one solid color for the whole page — navbar,
   content, and footer all sit on it, not on a lighter/whiter panel.
2. **Hierarchy from type, not containers.** A post title is bigger, bolder,
   and tighter-tracked than its description — never boxed to stand out.
   Vertical spacing (not borders or backgrounds) separates feed entries.
3. **One accent color, used sparingly.** Only for links, hover states, and
   callout side-borders. Everything else is grayscale.
4. **Three tiers of gray for text**, not one. Primary text is near-black/
   near-white; a muted tier for descriptions and body secondary text; a
   fainter tier still for metadata (dates, footer). Reach for the next tier
   down as content gets less important, never invent a fourth.
5. **A hairline border, not a card, marks structure that needs a boundary** —
   e.g. the left rule on a nested sub-post list, or the bottom rule above the
   footer. 1px, low-contrast, never more than that.
6. **Dark mode is tuned, not inverted.** The dark background is near-black
   (`#0f1115`) rather than pure black, and the accent color shifts *lighter*
   in dark mode (a blue that reads fine on white would look muddy on near-
   black) — every color is redefined by hand for the dark palette, not
   computed by flipping lightness.
7. **A narrow reading column**, centered, independent of viewport width — this
   is a writing site, not a dashboard; content should never stretch edge to
   edge on a wide screen.

### Exact tokens

```css
:root {
  --bg: #fafaf9;
  --fg: #111827;
  --fg-muted: #4b5563;
  --fg-faint: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --surface: #ffffff;      /* callouts, <details>, code blocks */
  --code-bg: #f3f4f6;

  --column: 42rem;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto,
    Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

[data-theme='dark'] {
  --bg: #0f1115;
  --fg: #e5e7eb;
  --fg-muted: #9ca3af;
  --fg-faint: #6b7280;
  --border: #262b36;
  --accent: #60a5fa;
  --surface: #161a22;
  --code-bg: #1b2029;
}
```

Callout accents (independent of the main accent color, one per admonition
type): tip `#16a34a` / dark `#4ade80`, info `#2563eb` / dark `#60a5fa`, note
`#6b7280` / dark `#9ca3af`.

### Typography

| Element | Size | Weight | Letter-spacing |
|---|---|---|---|
| Body | 17px / 1.7 line-height | 400 | normal |
| Home `<h1>` (page title) | 2.25rem | 700 (default) | -0.02em |
| Post `<h1>` (article title) | 2rem | 700 | -0.02em |
| Feed entry title | 1.4rem | 700 | -0.01em |
| Prose `<h2>` | 1.5rem | 700 | -0.01em |
| Prose `<h3>` | 1.2rem | 700 | normal |
| Metadata (dates, footer) | 0.85rem | 400 | normal |

Larger headings get *tighter* letter-spacing, not just bigger size — that's
the detail that keeps headings from feeling like enlarged body text.

### Layout

- Everything — topbar, `<main>`, footer — shares one `max-width: 42rem`,
  centered with `margin: 0 auto`. No sidebar, no multi-column grid.
- Feed entries separate with `margin-top: 3.5rem` between items — no divider
  lines between them, only whitespace.
- A sub-post list sits directly under its parent group's description, offset
  by a `2px solid var(--border)` left rule and `1rem` left padding — the one
  place a border does double duty as both boundary and connective tissue.
- Prose block spacing scales with size: paragraphs and lists sit close
  together, `<hr>`s get a full `3rem` above and below to mark a real section
  break.

### The feed pattern (repeats for every entry, group or standalone)

```
<date, faint, small>
<title, bold, large, links to the post>
<description, muted, one or two sentences>
[optional: nested list of sub-posts, same date/title/link pattern, smaller]
```

This exact stack — date → title → description — is the one repeating unit
of the whole design. Everything else on the page (topbar, footer, post
layout) is scaffolding around it.

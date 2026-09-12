# Labs (retired)

The Labs writeups now live inside `apps/portfolio` at `/labs` — see
`apps/portfolio/src/content/labs/`.

This directory is only a static redirect shim for the old
`labs.mat-lee.us` deployment, so existing links keep working. It has no
build step: `vercel.json`'s `redirects` sends old URLs to
`mat-lee.us/labs/...`, and `index.html` is a plain fallback for anything
Vercel's redirect rules don't already cover.

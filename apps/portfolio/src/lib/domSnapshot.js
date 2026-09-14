import * as htmlToImage from "html-to-image";

// Fully-composited (DOM + live Scene3D canvas, when present) capture of the
// current page, for the kami transition's fold-away texture. Ported from
// the origami-portfolio reference's foldSnapshotCache.ts, minus its
// prewarm/cache layer — kami fires rarely enough (About/Labs entry and
// exit only) that capturing fresh at trigger time is simple and fine.
export async function captureDomSnapshot() {
  // html-to-image clones and serializes the DOM it's given, which it can't
  // do for a live WebGL <canvas> (no markup to clone) — it would either
  // skip it or rasterize it blank. Pull that canvas's own pixels directly
  // instead (needs gl={{ preserveDrawingBuffer: true }} on Scene3D's
  // Canvas), exclude it from the DOM walk, then composite the two.
  const sceneRoot = document.getElementById("scene3d-canvas-root");
  const sceneCanvasEl =
    sceneRoot && getComputedStyle(sceneRoot).visibility !== "hidden"
      ? sceneRoot.querySelector("canvas")
      : null;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const domCanvas = await htmlToImage.toCanvas(document.body, {
    pixelRatio: dpr,
    // document.body's natural height is its full scrollable content, not
    // the viewport — clamp to viewport so the capture matches what's on
    // screen.
    width,
    height,
    style: { overflow: "hidden" },
    filter: (node) => {
      if (node.id === "kami-transition-container" || node.id === "scene3d-canvas-root") return false;
      if (node.nodeType === 1) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
      }
      return true;
    },
    // Skip re-fetching/inlining @font-face files — they're already loaded
    // and rendered in the live page this is a screenshot of.
    skipFonts: true,
  });

  const canvas = document.createElement("canvas");
  canvas.width = domCanvas.width;
  canvas.height = domCanvas.height;
  const ctx = canvas.getContext("2d");
  // domCanvas first: html-to-image fills its whole output with the page
  // background, including where the excluded scene canvas would be —
  // drawing it after would paint over the crane pixels. The scene canvas is
  // transparent outside the cranes themselves, so layering it on top only
  // replaces the pixels it actually has cranes at.
  ctx.drawImage(domCanvas, 0, 0);
  if (sceneCanvasEl) {
    ctx.drawImage(sceneCanvasEl, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

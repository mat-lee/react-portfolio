/**
 * Pre-built Tailwind CSS for the TetrisMoveVisualizer component.
 * This is injected into the Shadow DOM for style isolation.
 *
 * Why a JS file? So we can import it as a string without special webpack config.
 */

export const componentCSS = `
/* ===== Tailwind Preflight (CSS Reset) ===== */
*, *::before, *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

* { margin: 0; }
html, :host { line-height: 1.5; -webkit-text-size-adjust: 100%; font-family: ui-sans-serif, system-ui, sans-serif; }
body { margin: 0; line-height: inherit; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; background: transparent; }
img, svg { display: block; max-width: 100%; }

/* ===== Layout ===== */
.grid { display: grid; }
.flex { display: flex; }
.inline-block { display: inline-block; }
.inline-flex { display: inline-flex; }
.relative { position: relative; }
.absolute { position: absolute; }

/* Grid columns */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-\\[repeat\\(7\\,32px\\)\\] { grid-template-columns: repeat(7, 32px); }

/* Column span */
.col-span-1 { grid-column: span 1 / span 1; }

/* Responsive grid */
@media (min-width: 1024px) {
  .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
  .xl\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .xl\\:col-span-1 { grid-column: span 1 / span 1; }
  .xl\\:col-span-2 { grid-column: span 2 / span 2; }
}

/* Flexbox */
.flex-1 { flex: 1 1 0%; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.shrink-0 { flex-shrink: 0; }

/* Gap */
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }

/* Space */
.space-y-3 > * + * { margin-top: 0.75rem; }
.space-y-4 > * + * { margin-top: 1rem; }

/* ===== Sizing ===== */
.w-4 { width: 1rem; }
.w-8 { width: 2rem; }
.w-fit { width: fit-content; }
.w-full { width: 100%; }
.h-4 { height: 1rem; }
.h-8 { height: 2rem; }
.h-\\[3px\\] { height: 3px; }
.w-\\[3px\\] { width: 3px; }
.h-px { height: 1px; }
.w-px { width: 1px; }
.min-w-0 { min-width: 0; }
.max-w-full { max-width: 100%; }

/* ===== Spacing ===== */
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* ===== Positioning ===== */
.inset-\\[2px\\] { inset: 2px; }
.top-0 { top: 0; }
.top-\\[-1px\\] { top: -1px; }
.right-0 { right: 0; }
.right-\\[-1px\\] { right: -1px; }
.bottom-0 { bottom: 0; }
.bottom-\\[-1px\\] { bottom: -1px; }
.left-0 { left: 0; }
.left-\\[-1px\\] { left: -1px; }
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-\\[9999\\] { z-index: 9999; }

/* ===== Typography ===== */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-semibold { font-weight: 600; }

/* ===== Colors ===== */
.bg-white { background-color: #fff; }
.bg-black { background-color: #000; }
.bg-transparent { background-color: transparent; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-200 { background-color: #e5e7eb; }
.bg-gray-300 { background-color: #d1d5db; }
.bg-purple-500 { background-color: #a855f7; }
.bg-pink-500 { background-color: #ec4899; }
.bg-sky-500 { background-color: #0ea5e9; }

.text-white { color: #fff; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }

/* ===== Borders ===== */
.border { border-width: 1px; }
.border-2 { border-width: 2px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.border-none { border-style: none; }

/* ===== Border Radius ===== */
.rounded-sm { border-radius: 0.125rem; }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-\\[2px\\] { border-radius: 2px; }

/* ===== Effects ===== */
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }

/* ===== Misc ===== */
.overflow-x-auto { overflow-x: auto; }
.cursor-pointer { cursor: pointer; }

/* ===== Hover States ===== */
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:bg-gray-300:hover { background-color: #d1d5db; }
.hover\\:opacity-90:hover { opacity: 0.9; }

/* ===== Custom: Slider ===== */
.slider-gray {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}
.slider-gray::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #374151;
  cursor: pointer;
}
.slider-gray::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #374151;
  cursor: pointer;
  border: none;
}
`;

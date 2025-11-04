import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PiecePicker from "./PiecePicker";

/* ===================== Config ===================== */
const WIDTH = 10;
const HEIGHT = 20;

// Visual constants (editor + viz)
const CELL_EDITOR = 22; // px
const CELL_VIZ    = 18; // px

// Light grid look
const COLORS = {
  page: "bg-white",
  panel: "bg-white border border-gray-200",
  cellBgEmpty: "bg-gray-100",  // light cell
  cellBgFilled: "bg-gray-500", // edited/blocked cell
  gridLine: "bg-gray-200",     // interior gridlines (lighter than cell)
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  // overlays (visualization) – high z-index so they sit above gridlines
  reachableStrip: "bg-white z-10",
  placeableStrip: "bg-black z-10",
  tspinT1: "bg-purple-500",
  tspinT2: "bg-pink-500",
};

/* ===================== Validation (micro-frames) ===================== */
function validateMicroFrames(arr) {
  if (!Array.isArray(arr)) throw new Error("Frames must be an array");
  for (const f of arr) {
    if (typeof f !== "object" || f == null) throw new Error("Frame must be an object");
    if (![0,1,2,3].includes(f.rotation)) throw new Error("Frame.rotation must be 0..3");
    if (!["reached","placeable","tspin"].includes(f.kind)) throw new Error("Frame.kind must be 'reached'|'placeable'|'tspin'");
    if (!Number.isInteger(f.x) || !Number.isInteger(f.y)) throw new Error("Frame.x/y must be integers");
    if (f.kind === "tspin" && ![1,2,3].includes(f.type)) throw new Error("tspin frame requires type 1|2|3");
  }
}

/* =============== Demo generator (micro-frames) ================= */
function demoFrames(board, piece) {
  const frames = [];
  let rot = 0;
  const q = [[Math.floor(WIDTH/2), 0]];
  const seen = new Set();
  while (q.length && frames.length < 400) {
    const [x,y] = q.shift();
    const k = `${x},${y}`;
    if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) continue;
    if (board[y][x]) continue;
    if (seen.has(k)) continue;
    seen.add(k);

    // one cell per frame
    frames.push({ rotation: rot, kind: "reached", x, y });
    if ((x + y) % 7 === 0) frames.push({ rotation: rot, kind: "placeable", x, y });
    if (piece === "T" && (x + 3*y) % 29 === 0) frames.push({ rotation: (rot+2)%4, kind: "tspin", x, y, type: ((x+y)%3)+1 });

    q.push([x+1,y], [x-1,y], [x,y+1], [x,y-1]);
    rot = (rot + 1) % 4;
  }
  return frames;
}

// ---- Speed (slider 0..100 -> UPS) ----
// Left = very slow, Right = very fast
const UPS_MIN = 1;   // one update every ~2s
const UPS_MAX = 10000;   // 240 updates/sec; raise if you want faster

function uiToUPS(v) {
  const t = Math.max(0, Math.min(100, v)) / 100;   // 0..1
  return UPS_MIN * Math.pow(UPS_MAX / UPS_MIN, t); // smooth exponential
}


/* =================== Component ==================== */
export default function TetrisMoveVisualizer() {
  // Board state: 0 empty, 1 solid/blocked
  const [board, setBoard] = useState(() =>
    Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
  );
  const [piece, setPiece] = useState("T");

    // Playback speed as UPS (updates/sec) driven by the slider
    const [speedUI, setSpeedUI] = useState(20);        // 0..100
    const [ups, setUps]         = useState(uiToUPS(20));

    useEffect(() => {
    setUps(uiToUPS(speedUI));
    }, [speedUI]);

    const [isPlaying, setIsPlaying] = useState(false);

  const [step, setStep] = useState(0);
  const [frames, setFrames] = useState([]);

  // Per-rotation layers
  const [reachable, setReachable] = useState([
    makeBoolGrid(),
    makeBoolGrid(),
    makeBoolGrid(),
    makeBoolGrid(),
  ]);
  const [placeable, setPlaceable] = useState([
    makeBoolGrid(),
    makeBoolGrid(),
    makeBoolGrid(),
    makeBoolGrid(),
  ]);
  const [tspinCells, setTspinCells] = useState([
    makeNumGrid(),
    makeNumGrid(),
    makeNumGrid(),
    makeNumGrid(),
  ]);

  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Initialize demo frames for convenience
  useEffect(() => {
    if (frames.length === 0) setFrames(demoFrames(board, piece));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Playback -------------------- */
  const tick = useCallback(() => {
    setStep((i) => {
      if (i >= frames.length) return i;
      const f = frames[i];
      applyMicroFrame(f, setReachable, setPlaceable, setTspinCells);
      return i + 1;
    });
  }, [frames]);

const rafRef  = useRef(null);
const lastRef = useRef(null);
const accRef  = useRef(0);

useEffect(() => {
  if (!isPlaying) return;

  lastRef.current = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt  = (now - lastRef.current) / 1000; // seconds
    lastRef.current = now;

    // accumulate fractional updates based on UPS
    accRef.current += dt * ups;

    // cap work per frame so we keep the UI smooth
    const MAX_PER_FRAME = 200;

    setStep((i) => {
      if (i >= frames.length) return i;

      // how many micro-frames should we apply this tick?
      let toApply = Math.min(Math.floor(accRef.current), frames.length - i, MAX_PER_FRAME);
      if (toApply <= 0) return i;

      // clone once
      const nextReachable = cloneBoolLayers(reachable);
      const nextPlaceable = cloneBoolLayers(placeable);
      const nextTspins    = cloneNumLayers(tspinCells);

      // apply N frames into the clones
      const applied = applyMicroToClones(frames, i, toApply, nextReachable, nextPlaceable, nextTspins);

      // commit a single state update per layer
      setReachable(nextReachable);
      setPlaceable(nextPlaceable);
      setTspinCells(nextTspins);

      accRef.current -= applied;   // consume accumulator
      return i + applied;          // advance pointer
    });

    rafRef.current = requestAnimationFrame(loop);
  };

  rafRef.current = requestAnimationFrame(loop);
  return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
}, [isPlaying, ups, frames, reachable, placeable, tspinCells]);

const onStepOnce = useCallback(() => {
  setStep((i) => {
    if (i >= frames.length) return i;
    applyMicroFrame(frames[i], setReachable, setPlaceable, setTspinCells);
    return i + 1;
  });
}, [frames]);

const onPlay  = useCallback(() => setIsPlaying(true), []);
const onPause = useCallback(() => setIsPlaying(false), []);
const onReset = useCallback(() => {
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  setIsPlaying(false);
  setStep(0);
  accRef.current = 0;  // important
  setReachable([makeBoolGrid(), makeBoolGrid(), makeBoolGrid(), makeBoolGrid()]);
  setPlaceable([makeBoolGrid(), makeBoolGrid(), makeBoolGrid(), makeBoolGrid()]);
  setTspinCells([makeNumGrid(), makeNumGrid(), makeNumGrid(), makeNumGrid()]);
}, []);

  /* -------------------- Editor -------------------- */
  const onClearBoard = useCallback(() => {
    setBoard(Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0)));
  }, []);

  const toggleCell = (x, y, value) => {
    setBoard((b) => {
      const nb = b.map((row) => row.slice());
      nb[y][x] = typeof value === "number" ? value : b[y][x] ? 0 : 1;
      return nb;
    });
  };

  const handlePointerDown = (x, y) => {
    isDraggingRef.current = true;
    toggleCell(x, y);
  };
  const handlePointerEnter = (x, y) => {
    if (isDraggingRef.current) toggleCell(x, y, 1);
  };
  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };
  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  /* -------------------- Python API -------------------- */
  const [apiUrl, setApiUrl] = useState("/api/generate");
  const generateFromPython = async () => {
    try {
      onReset();
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, piece }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      validateMicroFrames(data);
      setFrames(data);
    } catch (e) {
      alert(`Failed to generate from Python: ${e.message}`);
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <div className={`w-full grid grid-cols-1 xl:grid-cols-3 gap-6 items-start ${COLORS.page}`}>
      {/* Left: Editor & Controls */}
      <div className="col-span-1 xl:col-span-1 space-y-4">
{/* Editable Board Grid (light surface, interior lines only, scroll-safe) */}
<div className="w-full max-w-[360px] mx-auto overflow-auto p-2 rounded-xl bg-white border border-gray-200">
  <div
    className="grid w-fit rounded-lg"
    style={{ gridTemplateColumns: `repeat(${WIDTH}, ${CELL_EDITOR}px)` }}
  >
    {Array.from({ length: HEIGHT * WIDTH }, (_, idx) => {
      const x = idx % WIDTH;
      const y = Math.floor(idx / WIDTH);
      const filled = board[y][x] === 1;

      return (
        <div
          key={idx}
          className={`relative ${filled ? COLORS.cellBgFilled : COLORS.cellBgEmpty}`}
          style={{ width: CELL_EDITOR, height: CELL_EDITOR }}
          onPointerDown={() => handlePointerDown(x, y)}
          onPointerEnter={() => handlePointerEnter(x, y)}
        >
          {/* interior grid lines: top & left only (skip outer border) */}
          {x > 0 && (
            <div className={`absolute left-0 top-0 bottom-0 w-px ${COLORS.gridLine}`} style={{ zIndex: 0 }} />
          )}
          {y > 0 && (
            <div className={`absolute left-0 right-0 top-0 h-px ${COLORS.gridLine}`} style={{ zIndex: 0 }} />
          )}
        </div>
      );
    })}
  </div>
</div>


        {/* Controls */}
        <div className={`p-4 rounded-2xl shadow ${COLORS.panel} space-y-3`}>
          <h2 className={`text-lg font-semibold ${COLORS.textPrimary}`}>Controls</h2>

          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={generateFromPython}
            >
              Run (API)
            </button>

            {!isPlaying ? (
              <button
                className="px-4 py-1.5 rounded-xl bg-black text-white hover:opacity-90"
                onClick={onPlay}
              >
                Play
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-xl bg-gray-900 text-white hover:opacity-90"
                onClick={onPause}
              >
                Pause
              </button>
            )}

            <button
              className="px-3 py-1.5 rounded-xl bg-gray-800 text-white hover:opacity-90"
              onClick={onStepOnce}
            >
              Step
            </button>

            <button
              className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-900 hover:bg-gray-100 border border-gray-300"
              onClick={onReset}
            >
              Reset
            </button>

<div className="flex items-center gap-3 ml-2 w-full">
  <label className="text-gray-700 text-sm shrink-0">Speed</label>
  <input
    type="range"
    min={0}
    max={100}
    step={1}
    value={speedUI}
    onChange={(e) => setSpeedUI(parseInt(e.target.value, 10))}
    aria-label="Playback speed"
    className="slider-gray flex-1 min-w-0"
  />
</div>


          </div>

          {/* Advanced (API URL) */}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-600">Advanced</summary>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">API URL</span>
              <input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Default is <code>/api/generate</code> (via Vite proxy). Change if your server runs elsewhere.
            </p>
          </details>
        </div>
      </div>

      {/* Right: Visualization Grids & Legend */}
      <div className="col-span-1 xl:col-span-2 space-y-4">
        {/* Four rotation grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((r) => (
            <RotationGrid
              key={r}
              title={`Rotation ${r}`}
              reachable={reachable[r]}
              placeable={placeable[r]}
              tspinType={tspinCells[r]}
            />
          ))}
        </div>

        <div className={`p-3 rounded-2xl ${COLORS.panel}`}>
          <h3 className="font-semibold mb-2 text-gray-900">Legend</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Legend swatchClass="border-2 border-white" label="Reached (white border)" />
            <Legend swatchClass="border-2 border-black" label="Placeable (black border)" />
            <Legend swatchClass="bg-purple-500" label="T-Spin Type 1 (T only)" />
            <Legend swatchClass="bg-pink-500" label="T-Spin Type 2 (T only)" />
            <Legend swatchClass="bg-gradient-to-tr from-purple-500 to-pink-500" label="Both (diagonal split)" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Subcomponents ==================== */
function RotationGrid({ title, reachable, placeable, tspinType }) {
  const reachEdges = useMemo(() => computeEdges(reachable), [reachable]);
  const placeEdges = useMemo(() => computeEdges(placeable), [placeable]);

  return (
    <div className={`p-3 rounded-2xl ${COLORS.panel}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-900 font-semibold text-sm">{title}</h4>
      </div>

      {/* Light grid, interior lines only */}
      <div className="inline-block p-2 rounded-lg bg-white border border-gray-200">
        <div
          className="grid w-fit rounded-md"
          style={{ gridTemplateColumns: `repeat(${WIDTH}, ${CELL_VIZ}px)` }}
        >
          {Array.from({ length: HEIGHT * WIDTH }, (_, idx) => {
            const x = idx % WIDTH;
            const y = Math.floor(idx / WIDTH);
            const maskT = tspinType[y][x];

            return (
              <div
                key={idx}
                className={`relative ${COLORS.cellBgEmpty}`}
                style={{ width: CELL_VIZ, height: CELL_VIZ }}
              >
                {/* interior grid lines: top & left only (skip outer frame) */}
                {x > 0 && (
                  <div className={`absolute left-0 top-0 bottom-0 w-px ${COLORS.gridLine}`} style={{ zIndex: 0 }} />
                )}
                {y > 0 && (
                  <div className={`absolute left-0 right-0 top-0 h-px ${COLORS.gridLine}`} style={{ zIndex: 0 }} />
                )}

                {/* T-Spin fill */}
                {maskT ? (
                  <div
                    className="absolute inset-[2px] rounded-[2px]"
                    style={{
                      background:
                        maskT === 3
                          ? "linear-gradient(45deg, rgba(168,85,247,1) 50%, rgba(236,72,153,1) 50%)"
                          : undefined,
                      zIndex: 5,
                    }}
                  >
                    {maskT === 1 ? <div className={`w-full h-full ${COLORS.tspinT1}`} /> : null}
                    {maskT === 2 ? <div className={`w-full h-full ${COLORS.tspinT2}`} /> : null}
                  </div>
                ) : null}

                {/* Reachable borders (exterior edges only) */}
                {reachEdges[y][x].top && (
                  <div className={`absolute left-0 right-0 top-[-1px] h-[3px] ${COLORS.reachableStrip}`} />
                )}
                {reachEdges[y][x].right && (
                  <div className={`absolute right-[-1px] top-0 bottom-0 w-[3px] ${COLORS.reachableStrip}`} />
                )}
                {reachEdges[y][x].bottom && (
                  <div className={`absolute left-0 right-0 bottom-[-1px] h-[3px] ${COLORS.reachableStrip}`} />
                )}
                {reachEdges[y][x].left && (
                  <div className={`absolute left-[-1px] top-0 bottom-0 w-[3px] ${COLORS.reachableStrip}`} />
                )}

                {/* Placeable borders on top */}
                {placeEdges[y][x].top && (
                  <div className={`absolute left-0 right-0 top-[-1px] h-[3px] ${COLORS.placeableStrip}`} />
                )}
                {placeEdges[y][x].right && (
                  <div className={`absolute right-[-1px] top-0 bottom-0 w-[3px] ${COLORS.placeableStrip}`} />
                )}
                {placeEdges[y][x].bottom && (
                  <div className={`absolute left-0 right-0 bottom-[-1px] h-[3px] ${COLORS.placeableStrip}`} />
                )}
                {placeEdges[y][x].left && (
                  <div className={`absolute left-[-1px] top-0 bottom-0 w-[3px] ${COLORS.placeableStrip}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ swatchClass, label, note }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded ${swatchClass}`} />
      <span className="text-gray-900">{label}</span>
      {note ? <span className="text-gray-600">{note}</span> : null}
    </div>
  );
}

/* =================== Helpers ==================== */
function makeBoolGrid() {
  return Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
}
function makeNumGrid() {
  return Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
}

function applyMicroFrame(frame, setReachable, setPlaceable, setTspinCells) {
  const { rotation: r, kind, x, y, type } = frame;
  if (kind === "reached") {
    setReachable((layers) => patchBoolCell(layers, r, x, y, true));
  } else if (kind === "placeable") {
    setPlaceable((layers) => patchBoolCell(layers, r, x, y, true));
  } else if (kind === "tspin") {
    setTspinCells((layers) => patchNumCell(layers, r, x, y, type));
  }
}

// single-cell patch helpers used by applyMicroFrame
function patchBoolCell(layers, rot, x, y, val) {
  const copy = layers.map((g) => g.map((row) => row.slice()));
  const grid = copy[rot];
  if (grid && grid[y] && typeof grid[y][x] !== "undefined") grid[y][x] = val;
  return copy;
}
function patchNumCell(layers, rot, x, y, val) {
  const copy = layers.map((g) => g.map((row) => row.slice()));
  const grid = copy[rot];
  if (grid && grid[y] && typeof grid[y][x] !== "undefined") grid[y][x] = val;
  return copy;
}

function computeEdges(layer) {
  const H = layer.length,
    W = layer[0].length;
  const out = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => ({ top: false, right: false, bottom: false, left: false }))
  );
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!layer[y][x]) continue;
      const up = y > 0 && layer[y - 1][x];
      const dn = y < H - 1 && layer[y + 1][x];
      const lf = x > 0 && layer[y][x - 1];
      const rt = x < W - 1 && layer[y][x + 1];
      if (!up) out[y][x].top = true;
      if (!rt) out[y][x].right = true;
      if (!dn) out[y][x].bottom = true;
      if (!lf) out[y][x].left = true;
    }
  return out;
}

function cloneBoolLayers(layers) {
  return layers.map(g => g.map(row => row.slice()));
}
function cloneNumLayers(layers) {
  return layers.map(g => g.map(row => row.slice()));
}

function applyMicroToClones(frames, start, count, boolLayersA, boolLayersB, numLayers) {
  let i = start;
  let applied = 0;
  const end = start + count;
  while (i < end) {
    const f = frames[i];
    const r = f.rotation;
    if (f.kind === "reached") {
      const g = boolLayersA[r]; if (g?.[f.y]?.[f.x] !== undefined) g[f.y][f.x] = true;
    } else if (f.kind === "placeable") {
      const g = boolLayersB[r]; if (g?.[f.y]?.[f.x] !== undefined) g[f.y][f.x] = true;
    } else if (f.kind === "tspin") {
      const g = numLayers[r];    if (g?.[f.y]?.[f.x] !== undefined) g[f.y][f.x] = f.type;
    }
    i++; applied++;
  }
  return applied;
}
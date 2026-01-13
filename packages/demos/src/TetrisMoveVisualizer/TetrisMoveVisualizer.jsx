import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PiecePicker from "./PiecePicker.jsx";
import { generateMoves } from "./api.js";

/* ===================== Config ===================== */
const WIDTH = 10;
const HEIGHT = 20;

// The visualization grid needs to be wider to show piece movements that start
// outside the main board boundaries (e.g., x = -1, -2).
const VIZ_GRID_WIDTH = 12;
const VIZ_GRID_X_OFFSET = 2; // Board's x=0 is at viz grid's x=2

// Visual constants (editor + viz)
const CELL_EDITOR = 22; // px
const CELL_VIZ    = 16; // px

// Light grid look
const COLORS = {
  page: "bg-white",
  panel: "bg-white border border-gray-200",
  cellBgEmpty: "bg-gray-100",
  cellBgFilled: "bg-gray-300", // A bit darker for the editor
  cellBgPopped: "bg-gray-200",
  gridLine: "bg-gray-200",
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  reachedStrip: "bg-white z-10",
  placeableStrip: "bg-black z-10",
  tspinT1: "bg-purple-500", // T-Spin Mini (now type 1)
  tspinT2: "bg-pink-500",   // T-Spin (now type 2)
  tspinT3: "bg-sky-500",
};

// Speed conversion
const UPS_MIN = 1;
const UPS_MAX = 10000;

function uiToUPS(v) {
  const t = Math.max(0, Math.min(100, v)) / 100;
  return UPS_MIN * Math.pow(UPS_MAX / UPS_MIN, t);
}

/* =================== Component ==================== */
export default function TetrisMoveVisualizer() {
  const [board, setBoard] = useState(() =>
    Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0))
  );
  const [piece, setPiece] = useState("T");
  const [speedUI, setSpeedUI] = useState(70);
  const [ups, setUps] = useState(uiToUPS(20));
  const [algorithm, setAlgorithm] = useState("brute-force");
  const [accuracy, setAccuracy] = useState(null);

  const ALGORITHMS = ["brute-force", "harddrop", "faster-but-loss"];

  useEffect(() => {
    setUps(uiToUPS(speedUI));
  }, [speedUI]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [frames, setFrames] = useState([]);

  const [reached, setReached] = useState([
    makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH),
  ]);
  const [placeable, setPlaceable] = useState([
    makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH),
  ]);
  const [popped, setPopped] = useState([
    makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH),
  ]);
  const [tspinCells, setTspinCells] = useState([
    makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH),
  ]);

  const isDraggingRef = useRef(false);
  const dragModeRef = useRef("paint"); // 'paint' or 'erase'
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const accRef = useRef(0);

  /* -------------------- Playback -------------------- */
  useEffect(() => {
    if (!isPlaying) return;

    lastRef.current = performance.now();
    const msPerMicroFrame = 1000 / ups;

    const loop = () => {
      const now = performance.now();
      const dt = now - lastRef.current;
      lastRef.current = now;

      accRef.current += dt;

      let framesToAdvance = Math.floor(accRef.current / msPerMicroFrame);
      const MAX_FRAMES_TO_PROCESS_PER_RAF = 1000;
      framesToAdvance = Math.min(framesToAdvance, MAX_FRAMES_TO_PROCESS_PER_RAF);

      if (framesToAdvance > 0) {
        accRef.current -= framesToAdvance * msPerMicroFrame;

        setStep((currentStep) => {
          if (currentStep >= frames.length) return currentStep;

          const remainingFrames = frames.length - currentStep;
          const actualFramesToApply = Math.min(framesToAdvance, remainingFrames);

          if (actualFramesToApply === 0) return currentStep;

          for (let i = 0; i < actualFramesToApply; i++) {
            const f = frames[currentStep + i];
            applyMicroFrame(f, setReached, setPlaceable, setTspinCells, setPopped);
          }

          return currentStep + actualFramesToApply;
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, ups, frames]);

  const onReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setStep(0);
    accRef.current = 0;
    setReached([makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH)]);
    setPlaceable([makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH)]);
    setPopped([makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH), makeBoolGrid(VIZ_GRID_WIDTH)]);
    setTspinCells([makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH), makeNumGrid(VIZ_GRID_WIDTH)]);
    setAccuracy(null);
  }, []);

  const generateFramesCallback = useCallback(async () => {
    try {
      onReset();
      const data = await generateMoves(board, piece, algorithm);
      setFrames(data.frames);
      setAccuracy(data.accuracy);
    } catch (e) {
      alert(`Failed to generate frames: ${e.message}`);
      setIsPlaying(false);
    }
  }, [board, piece, algorithm, onReset]);

  const onPlay = useCallback(async () => {
    if (frames.length === 0) {
      await generateFramesCallback();
    }
    setIsPlaying(true);
  }, [frames.length, generateFramesCallback]);

  const onPause = useCallback(() => setIsPlaying(false), []);

  /* -------------------- Editor -------------------- */
  const toggleCell = (x, y, value) => {
    setBoard((b) => {
      const nb = b.map((row) => row.slice());
      nb[y][x] = typeof value === "number" ? value : b[y][x] ? 0 : 1;
      return nb;
    });
    setFrames([]);
  };

  const handlePointerDown = (x, y) => {
    isDraggingRef.current = true;
    // Set the drag mode based on the state of the cell *before* it's toggled.
    dragModeRef.current = board[y][x] === 1 ? "erase" : "paint";
    toggleCell(x, y);
  };

  const handlePointerEnter = (x, y) => {
    if (isDraggingRef.current) {
      // Use the determined drag mode to either paint (1) or erase (0).
      const valueToSet = dragModeRef.current === "paint" ? 1 : 0;
      toggleCell(x, y, valueToSet);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  /* -------------------- Render -------------------- */
  return (
    <div className={`w-full grid grid-cols-1 xl:grid-cols-3 gap-6 items-start ${COLORS.page}`}>
      <div className="col-span-1 xl:col-span-1 space-y-4">
        <div className="inline-block p-2 rounded-xl bg-white border border-gray-200">
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

        <div className={`p-4 rounded-2xl shadow ${COLORS.panel} space-y-3`}>
          <h2 className={`text-lg font-semibold ${COLORS.textPrimary}`}>Controls</h2>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Piece</label>
            <PiecePicker value={piece} onChange={(p) => { setPiece(p); setFrames([]); }} />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => { setAlgorithm(e.target.value); setFrames([]); }}
              className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
            >
              {ALGORITHMS.map(algo => (
                <option key={algo} value={algo}>
                  {algo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 flex items-center gap-2"
                onClick={onPlay}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Play
              </button>
            ) : (
              <button
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 flex items-center gap-2"
                onClick={onPause}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 3.5A1.5 1.5 0 017 2h6a1.5 1.5 0 011.5 1.5v13A1.5 1.5 0 0113 18H7a1.5 1.5 0 01-1.5-1.5v-13z" />
                </svg>
                Pause
              </button>
            )}

            <button
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 flex items-center gap-2"
              onClick={onReset}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
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
      </div>

      <div className="col-span-1 xl:col-span-2 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="min-w-0 w-full">
              <RotationGrid
                title={`Rotation ${r}`}
                reached={reached[r]}
                placeable={placeable[r]}
                popped={popped[r]}
                tspinType={tspinCells[r]}
              />
            </div>
          ))}
        </div>

        {accuracy && (
          <div className={`p-3 rounded-2xl ${COLORS.panel}`}>
            <AccuracyDisplay accuracy={accuracy} />
          </div>
        )}

        <div className={`p-3 rounded-2xl ${COLORS.panel}`}>
          <h3 className="font-semibold mb-2 text-gray-900">Legend</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Legend swatchClass="border-2 border-white" label="Reached (white border)" />
            <Legend swatchClass="bg-gray-200" label="Popped (darker bg)" />
            <Legend swatchClass="border-2 border-black" label="Placeable (black border)" />
            <Legend swatchClass={COLORS.tspinT2} label="T-Spin" />
            <Legend swatchClass={COLORS.tspinT1} label="T-Spin Mini" />
            <Legend swatchClass={COLORS.tspinT3} label="Mini Spin" />
            <Legend
              label="Both (diagonal split)"
              style={{
                background: `linear-gradient(135deg, ${getTspinColor(2)} 50%, ${getTspinColor(1)} 50%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Subcomponents ==================== */
function RotationGrid({ title, reached, placeable, popped, tspinType }) {
  const reachEdges = useMemo(() => computeEdges(reached), [reached]);
  const placeEdges = useMemo(() => computeEdges(placeable), [placeable]);

  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(CELL_VIZ);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; // subtract padding
        const maxCellSize = Math.floor(containerWidth / VIZ_GRID_WIDTH);
        setCellSize(Math.min(maxCellSize, CELL_VIZ));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className={`p-3 rounded-2xl ${COLORS.panel}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-900 font-semibold text-sm">{title}</h4>
      </div>

      <div className="p-2 rounded-lg bg-white border border-gray-200 overflow-x-auto max-w-full">
        <div
          className="grid w-fit rounded-md mx-auto max-w-full"
          style={{ gridTemplateColumns: `repeat(${VIZ_GRID_WIDTH}, ${CELL_VIZ}px)`, maxWidth: '100%' }}
        >
          {Array.from({ length: HEIGHT * VIZ_GRID_WIDTH }, (_, idx) => {
            const x = idx % VIZ_GRID_WIDTH;
            const y = Math.floor(idx / VIZ_GRID_WIDTH);
            const maskT = tspinType[y][x];
            const isPopped = popped[y][x];
            const isMainBoardCell = x >= 0 && x < VIZ_GRID_X_OFFSET + WIDTH;
            return (
              <div
                key={idx}
                className={`relative ${isPopped ? COLORS.cellBgPopped : COLORS.cellBgEmpty}`}
                style={{ width: cellSize, height: cellSize }}
              >
                {x > 0 && ( // Vertical lines
                  <div className={`absolute left-0 top-0 bottom-0 w-px ${(x >= 0 && x <= VIZ_GRID_X_OFFSET + WIDTH) ? COLORS.gridLine : 'bg-gray-100'}`} style={{ zIndex: 0 }} />
                )}
                {y > 0 && ( // Horizontal lines
                  <div className={`absolute left-0 right-0 top-0 h-px ${isMainBoardCell ? COLORS.gridLine : 'bg-gray-100'}`} style={{ zIndex: 0 }} />
                )}

                {maskT ? (
                  <div
                    className="absolute inset-[2px] rounded-[2px]"
                    style={{
                      background: maskT === 4
                        ? `linear-gradient(135deg, ${getTspinColor(2)} 50%, ${getTspinColor(1)} 50%)`
                        : getTspinColor(maskT),
                      zIndex: 5,
                    }}
                  >
                    {/* The background is now handled by the style prop.
                        This div is just for creating the element with the correct position and shape.
                        The logic for type 4 (dual) is handled via the gradient background. */}
                  </div>
                ) : null}

                {reachEdges[y][x].top && (
                  <div className={`absolute left-0 right-0 top-[-1px] h-[3px] ${COLORS.reachedStrip}`} />
                )}
                {reachEdges[y][x].right && (
                  <div className={`absolute right-[-1px] top-0 bottom-0 w-[3px] ${COLORS.reachedStrip}`} />
                )}
                {reachEdges[y][x].bottom && (
                  <div className={`absolute left-0 right-0 bottom-[-1px] h-[3px] ${COLORS.reachedStrip}`} />
                )}
                {reachEdges[y][x].left && (
                  <div className={`absolute left-[-1px] top-0 bottom-0 w-[3px] ${COLORS.reachedStrip}`} />
                )}

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

function Legend({ swatchClass, label, style }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded ${swatchClass}`} style={style} />
      <span className="text-gray-900">{label}</span>
    </div>
  );
}

function AccuracyDisplay({ accuracy }) {
  const { moves, spins } = accuracy;
  const movesPercent = moves.total > 0 ? ((moves.found / moves.total) * 100).toFixed(1) : "100.0";
  const spinsPercent = spins.total > 0 ? ((spins.found / spins.total) * 100).toFixed(1) : "100.0";

  return (
    <div>
      <h3 className="font-semibold mb-2 text-gray-900">Accuracy vs Brute-Force</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Moves Found</p>
          <p className="text-lg font-semibold text-gray-900">{moves.found} / {moves.total} ({movesPercent}%)</p>
        </div>
        <div>
          <p className="text-gray-600">Spins Found</p>
          <p className="text-lg font-semibold text-gray-900">{spins.found} / {spins.total} ({spinsPercent}%)</p>
        </div>
      </div>
    </div>
  );
}

/* =================== Helpers ==================== */
function makeBoolGrid(width = WIDTH) {
  return Array.from({ length: HEIGHT }, () => Array(width).fill(false));
}

function makeNumGrid(width = WIDTH) {
  return Array.from({ length: HEIGHT }, () => Array(width).fill(0));
}

function getTspinColor(type) {
  if (type === 1) return "rgba(168,85,247,1)"; // T-Spin Mini -> purple-500
  if (type === 2) return "rgba(236,72,153,1)"; // T-Spin -> pink-500
  if (type === 3) return "rgba(14, 165, 233, 1)"; // Mini Spin -> sky-500
  // For type 4, the gradient is constructed directly.
  // For any other case, return undefined so no background is applied.
  return undefined;
}

function patchCell(layers, rot, x, y, val) {
  const copy = layers.map((g) => g.map((row) => row.slice()));
  const vizX = x + VIZ_GRID_X_OFFSET;
  const grid = copy[rot];
  if (grid && grid[y] && typeof grid[y][vizX] !== "undefined") grid[y][vizX] = val;
  return copy;
}

function applyMicroFrame(frame, setReached, setPlaceable, setTspinCells, setPopped) {
  const { rotation: r, kind, x, y, type } = frame;
  if (kind === "reached") setReached((layers) => patchCell(layers, r, x, y, true));
  else if (kind === "placeable") setPlaceable((layers) => patchCell(layers, r, x, y, true));
  else if (kind === "tspin") {
    setTspinCells((layers) => {
      const currentType = layers[r][y][x + VIZ_GRID_X_OFFSET];
      let newType = type;

      if (currentType) {
        // If a T-spin mini (1) and a T-spin (2) occur on the same cell, mark it as a special dual-type (4).
        if ((currentType === 1 && type === 2) || (currentType === 2 && type === 1)) {
          newType = 4; // Special code for T-spin + T-spin mini
        }
        // Other combinations can be handled here if needed in the future.
      }
      return patchCell(layers, r, x, y, newType);
    });
  }
  else if (kind === "popped") setPopped((layers) => patchCell(layers, r, x, y, true));
}

function computeEdges(layer) {
  const H = layer.length, W = layer[0].length;
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

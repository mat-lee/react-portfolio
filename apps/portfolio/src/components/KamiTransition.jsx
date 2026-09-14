import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { audio } from "../audio";

// The "kami" (paper) transition: a snapshot of the current page, sliced into
// a triangular grid, un-tears outward from the click point revealing the
// destination page underneath — ported from the origami-portfolio
// reference's FoldTransition: same grid density (90x45), same cascade
// timing formula and constants, including the deterministic per-triangle
// jitter below (the reference calls this out explicitly: without it, the
// cascade expands at the same average rate in every direction, which reads
// as a suspiciously clean, radially-symmetric ring/wipe instead of an
// organic tear — dropping it in an earlier pass here is exactly what made
// this look like a plain wipe). What's still scoped down from the reference
// (see the plan) is the *rendering*: plain per-frame vertex math on one
// BufferGeometry instead of a custom onBeforeCompile shader + a
// permanently-reused InstancedMesh, and mounted fresh per transition
// instead of kept alive forever — those cut real complexity the reference
// needed for running this continuously, all session, at this same density;
// they don't change the cascade's own math or scale.
const COLS = 90;
const ROWS = 45;
const FOLD_DURATION = 45; // ms — one triangle's own fold, before the speed multiplier below
const FOLD_MIN_DURATION = 35;
const STAGGER_SCALE = 2.5;
const DEPTH_SPEED_BASE = 0.32;
const DEPTH_SPEED_PEAK = 5;
const DEPTH_SPEED_RAMP = 40; // hops until cascade speed maxes out
// Global playback-speed multiplier, matching the reference's `foldSpeed`
// (>1 = faster, <1 = slower) — applied by dividing, so this being under 1
// makes everything take proportionally longer.
const FOLD_SPEED = 0.8;

// Deterministic per-triangle pseudo-random value in [0,1), from its grid
// position — a fixed "personality" per triangle rather than pure per-hop
// randomness. This is what keeps the cascade's edge looking like an organic
// tear instead of a clean expanding ring.
function triJitter(r, c) {
  const h = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function idOf(r, c, half) {
  return `${r},${c},${half}`;
}

// Each grid cell is split by its top-left -> bottom-right diagonal into two
// triangles, "a" (top-left) and "b" (bottom-right), sharing that diagonal.
function buildGrid(width, height) {
  const cellW = width / COLS;
  const cellH = height / ROWS;
  const grid = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = c * cellW;
      const y0 = r * cellH;
      const x1 = x0 + cellW;
      const y1 = y0 + cellH;
      const a = { id: idOf(r, c, "a"), r, c, half: "a", p: [[x0, y0], [x1, y0], [x0, y1]] };
      const b = { id: idOf(r, c, "b"), r, c, half: "b", p: [[x1, y0], [x1, y1], [x0, y1]] };
      a.center = avg(a.p);
      b.center = avg(b.p);
      grid[a.id] = a;
      grid[b.id] = b;
    }
  }
  return grid;
}

function avg(pts) {
  return [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
}

// "a" triangles border the "b" triangle in the same cell (their shared
// diagonal), the cell above, and the cell to the left; "b" mirrors that
// toward the cell below/right. Every pair returned here shares a real edge.
function neighborsOf({ r, c, half }) {
  if (half === "a") {
    const n = [idOf(r, c, "b")];
    if (r > 0) n.push(idOf(r - 1, c, "b"));
    if (c > 0) n.push(idOf(r, c - 1, "b"));
    return n;
  }
  const n = [idOf(r, c, "a")];
  if (r < ROWS - 1) n.push(idOf(r + 1, c, "a"));
  if (c < COLS - 1) n.push(idOf(r, c + 1, "a"));
  return n;
}

function closeTo(a, b) {
  return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
}

// The edge a fold task's triangle shares with whichever neighbor triggered
// it — the hinge it rotates around. Returns null only if they turn out not
// to share an edge, which shouldn't happen for pairs neighborsOf produces.
function computeHinge(childId, parentId, grid) {
  const child = grid[childId];
  const parent = grid[parentId];
  if (!child || !parent) return null;

  const shared = [];
  for (const cp of child.p) {
    for (const pp of parent.p) {
      if (closeTo(cp, pp)) shared.push(cp);
    }
  }
  if (shared.length < 2) return null;
  const [s1, s2] = shared;

  const hingeP1 = new THREE.Vector3(s1[0], s1[1], 0);
  const axis = new THREE.Vector3(s2[0] - s1[0], s2[1] - s1[1], 0).normalize();

  // Orient the axis so the fold opens away from the parent, not across it.
  const nonHinge = child.p.find((pt) => !closeTo(pt, s1) && !closeTo(pt, s2));
  const Vx = nonHinge[0] - hingeP1.x;
  const Vy = nonHinge[1] - hingeP1.y;
  if (axis.x * Vy - axis.y * Vx < 0) axis.negate();

  return { axis, hingeP1 };
}

// Pure: computes the full BFS cascade schedule once, up front — every
// triangle's start/end time and fold hinge, keyed off the click point.
// Returned array is sorted DESCENDING by startTime so the caller can pop
// ready tasks off the end cheaply instead of scanning the whole thing.
function buildSchedule(grid, ids, clickPos, width, height) {
  const now = performance.now();
  const click = clickPos ?? { x: width / 2, y: height / 2 };

  let centerId = ids[0];
  let minDist = Infinity;
  for (const id of ids) {
    const [cx, cy] = grid[id].center;
    const d = (cx - click.x) ** 2 + (cy - click.y) ** 2;
    if (d < minDist) {
      minDist = d;
      centerId = id;
    }
  }

  // The clicked triangle has no parent to hinge-fold from — it just
  // vanishes instantly (hinge: null), same as the reference.
  const scheduled = [{ id: centerId, startTime: now, endTime: now, hinge: null }];
  const bestArrival = new Map([[centerId, now]]);
  const queue = [{ id: centerId, arrival: now, depth: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.arrival - b.arrival);
    const { id, arrival, depth } = queue.shift();
    if (arrival > bestArrival.get(id)) continue;

    for (const nid of neighborsOf(grid[id])) {
      if (!grid[nid] || bestArrival.has(nid)) continue;

      const nTri = grid[nid];
      const rampT = Math.min(1, depth / DEPTH_SPEED_RAMP);
      const rampEase = rampT * rampT * (3 - 2 * rampT); // smoothstep
      const depthSpeed = DEPTH_SPEED_BASE + rampEase * (DEPTH_SPEED_PEAK - DEPTH_SPEED_BASE);
      const duration = Math.max(FOLD_MIN_DURATION, FOLD_DURATION / depthSpeed) / FOLD_SPEED;
      // Reference's exact shape: a per-hop random magnitude (mostly ~13,
      // occasionally up to 14.5) scaled by each triangle's own fixed
      // jitter "personality" (0.3-2.3) — the random term keeps every
      // transition different, the deterministic term keeps any one
      // triangle's relative timing consistent, which is what makes nearby
      // triangles cohere into visible "fast lane" tears instead of static.
      const jitter = 0.3 + triJitter(nTri.r, nTri.c) * 2.0;
      const neighborStagger = (STAGGER_SCALE * (Math.random() * 3 + 11.5) * jitter) / depthSpeed / FOLD_SPEED;
      const startTime = arrival + neighborStagger;

      bestArrival.set(nid, startTime);
      queue.push({ id: nid, arrival: startTime, depth: depth + 1 });

      const hinge = computeHinge(nid, id, grid);
      scheduled.push({ id: nid, startTime, endTime: startTime + duration, hinge });
    }
  }

  return scheduled.sort((a, b) => b.startTime - a.startTime);
}

function KamiScene({ texture, clickPos, onSettled, onFirstFrame, width, height }) {
  const grid = useMemo(() => buildGrid(width, height), [width, height]);
  const ids = useMemo(() => Object.keys(grid), [grid]);
  const indexOf = useMemo(() => Object.fromEntries(ids.map((id, i) => [id, i])), [ids]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(ids.length * 9);
    const uvs = new Float32Array(ids.length * 6);
    ids.forEach((id, i) => {
      const tri = grid[id];
      for (let v = 0; v < 3; v++) {
        const [x, y] = tri.p[v];
        positions[i * 9 + v * 3 + 0] = x;
        positions[i * 9 + v * 3 + 1] = y;
        positions[i * 9 + v * 3 + 2] = 0;
        // texture is default flipY (top-left-origin image -> bottom-left
        // UV) — v = 1 - y/height is the standard non-flipped formula for that.
        uvs[i * 6 + v * 2 + 0] = x / width;
        uvs[i * 6 + v * 2 + 1] = 1 - y / height;
      }
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [grid, ids, width, height]);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
    [texture]
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // index -> { startTime, endTime, hinge: {axis, hingeP1} | null, restPts }
  const activeRef = useRef(new Map());
  // Tasks not yet started, sorted DESCENDING by startTime so the
  // soonest-ready one is always last (cheap pop instead of a full scan).
  // null (not []) until the very first useFrame tick — see below for why
  // scheduling happens there and not in a useEffect.
  const pendingRef = useRef(null);
  const startedRef = useRef(false);
  const settledRef = useRef(false);

  useFrame(() => {
    // Scheduling the cascade here, on the first real animation frame,
    // instead of in a useEffect: react-three-fiber runs its own render loop
    // on its own schedule, separate from React-DOM's passive-effect timing
    // (the same reason Crane3D's entrance spring uses useLayoutEffect, not
    // useEffect) — a useEffect here raced with useFrame in practice: React
    // StrictMode's dev-only double-invoke re-ran the scheduling effect a
    // moment after the first run, and by the time it did, useFrame had
    // already ticked once against the FIRST run's (about-to-be-discarded)
    // schedule, occasionally observing it as trivially "idle" before the
    // second run ever populated pendingRef — firing onSettled after ~130ms
    // instead of the real ~1-1.5s cascade. This guard makes the schedule
    // build exactly once, synchronously inside the frame loop itself, with
    // no separate effect to race against.
    if (pendingRef.current === null) {
      pendingRef.current = buildSchedule(grid, ids, clickPos, width, height);
      audio.playUnfold();
      onFirstFrame();
    }

    const now = performance.now();
    const pending = pendingRef.current;
    while (pending.length && now >= pending[pending.length - 1].startTime) {
      const task = pending.pop();
      const idx = indexOf[task.id];
      if (idx !== undefined) activeRef.current.set(idx, { ...task, restPts: grid[task.id].p });
    }

    const posAttr = geometry.attributes.position;

    activeRef.current.forEach((flap, idx) => {
      if (!flap.hinge) {
        const [x, y] = flap.restPts[0];
        for (let v = 0; v < 3; v++) posAttr.setXYZ(idx * 3 + v, x, y, 0);
        activeRef.current.delete(idx);
        return;
      }

      let progress = (now - flap.startTime) / (flap.endTime - flap.startTime);
      progress = Math.max(0, Math.min(1, progress));

      if (progress >= 1) {
        // Collapse to the hinge point — zero-area, so it renders nothing.
        const { x, y, z } = flap.hinge.hingeP1;
        for (let v = 0; v < 3; v++) posAttr.setXYZ(idx * 3 + v, x, y, z);
        activeRef.current.delete(idx);
        return;
      }

      // Ease-in-out cubic; quarter turn (0->90deg, not a full flip) so the
      // hard cut above lands exactly when the flap is already edge-on and
      // barely visible, not mid-flip.
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const angle = eased * (Math.PI / 2);
      const { hingeP1, axis } = flap.hinge;

      for (let v = 0; v < 3; v++) {
        const [x, y] = flap.restPts[v];
        const rel = new THREE.Vector3(x - hingeP1.x, y - hingeP1.y, 0).applyAxisAngle(axis, angle);
        posAttr.setXYZ(idx * 3 + v, hingeP1.x + rel.x, hingeP1.y + rel.y, hingeP1.z + rel.z);
      }
    });

    posAttr.needsUpdate = true;

    const idle = pending.length === 0 && activeRef.current.size === 0;
    if (!idle) startedRef.current = true;
    if (startedRef.current && idle && !settledRef.current) {
      settledRef.current = true;
      onSettled();
    }
  });

  return <mesh geometry={geometry} material={material} />;
}

export function KamiTransition({ texture, clickPos, onSettled }) {
  // Own state, not a ref: needs to trigger a re-render to swap the DOM
  // fallback out for the real canvas. Resets naturally each transition —
  // KamiTransition returns null between transitions (see the guard below),
  // so this whole subtree (state included) is freshly mounted every time
  // `texture` next becomes truthy, never carrying a stale true forward.
  const [firstFramePainted, setFirstFramePainted] = useState(false);

  if (!texture) return null;
  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div id="kami-transition-container" className="fixed inset-0 z-50 pointer-events-none">
      {/* Plain DOM stand-in for the gap between "texture ready" (synchronous
          with React's commit) and react-three-fiber's Canvas actually
          painting a frame — its own render loop, on its own schedule,
          separate from React-DOM's, and WebGL context creation + first
          shader compile isn't free (measured 100s of ms to multiple
          seconds on a slow GPU/driver). Without this, whatever's behind
          the overlay — the real destination page, already navigated to —
          shows through cleanly for that whole gap instead of the frozen
          snapshot, then the stale snapshot suddenly pops in and the
          cascade starts playing catch-up: reads as a broken flash, not a
          transition. Same canvas the texture was built from, reused
          directly (no re-encode), removed the instant the real thing
          paints. */}
      {!firstFramePainted && (
        <div
          className="absolute inset-0"
          ref={(el) => {
            const canvas = texture.image;
            if (el && canvas.parentElement !== el) {
              canvas.style.width = "100%";
              canvas.style.height = "100%";
              canvas.style.display = "block";
              el.appendChild(canvas);
            }
          }}
        />
      )}
      <Canvas gl={{ alpha: true }} frameloop="always">
        <OrthographicCamera
          makeDefault
          left={0}
          right={width}
          top={0}
          bottom={height}
          near={1}
          far={2000}
          position={[0, 0, 1000]}
        />
        <KamiScene
          texture={texture}
          clickPos={clickPos}
          onSettled={onSettled}
          onFirstFrame={() => setFirstFramePainted(true)}
          width={width}
          height={height}
        />
      </Canvas>
    </div>
  );
}

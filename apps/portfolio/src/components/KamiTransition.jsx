import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { audio } from "../audio";

// The "kami" (paper) transition — a full, faithful port of the
// origami-portfolio reference's FoldTransition.tsx (same file, same repo
// this whole redesign is based on), not the earlier scoped-down
// reimplementation. That earlier version got the cascade *timing* formula
// right but not the *rendering*: a plain BufferGeometry with per-frame
// vertex-position rewrites has no way to shade a triangle as it tilts away
// from the camera, so a mid-fold flap only ever shrinks — no lighting cue —
// which is what actually read as "a wipe" rather than paper tearing, no
// matter how well-tuned the cascade math itself was.
//
// This version ports the reference's real technique: two InstancedMesh
// layers (one holding every still-settled triangle, one holding only
// whichever handful are currently mid-fold) sharing one base triangle
// geometry and one MeshBasicMaterial with a custom onBeforeCompile shader.
// The shader derives each instance's texture UV from a REST-position
// instanced attribute (so the snapshot stays pinned in place regardless of
// how that instance's own transform is currently rotating) and darkens a
// flap as its normal tips away from the camera — the actual "this is paper
// tilting in 3D" cue the old version was missing.
//
// Dropped from the reference on purpose (see the plan): the "reverse"
// direction (dead code even in the reference — a documented, unresolved
// hardware freeze bug) and the snapshot prewarm/cache layer
// (foldSnapshotCache.ts) — this app captures fresh per click, same as
// before, cheap enough at this frequency. Also dropped: the reference's
// multi-click concurrency bookkeeping (clickId/targetClickId maps letting a
// new transition interrupt one already mid-flight) — this app's own
// App.jsx already guards against that at the trigger site (a crane click is
// ignored while `leavingPage || kami` is set), so there's never more than
// one transition in flight to reconcile.
const ROWS = 45;
const COLS = 90;
// The orthographic camera's zoom (see the Canvas below) — also baked into
// the shader's UV formula and the click->world conversion, so it has to
// stay in sync across all three; kept as one named constant rather than the
// literal 15 repeated three times.
const CAM_ZOOM = 15;
// Matches the reference's own fixed TRI_BASE=3 exactly. Tried shrinking
// this to just barely cover the current viewport instead (less of the grid
// sitting permanently outside the camera frustum) on the theory that it
// would shorten the long tail before onSettled fires — measured directly,
// it made no difference (3.5-5s either way). That tail turns out to be
// bound by the BFS hop COUNT across the fixed 90x45 grid (every
// duration/stagger formula below depends only on hop depth, never on
// physical world distance), so shrinking the grid's physical size doesn't
// reduce how many hops a corner-to-corner cascade needs — it only shrinks
// how much of that already-fixed hop budget lands outside the viewport.
const TRI_BASE = 3;
const TRI_HEIGHT = TRI_BASE * (Math.sqrt(3) / 2);
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

function idOf(r, c, isUp) {
  return `${r},${c},${isUp}`;
}

// Builds the grid in world units sized by TRI_BASE above (viewport-fitted,
// not a large fixed constant) — the camera frames it from directly above,
// so as long as the grid's real-world extent comfortably exceeds whatever
// slice the camera can see, it fully covers the viewport regardless of
// exactly where the click lands.
function generateGrid() {
  const grid = {};
  const width = COLS * TRI_BASE;
  const height = ROWS * TRI_HEIGHT;
  const startX = -width / 2;
  const startY = height / 2;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const baseX = startX + c * TRI_BASE + (r % 2 === 0 ? 0 : TRI_BASE / 2);
      const baseY = startY - r * TRI_HEIGHT;

      let p1 = [baseX, baseY];
      let p2 = [baseX + TRI_BASE / 2, baseY - TRI_HEIGHT];
      let p3 = [baseX - TRI_BASE / 2, baseY - TRI_HEIGHT];
      let id = idOf(r, c, true);
      grid[id] = { id, r, c, isUp: true, p: [p1, p2, p3], center: [baseX, baseY - TRI_HEIGHT / 2] };

      p1 = [baseX, baseY];
      p2 = [baseX + TRI_BASE, baseY];
      p3 = [baseX + TRI_BASE / 2, baseY - TRI_HEIGHT];
      id = idOf(r, c, false);
      grid[id] = { id, r, c, isUp: false, p: [p1, p2, p3], center: [baseX + TRI_BASE / 2, baseY - TRI_HEIGHT / 2] };
    }
  }
  return grid;
}

// "up" triangles border the "down" triangle in the same cell (their shared
// right edge), the cell above, and the cell to the left; "down" mirrors
// that toward the cell below/right. Every pair returned here shares a real
// edge (needed for computeHinge below).
function getNeighbors(r, c, isUp) {
  if (isUp) {
    return [idOf(r, c, false), idOf(r, c - 1, false), idOf(r + 1, c + (r % 2 === 0 ? -1 : 0), false)];
  }
  return [idOf(r, c, true), idOf(r, c + 1, true), idOf(r - 1, c + (r % 2 === 0 ? 0 : 1), true)];
}

// Deterministic per-triangle pseudo-random value in [0,1), from its grid
// position — a fixed "personality" per triangle rather than pure per-hop
// randomness. Without this the cascade expands at (on average) the same
// rate in every direction, which reads as a suspiciously clean,
// radially-symmetric ring instead of an organic tear.
function triJitter(r, c) {
  const h = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function closeTo(a, b) {
  return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
}

// Finds the shared edge between a fold task's hinge-parent and child
// triangles — the axis a flap rotates around.
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

  const nonHinge = child.p.find((pt) => !closeTo(pt, s1) && !closeTo(pt, s2));
  const Vx = nonHinge[0] - hingeP1.x;
  const Vy = nonHinge[1] - hingeP1.y;
  if (axis.x * Vy - axis.y * Vx < 0) axis.negate();

  return { axis, hingeP1 };
}

// Computes the full BFS "earliest arrival" cascade schedule, once, up front
// — every triangle's start/end time and fold hinge, keyed off the click
// point. Returned array is sorted DESCENDING by startTime so the caller can
// pop ready tasks off the end cheaply instead of scanning the whole thing.
function buildSchedule(grid, clickPos) {
  const now = performance.now();

  let clickWorld = { x: 0, y: 0 };
  if (clickPos) {
    const ndcX = (clickPos.x / window.innerWidth) * 2 - 1;
    const ndcY = -(clickPos.y / window.innerHeight) * 2 + 1;
    clickWorld = {
      x: (ndcX * window.innerWidth) / (2 * CAM_ZOOM),
      y: (ndcY * window.innerHeight) / (2 * CAM_ZOOM),
    };
  }

  let centerId = null;
  let minDist = Infinity;
  for (const id in grid) {
    const [cx, cy] = grid[id].center;
    const d = (cx - clickWorld.x) ** 2 + (cy - clickWorld.y) ** 2;
    if (d < minDist) {
      minDist = d;
      centerId = id;
    }
  }
  // Re-pin to the actually-clicked TRIANGLE's own center (not the raw click
  // point) for hinge-direction purposes below — matches the reference.
  clickWorld = { x: grid[centerId].center[0], y: grid[centerId].center[1] };
  const clickDistOf = (tri) => (tri.center[0] - clickWorld.x) ** 2 + (tri.center[1] - clickWorld.y) ** 2;

  // The clicked triangle has no parent to hinge-fold from — it just
  // vanishes instantly (hinge: null), same as the reference.
  const scheduled = [{ id: centerId, startTime: now, endTime: now, hinge: null }];
  const bestArrival = new Map([[centerId, now]]);
  const queue = [{ id: centerId, arrival: now, depth: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.arrival - b.arrival);
    const { id, arrival, depth } = queue.shift();
    if (arrival > bestArrival.get(id)) continue;

    const currTri = grid[id];
    for (const nid of getNeighbors(currTri.r, currTri.c, currTri.isUp)) {
      const nTri = grid[nid];
      if (!nTri || bestArrival.has(nid)) continue;

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

      // Hinge on whichever neighbor of `nid` is actually closest to the
      // click point, not `id` (whichever BFS predecessor happened to win
      // the earliest-arrival race for this node) — ported verbatim from
      // the reference. Those two mostly agree when jitter is mild, but the
      // wide per-hop jitter above lets a "fast lane" path reach `nid`
      // through a neighbor that isn't actually the one nearer the click —
      // computeHinge still returns a geometrically valid hinge either way,
      // but the flap then visibly opens toward/across the click point
      // instead of away from it.
      let hingeParentId = id;
      let bestClickDist = Infinity;
      for (const hnid of getNeighbors(nTri.r, nTri.c, nTri.isUp)) {
        const hTri = grid[hnid];
        if (!hTri) continue;
        const d = clickDistOf(hTri);
        if (d < bestClickDist) {
          bestClickDist = d;
          hingeParentId = hnid;
        }
      }

      scheduled.push({ id: nid, startTime, endTime: startTime + duration, hinge: computeHinge(nid, hingeParentId, grid) });
    }
  }

  return scheduled.sort((a, b) => b.startTime - a.startTime);
}

// Scale every instance to 0 (fully invisible) — the safe default for a
// freshly-created InstancedMesh. Without this, a brand-new InstancedMesh
// defaults every instance to an identity matrix (no per-instance offset),
// so ALL of them would sit stacked on top of each other at the origin until
// the first transition's reset spreads them to their real positions.
function hideAllInstances(mesh, count) {
  const dummy = new THREE.Object3D();
  dummy.scale.set(0, 0, 0);
  dummy.updateMatrix();
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

// Scratch objects reused every frame so the animation never allocates.
const _tmpMatrix = new THREE.Matrix4();
const _tmpRotMatrix = new THREE.Matrix4();
const _tmpHingeInvMatrix = new THREE.Matrix4();
const _tmpZOffsetMatrix = new THREE.Matrix4();
const _tmpFlatObj = new THREE.Object3D();
const _tmpZeroScale = new THREE.Matrix4().makeScale(0, 0, 0);

// One base triangle (apex up, centered at its own local origin) shared by
// BOTH instancedMeshes below AND both triangle orientations — a "down"
// triangle is just this same local shape with a 180° Z rotation baked into
// its instance transform, not separate geometry. That's what lets 8100
// triangles of either orientation render as a single instanced draw call
// per mesh instead of one draw call each.
const baseGeom = new THREE.BufferGeometry();
baseGeom.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array([0, TRI_HEIGHT / 2, 0, -TRI_BASE / 2, -TRI_HEIGHT / 2, 0, TRI_BASE / 2, -TRI_HEIGHT / 2, 0]),
    3
  )
);
baseGeom.computeVertexNormals();

// A single material instance shared by every transition, ever, instead of a
// brand-new MeshBasicMaterial (with its own onBeforeCompile shader) per
// transition — recreating it every time would mean recompiling its shader
// (a real GPU-driver stall) on every single transition instead of once. A
// non-null PLACEHOLDER texture (not null) keeps USE_MAP permanently defined
// so the shader's #ifdef USE_MAP branch never toggles, which would force a
// recompile — tested directly, confirmed every fold rendering solid white
// otherwise (see git history). Only `.map`'s CONTENT changes per
// transition, never the material's shape.
const foldMaterial = new THREE.MeshBasicMaterial({ map: new THREE.Texture(), side: THREE.DoubleSide });
foldMaterial.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace(
    "#include <clipping_planes_pars_vertex>",
    `
    #include <clipping_planes_pars_vertex>
    attribute vec3 aRestCenter;
    varying float vFoldShade;
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <uv_vertex>",
    `
    #include <uv_vertex>

    #ifdef USE_MAP
      // aRestCenter.xy is this triangle's flat (unrotated) world center;
      // .z is +1 upright / -1 rotated 180° (a cheap stand-in for a real
      // rotation, since 180° about Z is exactly a sign flip on x/y). This
      // is the triangle's REST position — independent of whichever mesh
      // (settled or mid-fold) is currently drawing it, and independent of
      // that mesh's own instanceMatrix, which may be actively rotating.
      // The snapshot texture has to stay pinned to where the triangle
      // started, not swim around as it folds.
      vec2 restLocal = aRestCenter.z > 0.0 ? position.xy : -position.xy;
      vec2 restWorldPos = restLocal + aRestCenter.xy;
      // For an orthographic camera with zoom 15. Baked in as a literal at
      // compile time — customProgramCacheKey below (keyed on window size)
      // makes three treat a different window size as a different program
      // variant, so this re-bakes correctly after a resize.
      vMapUv = vec2((restWorldPos.x * ${CAM_ZOOM.toFixed(1)}) / ${window.innerWidth.toFixed(1)} + 0.5, (restWorldPos.y * ${CAM_ZOOM.toFixed(1)}) / ${window.innerHeight.toFixed(1)} + 0.5);
    #endif

    // The base triangle geometry is flat in local XY (normal is exactly
    // local +Z), so the instance matrix's own Z column IS the world-space
    // normal — no separate normal attribute needed. For a settled triangle
    // that column is always (0,0,±1), so this is always 1.0 there (no
    // shading change vs. the real page). A mid-fold flap's normal tips
    // away from the camera as it rotates, darkening — the cue (now that
    // the material is unlit) that it's actually folding rather than just
    // shrinking in place.
    vFoldShade = abs((instanceMatrix * vec4(0.0, 0.0, 1.0, 0.0)).z);
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <clipping_planes_pars_fragment>",
    `
    #include <clipping_planes_pars_fragment>
    varying float vFoldShade;
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `
    #include <map_fragment>
    diffuseColor.rgb *= mix(0.55, 1.0, vFoldShade);
    `
  );
};
// three's automatically-computed program cache key never accounts for the
// window-size literal baked into onBeforeCompile above (it only reflects
// material/light/instancing state) — without this, a resize would leave
// every future transition using whichever size was baked in the first time
// this material ever compiled. Keying the cache on window size makes three
// compile (and cache) a distinct program per size actually seen.
foldMaterial.customProgramCacheKey = () => `${window.innerWidth}x${window.innerHeight}`;

function KamiScene({ texture, clickPos, onSettled, onFirstFrame }) {
  const initialGrid = useMemo(() => generateGrid(), []);
  const ids = useMemo(() => Object.keys(initialGrid), [initialGrid]);
  const gridCount = ids.length;
  const indexOf = useMemo(() => Object.fromEntries(ids.map((id, i) => [id, i])), [ids]);

  // Every triangle's flat/rest position never changes and is identical
  // whichever mesh (settled or mid-fold) is currently drawing it — both
  // instancedMeshes below share this one geometry (position + aRestCenter),
  // with only their own independent instanceMatrix differing.
  useMemo(() => {
    const data = new Float32Array(ids.length * 3);
    ids.forEach((id, i) => {
      const tri = initialGrid[id];
      data[i * 3] = tri.center[0];
      data[i * 3 + 1] = tri.center[1];
      data[i * 3 + 2] = tri.isUp ? 1 : -1;
    });
    baseGeom.setAttribute("aRestCenter", new THREE.InstancedBufferAttribute(data, 3));
  }, [initialGrid, ids]);

  const meshRef = useRef(null);
  const flapMeshRef = useRef(null);
  const hasHiddenRef = useRef(false);

  // index -> { task, axis, hingeP1, zOffset }
  const activeRef = useRef(new Map());
  // Tasks not yet started, sorted DESCENDING by startTime. Empty whenever
  // nothing is scheduled (idle, between transitions).
  const pendingRef = useRef([]);
  const startedRef = useRef(false);
  const settledRef = useRef(false);
  // Which texture instance the refs above are currently scheduled for —
  // lets a persistently-mounted scene tell "a new transition just started"
  // apart from "still animating the same one".
  const currentTextureRef = useRef(null);

  useFrame(() => {
    if (!meshRef.current || !flapMeshRef.current) return;

    if (!hasHiddenRef.current) {
      hideAllInstances(meshRef.current, gridCount);
      hideAllInstances(flapMeshRef.current, gridCount);
      hasHiddenRef.current = true;
    }

    // New transition detection lives here, in the frame loop itself, rather
    // than a useEffect keyed on `texture`: react-three-fiber runs its own
    // render loop on its own schedule, separate from React-DOM's passive-
    // effect timing. A useEffect here previously raced with useFrame under
    // StrictMode's dev-only double-invoke, occasionally firing onSettled
    // after ~130ms instead of the real ~1-2s cascade.
    if (texture && currentTextureRef.current !== texture) {
      currentTextureRef.current = texture;
      foldMaterial.map = texture;
      foldMaterial.needsUpdate = true;

      // Reset: every triangle's settled instance back to fully visible
      // (covering the screen with the new snapshot), every flap instance
      // back to hidden — nothing is mid-fold yet at the start of a fresh
      // transition.
      const dummy = new THREE.Object3D();
      ids.forEach((id, i) => {
        const tri = initialGrid[id];
        dummy.position.set(tri.center[0], tri.center[1], 0);
        dummy.rotation.set(0, 0, tri.isUp ? 0 : Math.PI);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      hideAllInstances(flapMeshRef.current, gridCount);

      activeRef.current.clear();
      startedRef.current = false;
      settledRef.current = false;
      pendingRef.current = buildSchedule(initialGrid, clickPos);
      audio.playUnfold();
      onFirstFrame();
    }

    const now = performance.now();
    const pending = pendingRef.current;
    let meshChanged = false;

    while (pending.length && now >= pending[pending.length - 1].startTime) {
      const task = pending.pop();
      const idx = indexOf[task.id];
      if (idx === undefined) continue;

      // The settled triangle is folding away — hide it immediately; either
      // it has no hinge (the clicked triangle itself, which just vanishes)
      // or the flap mesh takes over drawing it mid-fold from here.
      meshRef.current.setMatrixAt(idx, _tmpZeroScale);
      meshChanged = true;

      if (task.hinge) {
        activeRef.current.set(idx, { task, axis: task.hinge.axis, hingeP1: task.hinge.hingeP1, zOffset: 0.01 + Math.random() * 0.02 });
      }
    }

    if (meshChanged) meshRef.current.instanceMatrix.needsUpdate = true;

    // Advance active flaps — one shared draw call for however many are
    // animating, instead of one mesh (and one draw call) per triangle.
    activeRef.current.forEach((flap, idx) => {
      const task = flap.task;
      let progress = (now - task.startTime) / (task.endTime - task.startTime);
      progress = Math.max(0, Math.min(1, progress));

      // Ease-in-out cubic, matching the reference's fold feel.
      const easeProgress = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      // Quarter turn (0 -> 90deg), not a full flip. Rotating a flat
      // triangle 180deg about an in-plane axis, viewed through an
      // orthographic camera, brings it back to its full original screen
      // footprint at progress=1 — stopping at the edge-on point instead
      // means the hard cut below lands exactly when the flap is already at
      // its smallest, barely-visible footprint.
      const currentAngle = easeProgress * (Math.PI / 2);

      if (progress >= 1) {
        activeRef.current.delete(idx);
        flapMeshRef.current.setMatrixAt(idx, _tmpZeroScale);
        return;
      }

      const tri = initialGrid[task.id];
      _tmpFlatObj.position.set(tri.center[0], tri.center[1], 0);
      _tmpFlatObj.rotation.set(0, 0, tri.isUp ? 0 : Math.PI);
      _tmpFlatObj.updateMatrix();

      _tmpMatrix.makeTranslation(flap.hingeP1.x, flap.hingeP1.y, flap.hingeP1.z);
      _tmpMatrix.multiply(_tmpRotMatrix.makeRotationAxis(flap.axis, currentAngle));
      _tmpMatrix.multiply(_tmpHingeInvMatrix.makeTranslation(-flap.hingeP1.x, -flap.hingeP1.y, -flap.hingeP1.z));
      _tmpMatrix.multiply(_tmpFlatObj.matrix);
      // z-offset to prevent z-fighting between concurrently-animating flaps.
      _tmpMatrix.premultiply(_tmpZOffsetMatrix.makeTranslation(0, 0, flap.zOffset));

      flapMeshRef.current.setMatrixAt(idx, _tmpMatrix);
    });

    flapMeshRef.current.instanceMatrix.needsUpdate = true;

    const idle = pending.length === 0 && activeRef.current.size === 0;
    if (!idle) startedRef.current = true;
    if (startedRef.current && idle && !settledRef.current) {
      settledRef.current = true;
      onSettled();
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <instancedMesh ref={meshRef} args={[baseGeom, foldMaterial, gridCount]} />
      <instancedMesh ref={flapMeshRef} args={[baseGeom, foldMaterial, gridCount]} />
    </group>
  );
}

export function KamiTransition({ active, texture, clickPos, onSettled }) {
  // Own state, not a ref: needs to trigger a re-render to swap the DOM
  // fallback out for the real canvas. Reset explicitly on every new texture
  // — this component and its Canvas stay permanently mounted across every
  // transition instead of one each (mounting/unmounting a WebGL context per
  // transition risked real browser context-loss stalls).
  const [firstFramePainted, setFirstFramePainted] = useState(false);
  useEffect(() => {
    if (texture) setFirstFramePainted(false);
  }, [texture]);

  return (
    <div
      id="kami-transition-container"
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ opacity: active ? 1 : 0, visibility: active ? "visible" : "hidden" }}
    >
      {/* Plain DOM stand-in for the gap between "texture ready" (synchronous
          with React's commit) and react-three-fiber's Canvas actually
          painting a frame — its own render loop, on its own schedule,
          separate from React-DOM's. Without this, the real destination
          page (already navigated to) shows through cleanly for that gap,
          then the stale snapshot suddenly pops in and the cascade starts
          playing catch-up. Same canvas the texture was built from, reused
          directly, removed the instant the real thing paints. */}
      {texture && !firstFramePainted && (
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
      {/* `flat` disables r3f's default ACES filmic tone mapping — this
          canvas displays a flat screenshot of real UI, and filmic tone
          mapping visibly darkened it relative to the actual page showing
          through everywhere the overlay hasn't covered yet. */}
      <Canvas
        flat
        camera={{ position: [0, 0, 150], zoom: CAM_ZOOM }}
        orthographic
        gl={{ alpha: true }}
        frameloop={active ? "always" : "never"}
        onCreated={({ gl, scene, camera }) => {
          // Force-compiles this scene's material's actual shader program
          // (normally deferred until its first real draw call — a
          // synchronous GPU-driver stall, tens to hundreds of ms) during
          // idle time, so it doesn't land on the first transition a
          // visitor ever triggers.
          const compile = () => gl.compile(scene, camera);
          if ("requestIdleCallback" in window) {
            window.requestIdleCallback(compile);
          } else {
            setTimeout(compile, 200);
          }
        }}
      >
        <KamiScene texture={texture} clickPos={clickPos} onSettled={onSettled} onFirstFrame={() => setFirstFramePainted(true)} />
      </Canvas>
    </div>
  );
}

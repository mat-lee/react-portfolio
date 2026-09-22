import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSpring, animated } from "@react-spring/three";
import { Crane3D } from "./Crane3D";
import { useAppContext } from "../AppContext";

function Particles({ isDark }) {
  const count = 2000;
  const mesh = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 20;
      const z = (Math.random() - 0.5) * 30 - 20;
      const vx = (Math.random() - 0.5) * 0.015;
      const vy = (Math.random() - 0.5) * 0.015;
      const vz = (Math.random() - 0.5) * 0.015;
      const scale = Math.random() * 0.8 + 0.2;
      temp.push({ x, y, z, vx, vy, vz, scale });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;

      if (particle.y > 20) particle.y = 0;
      else if (particle.y < 0) particle.y = 20;

      if (particle.x > 30) particle.x = -30;
      else if (particle.x < -30) particle.x = 30;

      if (particle.z > -5) particle.z = -35;
      else if (particle.z < -35) particle.z = -5;

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  // Ambient dust motes drifting behind the cranes. fog={false}: the fog's
  // `near` mostly sits closer than these particles, so leaving fog on faded
  // every light-mode attempt toward invisible regardless of base color.
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.012, 4, 4]} />
      <meshBasicMaterial
        color={isDark ? "#ffffff" : "#78716c"}
        transparent
        opacity={isDark ? 0.3 : 0.5}
        fog={false}
      />
    </instancedMesh>
  );
}

// A repeating dot-grid tile, drawn once onto a small canvas — cheap way to
// give the floor plane a visible surface instead of pure flat color, now
// that two grounded cranes actually rest on it.
function useGroundDotsTexture(isDark) {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.35)";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 1.0, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(70, 70); // ~1.4 world-unit spacing across the 100x100 floor
    return tex;
  }, [isDark]);
}

function SceneLightingAndFloor({ isDark }) {
  const dotsTexture = useGroundDotsTexture(isDark);
  const spring = useSpring({
    ambientIntensity: isDark ? 0.2 : 0.7,
    hemiIntensity: isDark ? 0.4 : 0.8,
    dirIntensity: isDark ? 0.3 : 0.5,
    fogColor: isDark ? "#020514" : "#F3F6F9",
    hemiGroundColor: isDark ? "#000000" : "#d1d5db",
    hemiColor: isDark ? "#020514" : "#ffffff",
    shadowOpacity: isDark ? 0 : 0.05,
    config: { tension: 60, friction: 20 },
  });

  return (
    <>
      <animated.fog attach="fog" args={[spring.fogColor, 10, 25]} />
      <animated.ambientLight intensity={spring.ambientIntensity} />
      <animated.hemisphereLight
        groundColor={spring.hemiGroundColor}
        color={spring.hemiColor}
        intensity={spring.hemiIntensity}
      />

      <animated.directionalLight
        position={[0, 10, 0.1]}
        intensity={spring.dirIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-radius={20}
      />

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <animated.shadowMaterial transparent opacity={spring.shadowOpacity} />
      </mesh>
      {/* Just above the shadow plane to avoid z-fighting. */}
      <mesh position={[0, -0.495, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial map={dotsTexture} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  );
}

export function Scene3D({ visible, leavingPage, onCraneClick }) {
  const { theme, isTransitioningTheme } = useAppContext();
  const isDark = theme === "dark";

  // Stays permanently mounted across route changes (see App.jsx) so the
  // cranes read as one continuous world instead of a per-page hero. CSS
  // opacity (not display:none, which would collapse r3f's measured
  // container to 0x0) plus frameloop 'never' while hidden keeps an
  // invisible scene from paying every-frame cost.
  return (
    <div
      id="scene3d-canvas-root"
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden" }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 12], fov: 32, rotation: [-0.16, 0, 0] }}
        frameloop={visible ? "always" : "never"}
        // Needed to read this canvas's pixels for the kami transition's
        // snapshot when leaving Home (see lib/domSnapshot.js) — without it
        // the browser is free to clear the drawing buffer right after
        // compositing, and toDataURL()/drawImage() on it reads back blank.
        gl={{ preserveDrawingBuffer: true }}
      >
        <SceneLightingAndFloor isDark={isDark} />

        {!isTransitioningTheme && <Particles isDark={isDark} />}

        {/* GLTF loading (useGLTF, in Crane3D) suspends — Canvas doesn't add
            a Suspense boundary on its own. */}
        <Suspense fallback={null}>
        <group>
          {/* Evenly spaced and centered on 0, a wider 2.0-unit step (was
              1.85) and lower (~0.6 units) than the original 5-crane row —
              with only four left in this row now (Contact/Simple Version
              moved out, see below), the old spacing/height left too much
              empty space above and to the sides. A 2.3-unit step was tried
              first and clipped the outer two cranes at 1280px wide. */}
          <Crane3D
            position={[-3.0, 1.1, -0.5]}
            initialRotation={[0, 1.2, 0.02]}
            color="#ef4444"
            label="Projects"
            delay={0.36}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={(pos) => onCraneClick("/projects", pos)}
          />
          <Crane3D
            position={[-1.0, 1.5, -2.0]}
            initialRotation={[0, -1.8, -0.01]}
            color="#10b981"
            label="Publications"
            delay={0.4}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={(pos) => onCraneClick("/publications", pos)}
          />
          <Crane3D
            position={[1.0, 0.9, -1.0]}
            initialRotation={[0, 0.6, 0.02]}
            color="#3b82f6"
            label="Labs"
            delay={0.44}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={(pos) => onCraneClick("/labs", pos)}
          />
          <Crane3D
            position={[3.0, 1.3, -0.5]}
            initialRotation={[0, 2.5, 0]}
            color="#f59e0b"
            label="About Me"
            delay={0.48}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={(pos) => onCraneClick("/about", pos)}
          />
          {/* Simple Version and Contact used to be grounded 3D objects here
              (a crane + a procedural paper airplane) — shelved for now in
              favor of plain clickable text (see App.jsx's corner buttons);
              Crane3D's `grounded`/`variant`/`scale` props stay available to
              revive that idea later. */}
        </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

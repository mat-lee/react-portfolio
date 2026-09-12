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

function SceneLightingAndFloor({ isDark }) {
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
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden" }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 12], fov: 32, rotation: [-0.1, 0, 0] }}
        frameloop={visible ? "always" : "never"}
      >
        <SceneLightingAndFloor isDark={isDark} />

        {!isTransitioningTheme && <Particles isDark={isDark} />}

        {/* GLTF loading (useGLTF, in Crane3D) suspends — Canvas doesn't add
            a Suspense boundary on its own. */}
        <Suspense fallback={null}>
        <group>
          <Crane3D
            position={[-2.4, 1.7, -0.5]}
            initialRotation={[0, 1.2, 0.02]}
            color="#ef4444"
            label="Projects"
            delay={0.4}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={() => onCraneClick("/projects")}
          />
          <Crane3D
            position={[0, 1.4, -1.5]}
            initialRotation={[0, 2.5, 0]}
            color="#f59e0b"
            label="About Me"
            delay={0.44}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={() => onCraneClick("/about")}
          />
          <Crane3D
            position={[2.4, 1.9, -0.5]}
            initialRotation={[0, -1.0, 0.03]}
            color="#3b82f6"
            label="Contact"
            delay={0.48}
            isLeaving={leavingPage !== null}
            visible={visible}
            onClick={() => onCraneClick("/contact")}
          />
        </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

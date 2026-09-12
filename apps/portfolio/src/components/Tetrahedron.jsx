import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// A real, tiny r3f scene per icon — matches the cranes' faceted-paper look
// (flat-shaded, no smoothing) instead of a hand-derived CSS 3D construction.
function SpinningTetra({ color }) {
  const meshRef = useRef(null);
  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    // Different rates on two axes — tumbles rather than spinning around one
    // straight axis.
    meshRef.current.rotation.x += delta * 0.9;
    meshRef.current.rotation.y += delta * 1.3;
  });

  return (
    <mesh ref={meshRef} rotation={[0.4, 0.6, 0]}>
      <tetrahedronGeometry args={[0.75]} />
      {/* flatShading: only 4 faces — smooth-shading across so few, large
          facets would look wrong. Matches the faceted, folded-paper look
          used elsewhere. */}
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

export function Tetrahedron({ color, size = 20 }) {
  return (
    <div className="mr-4 shrink-0" style={{ width: size, height: size }}>
      {/* Tightened near/far to the geometry's actual camera-space range
          (camera at 2.2, geometry radius 0.75) — the default 0.1/1000
          starves z-buffer precision right where the tetrahedron's own faces
          meet, causing z-fighting on real hardware at some rotation angles. */}
      <Canvas camera={{ position: [0, 0, 2.2], fov: 40, near: 1, far: 4 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 2, 3]} intensity={1.4} />
        <directionalLight position={[-1.5, -1, -2]} intensity={0.3} />
        <SpinningTetra color={color} />
      </Canvas>
    </div>
  );
}

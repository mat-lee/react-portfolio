import { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { Html, useGLTF } from "@react-three/drei";
import { audio } from "../audio";
import { useAppContext } from "../AppContext";

export function Crane3D({
  position,
  initialRotation = [0, 0, 0],
  color,
  label,
  onClick,
  isLeaving,
  visible,
  delay = 0,
}) {
  const groupRef = useRef(null);
  const innerGroupRef = useRef(null);
  const stringRef = useRef(null);
  const anchorRef = useRef(null);
  const [interactionState, setInteractionState] = useState("idle");
  const leavingTriggered = useRef(false);
  const localTimeRef = useRef(0);
  const isInitialized = useRef(false);
  // One-shot flag feeding useSpring's `reset` below, so the drop-in entrance
  // animation replays each time this crane returns to view (Scene3D stays
  // permanently mounted, so a fresh mount can't supply this for free).
  // Self-clears the same render it's read.
  const [replayEntrance, setReplayEntrance] = useState(false);
  useEffect(() => {
    if (replayEntrance) setReplayEntrance(false);
  }, [replayEntrance]);

  // Procedural paper bump map — a dense speckled noise for a construction
  // paper look, instead of an image texture.
  const paperTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const { scene } = useGLTF("/3d_origami_crane.glb");

  // `color` is a hex string (see Scene3D's crane list) — no name-to-hex
  // indirection needed for a fixed, small set of cranes.
  const hexColor = color;

  const baseColorObj = useMemo(() => new THREE.Color(hexColor), [hexColor]);
  const hoverColorObj = useMemo(
    () => new THREE.Color(hexColor).lerp(new THREE.Color("#ffffff"), 0.25),
    [hexColor]
  );

  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((node) => {
      if (node.isMesh) {
        // Hide the baked shadow plane that comes with the Sketchfab model
        if (node.name === "Object_4" || node.material?.name === "Sombra") {
          node.visible = false;
          return;
        }

        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new THREE.MeshStandardMaterial({
          color: hexColor,
          roughness: 1.0,
          metalness: 0.0,
          bumpMap: paperTexture,
          bumpScale: 0.015,
          side: THREE.DoubleSide,
        });
      }
    });
    return cloned;
  }, [scene, hexColor, paperTexture]);

  const isHovered = interactionState === "hovered";
  const isPressed = interactionState === "pressed";
  const isClickedCrane = useRef(false);
  const isReleased = interactionState === "releasing" || interactionState === "exiting";

  const { springY, springRotX, springRotZ } = useSpring({
    from: { springY: 30 },
    springY: isReleased ? 30 : isPressed ? -1 : 0,
    springRotX: isPressed ? -0.2 : 0,
    springRotZ: isPressed ? (Math.random() - 0.5) * 0.2 : 0,
    reset: replayEntrance,
    config: {
      mass: 1,
      tension: isReleased ? 50 : isPressed ? 300 : 256,
      friction: isReleased ? 14 : isPressed ? 15 : 32,
    },
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (interactionState !== "idle") return;
    setInteractionState("hovered");
    document.body.style.cursor = "pointer";
    audio.playShimmer();
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    if (interactionState === "hovered" || interactionState === "pressed") {
      setInteractionState("idle");
      document.body.style.cursor = "auto";
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (interactionState === "releasing" || interactionState === "exiting" || isLeaving) return;
    setInteractionState("pressed");
    audio.playTug();
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    if (interactionState !== "pressed") return;
    isClickedCrane.current = true;
    setInteractionState("releasing");
    document.body.style.cursor = "auto";
    audio.playFly();
    onClick({ x: e.clientX, y: e.clientY });
  };

  useFrame((_state, delta) => {
    if (!innerGroupRef.current || !groupRef.current) return;

    const targetColor = isHovered ? hoverColorObj : baseColorObj;
    clonedScene.traverse((node) => {
      if (node.isMesh && node.material?.color) {
        node.material.color.lerp(targetColor, 0.1);
      }
    });

    if (interactionState === "idle" || interactionState === "hovered") {
      if (!isHovered) {
        localTimeRef.current += delta;
      }

      const t = localTimeRef.current;
      const offset = position[0] * 2.5;

      const targetBob = isHovered ? 0.3 : Math.sin(t * 1.2 + offset) * 0.08;
      const targetSwingX = Math.sin(t * 0.5 + offset) * 0.15;
      const targetSwingZ = Math.cos(t * 0.4 + offset) * 0.1;
      const targetRotY = Math.sin(t * 0.3 + offset) * 0.8;
      const targetRotZ = Math.sin(t * 0.9 + offset) * 0.04 - targetSwingX * 0.2;
      const targetRotX = targetSwingZ * 0.2;

      const lerpFactor = 0.05;
      const liftLerpFactor = 0.1;

      if (!isInitialized.current) {
        innerGroupRef.current.position.y = targetBob;
        innerGroupRef.current.position.x = targetSwingX;
        innerGroupRef.current.position.z = targetSwingZ;
        innerGroupRef.current.rotation.y = targetRotY;
        innerGroupRef.current.rotation.z = targetRotZ;
        innerGroupRef.current.rotation.x = targetRotX;
        isInitialized.current = true;
      } else {
        innerGroupRef.current.position.y += (targetBob - innerGroupRef.current.position.y) * liftLerpFactor;
        innerGroupRef.current.position.x += (targetSwingX - innerGroupRef.current.position.x) * lerpFactor;
        innerGroupRef.current.position.z += (targetSwingZ - innerGroupRef.current.position.z) * lerpFactor;
        innerGroupRef.current.rotation.y += (targetRotY - innerGroupRef.current.rotation.y) * lerpFactor;
        innerGroupRef.current.rotation.z += (targetRotZ - innerGroupRef.current.rotation.z) * lerpFactor;
        innerGroupRef.current.rotation.x += (targetRotX - innerGroupRef.current.rotation.x) * lerpFactor;
      }
    } else {
      innerGroupRef.current.position.y = 0;
      innerGroupRef.current.position.x = 0;
      innerGroupRef.current.position.z = 0;
      innerGroupRef.current.rotation.z = 0;
      innerGroupRef.current.rotation.x = 0;
    }

    if (isReleased || (isLeaving && leavingTriggered.current)) {
      innerGroupRef.current.rotation.y += 0.1;
    }

    // String rendered fresh every frame, mathematically anchored to a fixed
    // world point above — stays taut through every bob/swing/press.
    if (stringRef.current && anchorRef.current) {
      anchorRef.current.updateWorldMatrix(true, false);

      // Crane is wrapped in a scale={[1.24, 1.24, 1.24]} group, so its
      // actual resting position in world space is position * 1.24.
      const topAnchorWorld = new THREE.Vector3(position[0] * 1.24, 12, position[2] * 1.24);
      const topAnchorLocal = anchorRef.current.worldToLocal(topAnchorWorld);

      const positions = stringRef.current.geometry.attributes.position.array;
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      positions[3] = topAnchorLocal.x;
      positions[4] = topAnchorLocal.y;
      positions[5] = topAnchorLocal.z;

      stringRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  useEffect(() => {
    if (isLeaving && !isClickedCrane.current && !leavingTriggered.current) {
      const timeoutId = setTimeout(() => {
        leavingTriggered.current = true;
        setInteractionState("exiting");
        audio.playFly();
      }, delay * 1000);
      return () => clearTimeout(timeoutId);
    } else if (!isLeaving) {
      leavingTriggered.current = false;
      isClickedCrane.current = false;
      setInteractionState("idle");
      isInitialized.current = false;
      localTimeRef.current = 0;
    }
  }, [isLeaving, delay]);

  // Plays the one-shot drop-in spring exactly when the scene is about to be
  // shown. useLayoutEffect (not useEffect) so `reset` is already true before
  // r3f's frameloop can resume and render its first frame.
  useLayoutEffect(() => {
    if (visible) setReplayEntrance(true);
  }, [visible]);

  const { theme } = useAppContext();
  const isDark = theme === "dark";

  return (
    <group scale={[1.24, 1.24, 1.24]}>
      {/* Static hitbox for stable interactions, decoupled from the crane's
          own constantly-swinging/bobbing transform. */}
      <mesh
        position={[position[0], position[1] - 0.2, position[2]]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <boxGeometry args={[1.8, 2.2, 1.8]} />
      </mesh>

      <animated.group
        ref={groupRef}
        position={position}
        rotation={initialRotation}
        position-y={springY.to((y) => position[1] + y)}
        rotation-x={springRotX.to((x) => initialRotation[0] + x)}
        rotation-z={springRotZ.to((z) => initialRotation[2] + z)}
      >
        <group ref={innerGroupRef}>
          <group position={[0, -0.3, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.8, 0.8, 0.8]}>
            <primitive object={clonedScene} />
          </group>
          <object3D ref={anchorRef} position={[0, 0.1, 0]}>
            <line ref={stringRef}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array(6)}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={isDark ? "#4b5563" : "#9ca3af"}
                transparent
                opacity={isDark ? 0.3 : 0.4}
              />
            </line>
          </object3D>
        </group>

        <Html position={[0, -1.0, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
          <div
            className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.25em] whitespace-nowrap pointer-events-none transition-all duration-300 text-gray-800 dark:text-gray-100"
            style={{
              opacity: isReleased ? 0 : isHovered ? 1 : 0.85,
              transform: isHovered ? "scale(1.05)" : "scale(1)",
              textShadow: isDark ? "0px 2px 4px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {label}
          </div>
        </Html>
      </animated.group>
    </group>
  );
}

useGLTF.preload("/3d_origami_crane.glb");

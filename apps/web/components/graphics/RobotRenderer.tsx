"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface RobotRendererProps {
  objPath: string;
  className?: string;
}

function applyFallbackMaterial(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.4,
        metalness: 0.2,
      });
    }
  });
}

function centerAndFrameModel(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxDim) || maxDim <= 0) {
    return;
  }

  object.position.sub(center);

  const fitOffset = 1.4;
  const fovRadians = (camera.fov * Math.PI) / 180;
  const distance = fitOffset * (maxDim / 2 / Math.tan(fovRadians / 2));

  camera.position.set(distance * 0.6, distance * 0.45, distance);
  camera.near = Math.max(distance / 1000, 0.1);
  camera.far = distance * 1000;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.update();
}

export default function RobotRenderer({
  objPath,
  className,
}: RobotRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animationId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const resize = () => {
      if (cancelled) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      if (cancelled) return;

      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setStatus("loading");
    setErrorMessage(null);

    const loader = new OBJLoader();
    loader.load(
      objPath,
      (object) => {
        if (cancelled) return;

        applyFallbackMaterial(object);
        centerAndFrameModel(camera, controls, object);
        scene.add(object);
        renderer.render(scene, camera);
        setStatus("ready");
      },
      undefined,
      (error) => {
        if (cancelled) return;

        console.error("An error occurred loading the OBJ model:", error);
        setErrorMessage("Could not load 3D model.");
        setStatus("error");
      },
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [objPath]);

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "relative h-[500px] w-full overflow-hidden rounded-xl border border-zinc-800"
      }
    >
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 text-sm text-slate-400">
          Loading 3D model…
        </div>
      )}
      {status === "error" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 text-sm text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Three.js Procedural Point Sprites Particle System
 * 
 * Adapted from official Three.js r186 example:
 * https://github.com/mrdoob/three.js/blob/r186/examples/webgl_points_sprites.html
 * 
 * Strict Gating:
 * - Dynamic import only (never bundled into main chunk)
 * - Skips entirely if reduced motion is requested (OS or in-app)
 * - Skips on low-power devices (concurrency <= 4, touch coarse pointer)
 * - Frame-time probe: falls back if frame time exceeds 24ms
 * - Zero external assets: procedural 2D canvas sprite
 * - Immediate full disposal of geometry, material, texture, renderer
 */

import { motionOK, isLowPowerDevice, isWebGLAvailable } from "./motion";

let performanceDegraded = false;

/**
 * Checks whether Three.js GPU particle effects are allowed to play.
 */
export function canRunThreeEffects(): boolean {
  if (performanceDegraded) return false;
  if (!motionOK()) return false;
  if (isLowPowerDevice()) return false;
  if (!isWebGLAvailable()) return false;
  return true;
}

/**
 * Generates an in-memory soft glowing radial circular sprite texture.
 */
function createProceduralSprite(THREE: typeof import("three")): import("three").Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export interface ParticleBurstOptions {
  container: HTMLElement;
  count?: number;
  accentColors?: string[];
  durationMs?: number;
  originX?: number; // Normalized 0-1 or pixel offset
  originY?: number;
  radiusScale?: number;
}

/**
 * Plays a one-shot WebGL point sprite particle burst.
 */
export async function playThreeParticleBurst(options: ParticleBurstOptions): Promise<boolean> {
  if (!canRunThreeEffects()) return false;

  const {
    container,
    count = 60,
    accentColors = ["#AFF65B", "#F2D500", "#F4F4F4"],
    durationMs = 700,
  } = options;

  let THREE: typeof import("three");
  try {
    THREE = await import("three");
  } catch {
    return false;
  }

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;
  if (width < 10 || height < 10) return false;

  // Create overlay canvas
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "30";
  container.appendChild(canvas);

  let renderer: import("three").WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
  } catch {
    container.removeChild(canvas);
    return false;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    0.1,
    100
  );
  camera.position.z = 10;

  const spriteTexture = createProceduralSprite(THREE);

  // Parse accent colors into THREE.Color
  const palette = accentColors.map((hex) => new THREE.Color(hex));

  // Build point particle attributes
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities: { x: number; y: number; z: number; decay: number }[] = [];

  const originX = options.originX ?? 0;
  const originY = options.originY ?? 0;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = originX;
    positions[i * 3 + 1] = originY;
    positions[i * 3 + 2] = 0;

    const chosenColor = palette[i % palette.length];
    colors[i * 3] = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;

    // Spherical / 2D radial distribution
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.8 + Math.random() * 2.2) * (options.radiusScale || 1.8);
    velocities.push({
      x: Math.cos(angle) * speed * 2.5,
      y: Math.sin(angle) * speed * 2.5 + 0.5,
      z: (Math.random() - 0.5) * 1.5,
      decay: 0.94 + Math.random() * 0.04,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 20,
    map: spriteTexture,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true,
    opacity: 1,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let animationFrameId = 0;
  const startTime = performance.now();
  let frameCount = 0;
  let frameTimeSum = 0;
  let lastFrameTime = startTime;

  return new Promise<boolean>((resolve) => {
    function cleanup() {
      cancelAnimationFrame(animationFrameId);
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      spriteTexture.dispose();
      renderer.dispose();
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      resolve(true);
    }

    function renderFrame(now: number) {
      if (document.hidden) {
        // Pause while tab is hidden
        animationFrameId = requestAnimationFrame(renderFrame);
        return;
      }

      // Frame time probe (fallback gate)
      const delta = now - lastFrameTime;
      lastFrameTime = now;
      if (frameCount < 10) {
        frameTimeSum += delta;
        frameCount++;
        if (frameCount === 10 && frameTimeSum / 10 > 24) {
          performanceDegraded = true;
          cleanup();
          return;
        }
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Fade out towards end
      material.opacity = Math.max(0, 1 - Math.pow(progress, 1.8));

      // Update positions
      const posAttr = geometry.attributes.position as import("three").BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const vel = velocities[i];
        arr[i * 3] += vel.x;
        arr[i * 3 + 1] += vel.y;
        arr[i * 3 + 2] += vel.z;

        // Apply drag & subtle gravity
        vel.x *= vel.decay;
        vel.y = (vel.y - 0.08) * vel.decay;
        vel.z *= vel.decay;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(renderFrame);
      } else {
        cleanup();
      }
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  });
}

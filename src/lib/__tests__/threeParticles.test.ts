import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { canRunThreeEffects, playThreeParticleBurst } from "../threeParticles";

describe("threeParticles.ts - Three.js Particle System Guardrails", () => {
  let storageState: Record<string, string> = {};

  beforeEach(() => {
    storageState = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => storageState[k] ?? null,
      setItem: (k: string, v: string) => { storageState[k] = v; },
      removeItem: (k: string) => { delete storageState[k]; },
      clear: () => { storageState = {}; },
    };

    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      WebGLRenderingContext: function () {},
      devicePixelRatio: 1,
    };

    (globalThis as any).document = {
      querySelector: vi.fn().mockReturnValue(null),
      documentElement: { classList: { contains: () => false } },
      body: { classList: { contains: () => false } },
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === "canvas") {
          return {
            getContext: vi.fn().mockReturnValue({
              createRadialGradient: vi.fn().mockReturnValue({
                addColorStop: vi.fn(),
              }),
              fillRect: vi.fn(),
            }),
            style: {},
          };
        }
        return { style: {} };
      }),
    };

    Object.defineProperty(globalThis, "navigator", {
      value: { hardwareConcurrency: 8 },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  it("permits Three.js effects on high-power WebGL-capable devices with motion allowed", () => {
    expect(canRunThreeEffects()).toBe(true);
  });

  it("blocks Three.js effects when reduced motion is preferred", () => {
    (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
    }));
    expect(canRunThreeEffects()).toBe(false);
  });

  it("blocks Three.js effects on low power devices", () => {
    (globalThis as any).navigator.hardwareConcurrency = 4;
    expect(canRunThreeEffects()).toBe(false);
  });

  it("gracefully declines to play burst when container dimensions are zero or invalid", async () => {
    const mockContainer = {
      clientWidth: 0,
      clientHeight: 0,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as any;

    const result = await playThreeParticleBurst({
      container: mockContainer,
    });

    expect(result).toBe(false);
  });
});

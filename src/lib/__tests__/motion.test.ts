import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isReducedMotionPreferred,
  motionOK,
  getInAppReducedMotion,
  isLowPowerDevice,
  isWebGLAvailable,
} from "../motion";

describe("motion.ts - Reduced Motion Audit & Safety Base", () => {
  const PREFS_KEY = "chaturanga-preferences-v1";
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
    };

    (globalThis as any).document = {
      querySelector: vi.fn().mockReturnValue(null),
      documentElement: { classList: { contains: () => false } },
      body: { classList: { contains: () => false } },
      createElement: vi.fn().mockReturnValue({
        getContext: vi.fn().mockReturnValue({}),
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

  it("defaults to motionOK() = true when no reduced motion requested", () => {
    expect(isReducedMotionPreferred()).toBe(false);
    expect(motionOK()).toBe(true);
  });

  it("returns motionOK() = false when OS media query prefers reduced motion", () => {
    (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    expect(isReducedMotionPreferred()).toBe(true);
    expect(motionOK()).toBe(false);
  });

  it("returns motionOK() = false when in-app preference motion: true is set", () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ motion: true }));
    expect(getInAppReducedMotion()).toBe(true);
    expect(isReducedMotionPreferred()).toBe(true);
    expect(motionOK()).toBe(false);
  });

  it("honors .reduce-motion CSS class on DOM", () => {
    (globalThis as any).document.querySelector = vi.fn().mockImplementation((sel) => {
      if (sel === ".reduce-motion") return {};
      return null;
    });

    expect(getInAppReducedMotion()).toBe(true);
    expect(motionOK()).toBe(false);
  });

  it("detects low power devices with low concurrency or coarse pointer", () => {
    (globalThis as any).navigator.hardwareConcurrency = 2;
    expect(isLowPowerDevice()).toBe(true);

    (globalThis as any).navigator.hardwareConcurrency = 8;
    (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(pointer: coarse)",
      media: query,
    }));
    expect(isLowPowerDevice()).toBe(true);
  });

  it("verifies safe WebGL check", () => {
    expect(isWebGLAvailable()).toBe(true);
  });
});

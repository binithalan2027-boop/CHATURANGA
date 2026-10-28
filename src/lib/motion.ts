import { useEffect, useState } from "react";

const PREFS_KEY = "chaturanga-preferences-v1";

/**
 * Checks whether the in-app preference asks for reduced motion.
 * In Chaturanga preferences, `prefs.motion === true` means "Reduced motion" is enabled.
 */
export function getInAppReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.motion === "boolean") {
        return parsed.motion;
      }
    }
  } catch {}

  // Check DOM class set by PreferenceProvider
  if (typeof document !== "undefined") {
    if (
      document.querySelector(".reduce-motion") !== null ||
      document.documentElement.classList.contains("reduce-motion") ||
      document.body.classList.contains("reduce-motion")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if EITHER the OS media query OR the in-app preference
 * requests reduced motion.
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined") return false;

  // 1. OS-level media query
  try {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return true;
    }
  } catch {}

  // 2. In-app user preference setting
  return getInAppReducedMotion();
}

/**
 * Safety check: returns true only when animations are allowed to play.
 * Returns false if reduced motion is preferred by OS or in-app setting.
 */
export function motionOK(): boolean {
  return !isReducedMotionPreferred();
}

/**
 * React hook that returns true if reduced motion is requested,
 * reacting dynamically to OS media query changes and storage updates.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => isReducedMotionPreferred());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      setReduced(isReducedMotionPreferred());
    };

    // Watch OS media query
    let mql: MediaQueryList | null = null;
    try {
      if (typeof window.matchMedia === "function") {
        mql = window.matchMedia("(prefers-reduced-motion: reduce)");
        mql.addEventListener("change", update);
      }
    } catch {}

    // Watch localStorage changes
    window.addEventListener("storage", update);

    // Watch DOM mutation for class changes on .product-shell
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });

    return () => {
      if (mql) {
        try {
          mql.removeEventListener("change", update);
        } catch {}
      }
      window.removeEventListener("storage", update);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

/**
 * Checks for low-power or mobile environments to apply lightweight fallbacks:
 * - hardwareConcurrency <= 4
 * - coarse pointer (mobile / tablet touch)
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  try {
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      return true;
    }
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Safe WebGL support check for Step 4 gating.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

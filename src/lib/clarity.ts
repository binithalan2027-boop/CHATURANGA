/**
 * Microsoft Clarity Analytics Integration
 * Free heatmap and session recording tool.
 * Requires VITE_CLARITY_PROJECT_ID in environment variables.
 * https://clarity.microsoft.com
 */

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function initClarity(projectId?: string): boolean {
  const id = projectId || import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (!id || typeof window === "undefined" || window.clarity) {
    return false;
  }

  try {
    /* eslint-disable */
    (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
    /* eslint-enable */

    return true;
  } catch (err) {
    console.warn("Clarity initialization failed:", err);
    return false;
  }
}

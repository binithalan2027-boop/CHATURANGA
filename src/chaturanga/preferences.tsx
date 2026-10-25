import ZenModeToggle from "./ZenModeToggle";
import RematchSettings from "./RematchSettings";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
export interface Preferences {
  theme: "dark" | "light";
  board: "teak" | "sage" | "slate" | "contrast";
  pieces: "classic" | "solid";
  hideRatings: boolean;
  autoDeclineRematch: boolean;
  puzzleAutoAdvance: boolean;
  sound: boolean;
  motion: boolean;
  coordinates: boolean;
  legalDots: boolean;
  lastMove: boolean;
  input: "both" | "click" | "drag";
}
const defaults: Preferences = {
  theme: "dark",
  board: "sage",
  pieces: "classic",
  hideRatings: false,
  autoDeclineRematch: false,
  puzzleAutoAdvance: false,
  sound: false,
  motion: false,
  coordinates: true,
  legalDots: true,
  lastMove: true,
  input: "both",
};
const Context = createContext<{
  prefs: Preferences;
  update: (p: Partial<Preferences>) => void;
  open: () => void;
}>({ prefs: defaults, update: () => {}, open: () => {} });
export const usePreferences = () => useContext(Context);
export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return {
        ...defaults,
        ...JSON.parse(
          localStorage.getItem("chaturanga-preferences-v1") || "{}",
        ),
      };
    } catch {
      return defaults;
    }
  });
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    localStorage.setItem("chaturanga-preferences-v1", JSON.stringify(prefs));
    document.documentElement.dataset.appearance = prefs.theme;
  }, [prefs]);
  const update = (p: Partial<Preferences>) => setPrefs((s) => ({ ...s, ...p }));
  return (
    <Context.Provider value={{ prefs, update, open: () => setVisible(true) }}>
      <div
        className={`product-shell appearance-${prefs.theme} board-${prefs.board} pieces-${prefs.pieces} ${prefs.motion ? "reduce-motion" : ""}`}
      >
        {children}
        {visible && (
          <div className="court-overlay" onClick={() => setVisible(false)}>
            <section
              className="courtyard settings-dialog court-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Board and play settings"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setVisible(false);
                if (e.key === "Tab") {
                  const nodes = Array.from(
                    e.currentTarget.querySelectorAll<HTMLElement>(
                      "button,input,select",
                    ),
                  );
                  const first = nodes[0],
                    last = nodes[nodes.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }
              }}
            >
              <div className="settings-title">
                <h2>Make the board yours.</h2>
                <button
                  autoFocus
                  onClick={() => setVisible(false)}
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>
              <p>Saved on this device. No account required.</p>
              <div className="settings-grid">
                <label>
                  Appearance
                  <select
                    aria-label="Appearance"
                    value={prefs.theme}
                    onChange={(e) =>
                      update({ theme: e.target.value as Preferences["theme"] })
                    }
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </label>
                <label>
                  Board
                  <select
                    aria-label="Board"
                    value={prefs.board}
                    onChange={(e) =>
                      update({ board: e.target.value as Preferences["board"] })
                    }
                  >
                    <option value="sage">Courtyard sage</option>
                    <option value="teak">Warm teak</option>
                    <option value="slate">Slate blue</option>
                    <option value="contrast">High contrast</option>
                  </select>
                </label>
                <label>
                  Pieces
                  <select
                    aria-label="Pieces"
                    value={prefs.pieces}
                    onChange={(e) =>
                      update({
                        pieces: e.target.value as Preferences["pieces"],
                      })
                    }
                  >
                    <option value="classic">Classic outline</option>
                    <option value="solid">Solid silhouettes</option>
                  </select>
                </label>
                <label>
                  Move input
                  <select
                    aria-label="Move input"
                    value={prefs.input}
                    onChange={(e) =>
                      update({ input: e.target.value as Preferences["input"] })
                    }
                  >
                    <option value="both">Click and drag</option>
                    <option value="click">Click only</option>
                    <option value="drag">Drag only</option>
                  </select>
                </label>
              </div>
              <div className="settings-toggles">
                <ZenModeToggle />
                <RematchSettings />
                {(
                  [
                    [
                      "puzzleAutoAdvance",
                      "Auto-advance untimed puzzles after solving",
                    ],
                    ["sound", "Move sounds"],
                    ["motion", "Reduced motion"],
                    ["coordinates", "Coordinates"],
                    ["legalDots", "Legal-move dots"],
                    ["lastMove", "Last-move highlight"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => update({ [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div
                className="settings-preview"
                aria-label="Selected board preview"
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <span
                    className={
                      (Math.floor(i / 4) + (i % 4)) % 2 ? "dark" : "light"
                    }
                    key={i}
                  >
                    {i === 5 ? "♞" : i === 10 ? "♙" : ""}
                  </span>
                ))}
              </div>
              <button className="primary" onClick={() => setVisible(false)}>
                Done
              </button>
            </section>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}

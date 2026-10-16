import { useState, useRef, useEffect } from "react";
import { StudyLine } from "./study";
import { analyzePosition } from "./engineAnalysis";
import { detectMistake, MistakePuzzle } from "./mistakeDetector";
import MistakePuzzlePractice from "./MistakePuzzlePractice";
import { addPuzzles, loadStore, saveStore } from "./drills";
export default function MistakePuzzleEngine({ line }: { line: StudyLine }) {
  const [puzzles, setPuzzles] = useState<MistakePuzzle[]>([]),
    [saved, setSaved] = useState(0),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setPuzzles([]);
    setNotice("");
  }, [line]);
  const scan = async () => {
    const ctl = new AbortController();
    controller.current = ctl;
    setBusy(true);
    setPuzzles([]);
    const found: MistakePuzzle[] = [];
    let skipped = 0;
    const count = Math.min(20, line.sans.length);
    try {
      for (let i = 0; i < count; i++) {
        if (ctl.signal.aborted) break;
        setNotice(`Scanning move ${i + 1}/${count}. Depth 8, on this device.`);
        try {
          const before = await analyzePosition(line.fens[i], ctl.signal),
            after = await analyzePosition(line.fens[i + 1], ctl.signal);
          const candidate = detectMistake(
            line.fens[i],
            line.sans[i],
            before,
            after,
            i + 1,
          );
          if (candidate && !candidate.best[4]) found.push(candidate);
        } catch (e) {
          if (ctl.signal.aborted) throw e;
          skipped++;
        }
      }
      if (!ctl.signal.aborted) {
        setPuzzles(found);
        setNotice(
          `${found.length} candidate practice positions found in the first ${count} plies. Skipped ${skipped} positions with unavailable scores. This is a low-depth estimate, not a confirmed blunder verdict.`,
        );
      }
    } catch {
      setNotice("Scan stopped.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="court-panel">
      <div className="eyebrow">FROM YOUR IMPORTED LINE</div>
      <h2>Practice a missed opportunity</h2>
      <p>
        Opt-in local scan: first 20 plies, depth 8, estimated loss of at least
        1.5 pawns. Mate-score positions and promotions are skipped. Your
        imported game stays in this browser.
      </p>
      {busy ? (
        <button onClick={() => controller.current?.abort()}>Stop scan</button>
      ) : (
        <button disabled={!line.sans.length} onClick={scan}>
          Scan this main line
        </button>
      )}
      <p role="status">{notice}</p>
      {puzzles.length > 0 && (
        <button
          onClick={() => {
            const store = loadStore();
            const n = addPuzzles(store, puzzles, "study scan");
            saveStore(store);
            setSaved(n);
          }}
        >
          Save {puzzles.length} as daily drills
        </button>
      )}
      {saved > 0 && (
        <p role="status">Saved {saved} new drills. Open Drills from the navigation.</p>
      )}
      {puzzles.map((p) => (
        <MistakePuzzlePractice key={p.ply + p.fen} puzzle={p} />
      ))}
      <small>
        Cross-device game history, verified puzzle quality and a large adaptive
        bank need later work. This scan is not a rated service.
      </small>
    </section>
  );
}

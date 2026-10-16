import { Chess } from "chess.js";
import { positionNotes } from "./positionNotes";
export function readableSuggestion(fen: string, best: string) {
  try {
    const c = new Chess(fen);
    const m = c.move({
      from: best.slice(0, 2),
      to: best.slice(2, 4),
      promotion: best[4],
    });
    return `${m.color === "w" ? "White" : "Black"}: ${m.san} (${m.from} to ${m.to}).`;
  } catch {
    return "No legal engine suggestion is available.";
  }
}
export default function AnalysisCoach({
  fen,
  previousFen,
  san,
  best,
  evaluation,
}: {
  fen: string;
  previousFen?: string;
  san?: string;
  best: string;
  evaluation: string;
}) {
  return (
    <section className="court-panel">
      <div className="eyebrow">IN PLAIN ENGLISH</div>
      <h2>What changed here?</h2>
      {positionNotes(fen, previousFen, san).map((n, i) => (
        <p key={i}>{n}</p>
      ))}
      {best && (
        <p>
          Engine candidate: {readableSuggestion(fen, best)} Score: {evaluation}.
        </p>
      )}
      <small>
        Rules and material explain what happened. The engine suggests a
        candidate, but this layer does not yet explain its full plan or identify
        the game's turning point.
      </small>
    </section>
  );
}

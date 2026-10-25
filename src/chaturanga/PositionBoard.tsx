import { Chess, Square } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "./preferences";
import MatiksPiece from "../components/MatiksPiece";
import { playSound } from "../online/sounds";

export default function PositionBoard({
  fen,
  selected,
  legal,
  onSquare,
  flip = false,
  lastMove: explicitLastMove,
}: {
  fen: string;
  selected: Square | null;
  legal: Square[];
  onSquare: (s: Square) => void;
  flip?: boolean;
  lastMove?: Square[];
}) {
  const { prefs } = usePreferences();
  const c = new Chess(fen);

  const prevFenRef = useRef(fen);
  const [internalLastMove, setInternalLastMove] = useState<Square[]>([]);
  const [justCapturedSq, setJustCapturedSq] = useState<Square | null>(null);
  const [justMovedSq, setJustMovedSq] = useState<Square | null>(null);

  useEffect(() => {
    if (prevFenRef.current === fen) return;
    try {
      const prevChess = new Chess(prevFenRef.current);
      const currChess = new Chess(fen);

      const prevBoard = prevChess.board();
      const currBoard = currChess.board();

      let movedTo: Square | null = null;
      let movedFrom: Square | null = null;

      let prevCount = 0;
      let currCount = 0;

      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sq = `${"abcdefgh"[f]}${8 - r}` as Square;
          const p1 = prevBoard[r][f];
          const p2 = currBoard[r][f];
          if (p1) prevCount++;
          if (p2) currCount++;

          if (p1 && !p2) movedFrom = sq;
          if (p2 && (!p1 || p1.type !== p2.type || p1.color !== p2.color)) movedTo = sq;
        }
      }

      const isCapture = currCount < prevCount;

      if (movedFrom && movedTo) {
        setInternalLastMove([movedFrom, movedTo]);
        setJustMovedSq(movedTo);
        if (isCapture) {
          setJustCapturedSq(movedTo);
        }
      }

      // Audio feedback using Web Audio
      if (currChess.isCheckmate() || currChess.isDraw()) {
        playSound("end");
      } else if (currChess.inCheck()) {
        playSound("check");
      } else if (isCapture) {
        playSound("capture");
      } else if (movedTo) {
        playSound("move");
      }
    } catch {
      // Ignore fen comparison errors on unusual variant strings
    } finally {
      prevFenRef.current = fen;
    }
  }, [fen]);

  // Clear brief landing/burst classes
  useEffect(() => {
    if (!justMovedSq && !justCapturedSq) return;
    const timer = setTimeout(() => {
      setJustMovedSq(null);
      setJustCapturedSq(null);
    }, 280);
    return () => clearTimeout(timer);
  }, [justMovedSq, justCapturedSq]);

  const activeLastMove = explicitLastMove || internalLastMove;

  // King in check square
  const inCheckSq: Square | null = c.inCheck()
    ? (() => {
        const turn = c.turn();
        for (let r = 0; r < 8; r++) {
          for (let f = 0; f < 8; f++) {
            const sq = `${"abcdefgh"[f]}${8 - r}` as Square;
            const p = c.get(sq);
            if (p && p.type === "k" && p.color === turn) return sq;
          }
        }
        return null;
      })()
    : null;

  return (
    <div className="court-board matiks-board" role="group" aria-label="Practice chess board">
      {(flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).flatMap(
        (rank, r) =>
          (flip ? [..."hgfedcba"] : [..."abcdefgh"]).map((file, f) => {
            const sq = `${file}${rank}` as Square;
            const p = c.get(sq);
            const isLegal = legal.includes(sq);
            const isCapture = isLegal && Boolean(p);
            const isLastMove = activeLastMove.includes(sq);
            const isCheck = inCheckSq === sq;
            const isJustMoved = justMovedSq === sq;
            const isJustCaptured = justCapturedSq === sq;

            return (
              <button
                key={sq}
                className={`square matiks-square ${(r + f) % 2 ? "dark" : "light"} ${
                  selected === sq ? "selected" : ""
                } ${isLastMove ? "last-move" : ""} ${isCheck ? "in-check" : ""} ${
                  isJustMoved ? "just-moved" : ""
                } ${isJustCaptured ? "just-captured" : ""}`}
                aria-label={`${sq}, ${
                  p ? (p.color === "w" ? "White" : "Black") + " " + p.type : "empty"
                } ${isCheck ? ", in check" : ""} ${
                  prefs.coordinates && f === 0 ? rank : ""
                }${prefs.coordinates && r === 7 ? file : ""}`}
                onClick={() => onSquare(sq)}
                onKeyDown={(e) => {
                  const shifts: Record<string, number> = {
                    ArrowRight: 1,
                    ArrowLeft: -1,
                    ArrowDown: 8,
                    ArrowUp: -8,
                  };
                  if (e.key in shifts) {
                    e.preventDefault();
                    const nodes = Array.from(
                      e.currentTarget.parentElement!.querySelectorAll(
                        "button",
                      ),
                    );
                    const i = nodes.indexOf(e.currentTarget);
                    nodes[Math.max(0, Math.min(63, i + shifts[e.key]))]?.focus();
                  }
                }}
              >
                {prefs.coordinates && f === 0 && (
                  <small aria-hidden="true" className="rank coord-rank">
                    {rank}
                  </small>
                )}
                {prefs.coordinates && r === 7 && (
                  <small aria-hidden="true" className="file coord-file">
                    {file}
                  </small>
                )}
                {p && (
                  <div className="piece piece-wrapper" aria-hidden="true">
                    <MatiksPiece type={p.type} color={p.color} />
                  </div>
                )}
                {prefs.legalDots && isLegal && (
                  isCapture ? (
                    <span className="matiks-capture-ring" aria-hidden="true" />
                  ) : (
                    <i className="move-dot matiks-move-dot" aria-hidden="true" />
                  )
                )}
              </button>
            );
          }),
      )}
    </div>
  );
}

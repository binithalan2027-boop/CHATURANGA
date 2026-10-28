import { useEffect, useState, type ReactNode } from "react";
import type { Glide, GlidePiece } from "./pieceGlide";

export const GLIDE_MS = 180;

/**
 * Overlay that glides moved pieces from their previous square to the new
 * one, like the piece motion on major chess sites. The static piece at
 * the destination is hidden by the caller until the glide lands.
 */
export default function PieceGlideLayer({
  glides,
  batch,
  flip = false,
  render,
}: {
  glides: Glide[];
  batch: number;
  flip?: boolean;
  render: (piece: GlidePiece) => { text: ReactNode; cls?: string };
}) {
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    setLanded(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setLanded(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [batch]);
  const screen = (sq: number) => {
    const row = Math.floor(sq / 8),
      col = sq % 8;
    return flip ? { x: 7 - col, y: row } : { x: col, y: 7 - row };
  };
  return (
    <>
      {glides.map((g, i) => {
        const at = screen(landed ? g.to : g.from);
        const { text, cls } = render(g.piece);
        return (
          <span
            key={`${batch}-${i}`}
            aria-hidden="true"
            className={`${cls || ""} piece-glide`}
            style={{
              transform: `translate(${at.x * 100}%, ${at.y * 100}%)`,
              transitionDuration: `${GLIDE_MS}ms`,
            }}
          >
            {text}
          </span>
        );
      })}
    </>
  );
}

import { motionOK as baseMotionOK } from "../lib/motion";

/** Skips animation entirely when the user prefers reduced motion (OS or in-app preference). */
export function motionOK(): boolean {
  return baseMotionOK();
}

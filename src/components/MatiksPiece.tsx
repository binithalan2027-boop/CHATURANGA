import React from "react";

export interface MatiksPieceProps {
  type: string; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k' (or 'P', 'N', etc.)
  color?: string; // 'w' | 'b' (or 'white', 'black')
  className?: string;
  style?: React.CSSProperties;
  customColor?: string;
  detailColor?: string;
}

export default function MatiksPiece({
  type,
  color = "w",
  className = "",
  style,
  customColor,
  detailColor,
}: MatiksPieceProps) {
  const t = type.toLowerCase();
  const isWhite = color === "w" || color === "white";
  const mainColor = customColor ?? (isWhite ? "#FAFAFA" : "#1B1B1B");
  const accentColor = detailColor ?? (isWhite ? "#1B1B1B" : "#FAFAFA");

  return (
    <svg
      viewBox="0 0 100 100"
      className={`matiks-piece ${isWhite ? "piece-white" : "piece-black"} ${className}`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      {t === "p" && (
        <>
          <circle cx="50" cy="30" r="15" fill={mainColor} />
          <path d="M36 52 H64 L68 72 H32 Z" fill={mainColor} />
          <rect x="26" y="72" width="48" height="14" rx="6" fill={mainColor} />
          <rect x="40" y="52" width="20" height="5" rx="2" fill={accentColor} />
        </>
      )}

      {t === "n" && (
        <>
          <path
            d="M26 90 H78 V80 C78 62 72 50 62 44 C72 40 78 30 74 20 L64 24 L58 10 L48 22 C32 26 20 40 20 56 L36 62 C40 54 46 52 52 52 C46 62 38 70 30 80 Z"
            fill={mainColor}
          />
          <circle cx="52" cy="34" r="3.2" fill={accentColor} />
          <rect x="22" y="82" width="60" height="10" rx="4" fill={accentColor} />
        </>
      )}

      {t === "b" && (
        <>
          <circle cx="50" cy="14" r="6" fill={mainColor} />
          <path
            d="M50 20 C32 34 30 52 40 62 L34 72 H66 L60 62 C70 52 68 34 50 20 Z"
            fill={mainColor}
          />
          <rect x="24" y="74" width="52" height="14" rx="6" fill={mainColor} />
          <line
            x1="44"
            y1="38"
            x2="56"
            y2="50"
            stroke={accentColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}

      {t === "r" && (
        <>
          <path
            d="M26 20 H36 V30 H44 V20 H56 V30 H64 V20 H74 V42 L68 50 V78 L76 84 V92 H24 V84 L32 78 V50 L26 42 Z"
            fill={mainColor}
          />
          <rect
            x="38"
            y="60"
            width="24"
            height="5"
            rx="2.5"
            fill={accentColor}
          />
        </>
      )}

      {t === "q" && (
        <>
          <circle cx="50" cy="14" r="7" fill={mainColor} />
          <circle cx="24" cy="26" r="6" fill={mainColor} />
          <circle cx="76" cy="26" r="6" fill={mainColor} />
          <path
            d="M28 88 L22 30 L38 52 L50 24 L62 52 L78 30 L72 88 Z"
            fill={mainColor}
          />
          <rect x="22" y="82" width="56" height="12" rx="5" fill={mainColor} />
          <rect
            x="34"
            y="66"
            width="32"
            height="5"
            rx="2.5"
            fill={accentColor}
          />
        </>
      )}

      {t === "k" && (
        <>
          <rect x="46" y="6" width="8" height="26" rx="2" fill={mainColor} />
          <rect x="37" y="14" width="26" height="8" rx="2" fill={mainColor} />
          <path
            d="M30 90 H70 L66 52 C66 44 60 38 50 38 C40 38 34 44 34 52 Z"
            fill={mainColor}
          />
          <rect x="24" y="82" width="52" height="12" rx="5" fill={mainColor} />
          <rect
            x="34"
            y="60"
            width="32"
            height="6"
            rx="3"
            fill={accentColor}
          />
        </>
      )}
    </svg>
  );
}

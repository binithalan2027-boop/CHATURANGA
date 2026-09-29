import React from 'react';

const PIECE_SYMBOLS: Record<string, string> = {
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
};

interface PlayerBarProps {
  name: string;
  avatar: React.ReactNode;
  isThinking?: boolean;
  capturedPieces: string[];
  materialAdvantage: number; // positive means this player is ahead
  isActive: boolean;
  elo?: number;
}

export default function PlayerBar({ name, avatar, isThinking, capturedPieces, materialAdvantage, isActive, elo }: PlayerBarProps) {
  return (
    <div className={`bg-surface-card border transition-colors p-3 rounded flex items-center justify-between font-headline-md text-bone-ivory ${isActive ? 'border-primary-container shadow-[0_0_15px_rgba(var(--color-primary-container),0.2)]' : 'border-surface-container-high'}`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl relative">
          {avatar}
          {isThinking && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-crimson-glow border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm tracking-wide">{name} {elo ? <span className="text-xs text-on-surface-variant ml-1 font-mono">({elo})</span> : null}</span>
          <div className="flex text-sm text-on-surface-variant font-mono h-5">
            {capturedPieces.map((p, i) => (
              <span key={i} className="text-bone-ivory/70">{PIECE_SYMBOLS[p]}</span>
            ))}
            {materialAdvantage > 0 && <span className="text-green-400 ml-1">+{materialAdvantage}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

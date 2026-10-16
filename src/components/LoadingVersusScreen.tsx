import { useEffect, useRef, useState } from "react";
import "../chaturanga/courtyard.css";
interface LoadingVersusScreenProps {
  player: {
    name: string;
    avatar?: string;
    elo?: number;
    fideRating?: number;
    title?: string;
  };
  opponent: {
    name: string;
    avatar?: string;
    elo?: number;
    fideRating?: number;
    title?: string;
  };
  onComplete: () => void;
}
export default function LoadingVersusScreen({
  player,
  opponent,
  onComplete,
}: LoadingVersusScreenProps) {
  const [count, setCount] = useState(3),
    done = useRef(onComplete);
  done.current = onComplete;
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const next = Math.max(0, 3 - Math.floor((Date.now() - started) / 1000));
      setCount(next);
      if (!next) {
        clearInterval(id);
        done.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="courtyard court-versus">
      <div className="eyebrow">THE BOARD IS ALMOST READY</div>
      <h1>A moment before the first move.</h1>
      <div className="versus-players">
        <div>
          ○<h2>{player.name}</h2>
          <p>{player.elo ? `${player.elo} difficulty` : "Player"}</p>
        </div>
        <span>with</span>
        <div>
          ●<h2>{opponent.name}</h2>
          <p>{opponent.elo ? `${opponent.elo} difficulty` : "Opponent"}</p>
        </div>
      </div>
      <p>Starting in {count}.</p>
    </div>
  );
}

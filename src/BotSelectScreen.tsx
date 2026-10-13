import { usePreferences } from "./chaturanga/preferences";
import { useState } from "react";
import "./chaturanga/courtyard.css";
export interface BotSelectScreenProps {
  onStart: (elo: number, timeMinutes: number, gameMode: string) => void;
  onBack: () => void;
}
const variants = [
  {
    id: "standard",
    name: "Classic chess",
    text: "The original game. An open board and a good opponent.",
  },
  {
    id: "chess960",
    name: "Chess960",
    text: "A shuffled back rank. Think from the first move.",
  },
  {
    id: "fog",
    name: "Fog of War",
    text: "Play with only the squares your pieces can see.",
  },
  {
    id: "atomic",
    name: "Atomic",
    text: "Captures explode. Keep your king out of the blast.",
  },
  {
    id: "spell",
    name: "Original Spell",
    text: "The existing freeze-and-jump variant.",
  },
  {
    id: "math",
    name: "Original Maths",
    text: "The existing maths-against-AI game.",
  },
];
export default function BotSelectScreen({
  onStart,
  onBack,
}: BotSelectScreenProps) {
  const { prefs } = usePreferences();
  const [elo, setElo] = useState(1300),
    [minutes, setMinutes] = useState(10),
    [mode, setMode] = useState("standard");
  return (
    <div className="courtyard">
      <header className="court-header">
        <button className="court-brand" onClick={onBack}>
          ♞{" "}
          <span>
            Chaturanga<small>Find your next game.</small>
          </span>
        </button>
        <button onClick={onBack}>Back home</button>
      </header>
      <main className="court-setup">
        <div className="eyebrow">THE CLASSIC COLLECTION</div>
        <h1>
          Same board.
          <br />A fresh perspective.
        </h1>
        <p>
          Choose an existing variant and an AI difficulty.
          <br />
          These modes keep their original gameplay rules.
        </p>
        <div className="mode-choice">
          {variants.map((v) => (
            <button
              key={v.id}
              className={mode === v.id ? "chosen" : ""}
              onClick={() => setMode(v.id)}
            >
              <h2>{v.name}</h2>
              <p>{v.text}</p>
            </button>
          ))}
        </div>
        <div className="setup-controls">
          <label>
            AI difficulty
            <select
              value={elo}
              onChange={(e) => setElo(Number(e.target.value))}
            >
              <option value={450}>
                {prefs.hideRatings ? "Beginner" : "Beginner · 450"}
              </option>
              <option value={1300}>
                {prefs.hideRatings ? "Intermediate" : "Intermediate · 1300"}
              </option>
              <option value={1850}>
                {prefs.hideRatings ? "Advanced" : "Advanced · 1850"}
              </option>
              <option value={2400}>
                {prefs.hideRatings ? "Expert" : "Expert · 2400"}
              </option>
              <option value={3200}>
                {prefs.hideRatings ? "Maximum" : "Maximum · 3200"}
              </option>
            </select>
          </label>
          <label>
            Requested time
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>
          </label>
          <button
            className="primary"
            onClick={() => onStart(elo, minutes, mode)}
          >
            Play this variant ↗
          </button>
        </div>
        <p className="local-note">
          Legacy offline modes retain their own clocks and increment rules; this
          time selection is not a new timed-game guarantee. The new Chaturanga
          collection has fully integrated local clocks.
        </p>
      </main>
    </div>
  );
}

import { usePreferences } from "./preferences";
export default function ProductNav({
  onHome,
  onPlay,
  onBots,
  onLearn,
  onStudy,
  onTournaments,
  onProfile,
  onDrills,
  active,
}: {
  onHome: () => void;
  onPlay: () => void;
  onBots: () => void;
  onLearn: () => void;
  onStudy: () => void;
  onTournaments: () => void;
  onProfile: () => void;
  onDrills?: () => void;
  active: string;
}) {
  const { open } = usePreferences();
  return (
    <nav className="product-nav" aria-label="Main navigation">
      <button aria-label="Home" className="nav-logo" onClick={onHome}>
        ♞<span>Chaturanga</span>
      </button>
      <div className="product-nav-links">
        <button
          aria-label="Play"
          className={active === "play" ? "active" : ""}
          onClick={onPlay}
        >
          ♟<span>Play</span>
        </button>
        <button
          aria-label="Bots"
          className={active === "bots" ? "active" : ""}
          onClick={onBots}
        >
          ♜<span>Bots</span>
        </button>
        <button
          aria-label="Study"
          className={active === "study" ? "active" : ""}
          onClick={onStudy}
        >
          ▦<span>Study</span>
        </button>
        <button
          aria-label="Learn"
          className={active === "learn" ? "active" : ""}
          onClick={onLearn}
        >
          ▤<span>Learn</span>
        </button>
        {onDrills && (
          <button
            aria-label="Drills"
            className={active === "drills" ? "active" : ""}
            onClick={onDrills}
          >
            ♗<span>Drills</span>
          </button>
        )}
        <button
          aria-label="Tournaments"
          className={active === "tournaments" ? "active" : ""}
          onClick={onTournaments}
        >
          ♛<span>Tournaments</span>
        </button>
        <button
          aria-label="Profile"
          className={active === "profile" ? "active" : ""}
          onClick={onProfile}
        >
          ○<span>Profile</span>
        </button>
      </div>
      <button aria-label="Settings" className="nav-settings" onClick={open}>
        ⚙<span>Settings</span>
      </button>
    </nav>
  );
}

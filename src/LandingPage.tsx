import HomeBoard from "./chaturanga/HomeBoard";
import {
  PUZZLES,
  practiceSuggestion,
  emptyProgress,
} from "./chaturanga/training";
import "./chaturanga/courtyard.css";
interface LandingPageProps {
  user: { name: string; email: string } | null;
  onPlay: () => void;
  onRuleVariants: () => void;
  onQuick: () => void;
  onTraining: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onChaturanga: () => void;
  onChaturangaDemo: () => void;
  onBots: () => void;
  onOpenPolicy?: () => void;
  onOpenLearn?: () => void;
  onOpenAbout?: () => void;
  onOpenProfile?: () => void;
  onOpenFriendsSanctum?: () => void;
  matchStatus: "idle" | "searching" | "found";
  onSearchMatch: () => void;
  onCancelMatch: () => void;
}
export default function LandingPage(props: LandingPageProps) {
  let progress = emptyProgress;
  try {
    progress =
      JSON.parse(localStorage.getItem("chaturanga-training-v1") || "null") ||
      emptyProgress;
  } catch {
    /* no invented history */
  }
  const suggestion = practiceSuggestion(progress);
  const puzzle = PUZZLES.find((p) => p.id === suggestion.id)!;
  return (
    <div className="courtyard home-courtyard">
      <header className="court-header">
        <div className="court-brand">
          ♞{" "}
          <span>
            Chaturanga<small>Come for chess. Stay for the company.</small>
          </span>
        </div>
        <nav className="court-header-actions">
          <button onClick={props.onOpenLearn}>Learn</button>
          <button onClick={props.user ? props.onOpenProfile : props.onLogin}>
            {props.user ? props.user.name : "Sign in"}
          </button>
          {props.user && <button onClick={props.onLogout}>Sign out</button>}
        </nav>
      </header>
      <main className="court-home">
        <section className="home-hero">
          <div>
            <div className="eyebrow">FROM THE COURTYARD, TO YOUR NEXT MOVE</div>
            <h1>
              Your next move.
              <br />
              Nothing in the way.
            </h1>
            <p>
              Move a piece now. No sign-in, menu or countdown.
              <br />
              Or settle into a quiet game with a computer.
            </p>
            <div className="home-actions">
              <button className="primary" onClick={props.onQuick}>
                Play or resume quiet practice ↗
              </button>
              <button onClick={props.onRuleVariants}>
                Explore established variants
              </button>
              <button onClick={props.onChaturanga}>Mind & magic</button>
              <button onClick={props.onChaturangaDemo}>
                60-second demo ↗
              </button>
            </div>
            <span className="home-footnote">
              No account needed for local play. Your board is ready.
            </span>
          </div>
          <HomeBoard />
        </section>
        <section className="home-practice court-panel">
          <div>
            <div className="eyebrow">YOUR NEXT SMALL STEP</div>
            <h2>{puzzle.name}</h2>
            <p>{suggestion.reason}</p>
            <small>
              Based only on attempts stored on this device, not a chess-strength
              diagnosis.
            </small>
          </div>
          <button
            className="primary"
            onClick={() => {
              localStorage.setItem("chaturanga-next-puzzle", suggestion.id);
              props.onTraining();
            }}
          >
            Practice this pattern
          </button>
        </section>
        <section className="home-modes">
          <div className="section-line">
            <div>
              <div className="eyebrow">FIND YOUR RHYTHM</div>
              <h2>More than one way to think.</h2>
            </div>
            <span>CHOOSE YOUR NEXT GAME</span>
          </div>
          <div className="home-mode-grid">
            <button onClick={props.onChaturanga}>
              <span className="mode-number">01 / THE NEW COLLECTION</span>
              <h3>Mind & magic</h3>
              <p>
                Mental maths before each move, or a 90-second maths break with
                seven earned powers.
              </p>
              <span className="mode-link">
                Local hot-seat & vs Khivin ↗
              </span>
            </button>
            <button onClick={props.onPlay}>
              <span className="mode-number">02 / FAMILIAR, REIMAGINED</span>
              <h3>Classic variants</h3>
              <p>
                Standard chess, Chess960, Atomic, Fog and the original Spell
                mode. Existing games stay available.
              </p>
              <span className="mode-link">Choose a board ↗</span>
            </button>
            <button onClick={props.onOpenFriendsSanctum}>
              <span className="mode-number">03 / ACROSS THE TABLE</span>
              <h3>Play with a friend</h3>
              <p>
                Open the existing friend lobby for classic chess. Online maths
                and powers are not enabled yet.
              </p>
              <span className="mode-link">Open friend lobby ↗</span>
            </button>
          </div>
        </section>
        <section className="home-bottom">
          <h2>
            Some games ask you to hurry.
            <br />
            This one asks you to notice.
          </h2>
          <div>
            <p>
              Warm wood. Quiet colours. A good question.
              <br />A place to enjoy the next move.
            </p>
            {props.matchStatus === "searching" ? (
              <button onClick={props.onCancelMatch}>
                Cancel classic matchmaking
              </button>
            ) : (
              <button onClick={props.onSearchMatch}>
                Find a classic opponent
              </button>
            )}
          </div>
        </section>
      </main>
      <footer className="court-footer">
        <span>♞ Chaturanga · Thoughtfully played.</span>
        <div className="home-footer-links">
          <button onClick={props.onOpenAbout}>About</button>
          <button onClick={props.onOpenPolicy}>Privacy & terms</button>
        </div>
      </footer>
    </div>
  );
}

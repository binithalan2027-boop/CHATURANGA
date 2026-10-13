import "./online/online.css";
export default function PolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="online-shell">
      <header className="online-header">
        <h1>Beta data and fair play</h1>
        <button onClick={onBack}>Back home</button>
      </header>
      <section className="online-card">
        <h2>Local build, not a public service</h2>
        <p>
          This build is for local testing. Public hosting, social-login
          providers, a privacy-policy owner, support contact and retention
          schedule have not been configured. This page is a factual beta notice,
          not a claim of legal compliance or a finished public policy.
        </p>
        <h2>Online beta audience</h2>
        <p>
          Online play and friends are restricted to adults who confirm they are
          18 or older. This is a beta guardrail, not identity or age
          verification. Children are not supported by the online beta. Local
          no-account practice stays available.
        </p>
        <h2>What is stored</h2>
        <p>
          The game server stores player IDs, usernames, display names, optional
          bio/country/self-reported FIDE rating, timezone, adult confirmation,
          discovery choice, game history and results, provisional private-match
          app ratings, friendships and blocks. Account email, passwords and
          OAuth tokens are not copied into the player profile database. The
          external auth provider keeps its own identity records. Local
          development session tokens are stored server-side until sign-out or
          expiry.
        </p>
        <p>
          Discovery is off by default. Search requires an exact username.
          Accepted friends can challenge you. A room code allows another player
          to join your room unless it is a friend-specific challenge. Share room
          codes privately.
        </p>
        <h2>Your controls</h2>
        <p>
          Profile includes a game-data export and player-profile deletion.
          Deletion removes the profile and social connections and anonymizes the
          player in retained opponent game history. It does not delete a Google,
          Facebook, Discord or Supabase identity account. External-account
          deletion and backup retention need a supported process before public
          launch.
        </p>
        <h2>Fair play and ratings</h2>
        <p>
          Moves, turns, clocks and results are checked on the server. There is
          no anti-cheat detection, verified FIDE link or official rating service
          in this build. App ratings are provisional and can be farmed in
          private games. Do not advertise them as FIDE ratings. Self-reported
          FIDE fields are explicitly unverified.
        </p>
        <h2>Engine limits</h2>
        <p>
          Khivin uses Stockfish for classic play. Its 1320-3190 targets are
          engine-pool estimates, not FIDE ratings. Practice levels below 1320
          use uncalibrated assistance. Full strength still depends on device,
          search depth and time budget. Custom maths/spell modes use a local
          engine and have no calibrated Elo.
        </p>
      </section>
    </main>
  );
}

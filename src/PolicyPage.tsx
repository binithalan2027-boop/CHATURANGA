interface PolicyPageProps {
  onBack: () => void;
}

export default function PolicyPage({ onBack }: PolicyPageProps) {
  return (
    <div className="policy-screen">
      <div className="policy-container">
        <button className="auth-back" onClick={onBack}>← Back to Home</button>

        <header className="policy-header">
          <div className="auth-logo">
            <div className="auth-logo-box">QST</div>
            <span className="auth-logo-name">Chaturanga</span>
          </div>
          <h1 className="policy-title">Terms of Service & Privacy Policy</h1>
          <p className="policy-subtitle">Last updated: September 2026</p>
        </header>

        <div className="policy-content">
          <section className="policy-section">
            <h2>1. Terms of Service</h2>
            <p>
              Welcome to Chaturanga! By accessing or using our website, game modes, and services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, please do not use our platform.
            </p>
            <h3>User Conduct & Fair Play</h3>
            <p>
              We are committed to maintaining a clean, competitive, and respectful gaming environment. Cheating, engine assistance during online matches, software manipulation, harassment, or abusing platform features is strictly prohibited and will result in immediate account termination.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Privacy Policy</h2>
            <p>
              Your privacy is extremely important to us. This Privacy Policy describes how Chaturanga collects, uses, and protects your personal information.
            </p>
            <h3>Information We Collect</h3>
            <ul>
              <li><strong>Account Information:</strong> Username, email address, or authentication tokens from third-party login providers (Google, Discord, Phone).</li>
              <li><strong>Gameplay Data:</strong> Match history, move logs, rating statistics, and preferred game modes.</li>
              <li><strong>Technical Data:</strong> Browser type, IP address, and system metrics used for anti-cheat verification and performance optimization.</li>
            </ul>
            <h3>How We Use Your Information</h3>
            <p>
              We use your data solely to provide, maintain, and improve Chaturanga services, generate leaderboards, calculate ELO ratings, and ensure fair play. We never sell your personal information to third parties.
            </p>
          </section>

          <section className="policy-section">
            <h2>3. Community Guidelines & Anti-Cheat</h2>
            <p>
              All players must respect opponent dignity. Automated bots and Stockfish integration are restricted to designated Singleplayer/Offline modes. Using chess engines during online multiplayer is forbidden.
            </p>
          </section>

          <section className="policy-section">
            <h2>4. Contact Us</h2>
            <p>
              If you have any questions regarding these policies or account management, please reach out to our team at <code>support@chaturanga.dev</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

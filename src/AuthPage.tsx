import { useState } from 'react';

interface AuthPageProps {
  onAuth: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'signup';

export default function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) { setError('Name is required'); return; }
      if (!email.trim() && !phone.trim()) { setError('Email or phone is required'); return; }
      if (!password || password.length < 6) { setError('Password must be 6+ characters'); return; }
      onAuth({ name: name.trim(), email: email.trim() || phone.trim() });
    } else {
      if (!email.trim() && !phone.trim()) { setError('Email or phone is required'); return; }
      if (!password) { setError('Password is required'); return; }
      onAuth({ name: email.split('@')[0] || 'Player', email: email.trim() || phone.trim() });
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate OAuth — in production this would redirect to the provider
    onAuth({ name: `${provider} User`, email: `user@${provider.toLowerCase()}.com` });
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {/* Back Button */}
        <button className="auth-back" onClick={onBack}>← Back to Home</button>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-box">QST</div>
          <span className="auth-logo-name">Chaturanga</span>
        </div>

        {/* Tab Switch */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="auth-social">
          <button className="auth-social-btn google" onClick={() => handleSocialLogin('Google')}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button className="auth-social-btn discord" onClick={() => handleSocialLogin('Discord')}>
            <svg width="20" height="20" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A26.5 26.5 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.7 58.7 0 0017.7 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.8 41.8 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4c-1.8 1-3.6 1.9-5.5 2.6a.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.5 58.5 0 0070.3 45.6v-.1c1.4-15.2-2.4-28.4-10.1-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7.1 0-3.9 2.8-7.1 6.3-7.1s6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1zm23.2 0c-3.5 0-6.3-3.2-6.3-7.1 0-3.9 2.8-7.1 6.3-7.1s6.4 3.2 6.3 7.1c0 3.9-2.7 7.1-6.3 7.1z"/></svg>
            Continue with Discord
          </button>
          <button className="auth-social-btn phone" onClick={() => handleSocialLogin('Phone')}>
            📱 Continue with Phone
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email or Phone</label>
            <input
              type="text"
              placeholder="email@example.com or +91..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'Create a password (6+ chars)' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('signup')}>Sign up free</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('login')}>Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

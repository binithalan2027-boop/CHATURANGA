import { useState } from 'react';
import { supabase } from './lib/supabase';

interface AuthPageProps {
  onAuth: (user: { id: string; name: string; email: string }) => void;
  onBack: () => void;
}

export default function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [faction, setFaction] = useState<'carnival' | 'swarm' | 'harvest'>('swarm');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
              faction: faction
            }
          }
        });
        if (signUpError) throw signUpError;
        onAuth({
          id: data.user?.id || 'guest-' + Date.now(),
          name: name || email.split('@')[0],
          email
        });
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        onAuth({
          id: data.user?.id || 'user-' + Date.now(),
          name: data.user?.user_metadata?.display_name || email.split('@')[0],
          email: data.user?.email || ''
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'Failed to fetch') {
        setError('DATABASE OFFLINE: Local guest access active.');
        // Fallback to local session
        onAuth({
          id: 'local-' + Date.now(),
          name: name || email.split('@')[0] || 'Grandmaster',
          email: email || 'guest@chaturanga.io'
        });
      } else {
        setError(message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = () => {
    onAuth({
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
      email: 'guest@chaturanga.io'
    });
  };

  return (
    <div className="bg-ink-black text-on-surface font-body-md text-body-md min-h-screen selection:bg-blood-crimson selection:text-bone-ivory antialiased">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-black/95 backdrop-blur-xl border-b border-void-border shadow-[0_4px_24px_rgba(9,9,13,0.85)]">
        <div className="h-20 w-full max-w-[1440px] mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-lg">
            <button onClick={onBack} className="flex items-center gap-space-sm group focus:outline-none">
              <span className="material-symbols-outlined text-bone-ivory group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <div className="flex flex-col text-left">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-bone-ivory leading-none">Chaturanga</span>
                <span className="font-label-sm text-label-sm tracking-widest text-blood-crimson font-bold uppercase">Return to Arena</span>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-space-md">
            <button onClick={handleGuestPlay} className="px-space-md py-1.5 bg-pumpkin-orange/20 hover:bg-pumpkin-orange text-pumpkin-orange hover:text-ink-black border border-pumpkin-orange font-label-sm uppercase tracking-widest transition-colors">
              GUEST QUICK COMBAT
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-ink-black min-h-screen">
        <div className="flex flex-col w-full">
          {/* Telemetry Bar */}
          <section className="w-full bg-surface-container-lowest px-margin py-space-xs">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-space-sm font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory-dim">
              <div className="flex items-center gap-space-md">
                <span className="flex items-center gap-1.5 text-blood-crimson font-bold">
                  <span className="w-2 h-2 bg-blood-crimson animate-ping"></span>
                  AUTH PROTOCOL // SOUL REGISTRY SEC-01
                </span>
                <span className="hidden md:inline text-bone-ivory-muted">//</span>
                <span className="hidden md:inline">CLIENT TELEMETRY: TLS-ENCRYPTED 4096-BIT</span>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="text-pumpkin-orange font-mono font-semibold">SERVER: AP-NORTHEAST-1</span>
                <span className="text-bone-ivory-muted">//</span>
                <span className="text-bone-ivory">GLOBAL COMBAT QUEUE: <span className="text-blood-crimson-bright font-bold">ONLINE</span></span>
              </div>
            </div>
          </section>

          {/* Main Grid Viewport */}
          <section className="w-full max-w-[1440px] mx-auto px-margin py-space-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* Primary Left Console: Auth & Consecration Panel (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg bg-surface-container-low p-space-lg md:p-space-xl shadow-xl border border-void-border">
                {/* Header Banner & Mode Selector */}
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blood-crimson/20 text-blood-crimson text-label-sm font-label-sm uppercase tracking-wider font-semibold">
                      SANCTUM TERMINAL ACCESS
                    </span>
                    <span className="text-label-sm font-label-sm text-bone-ivory-muted tracking-widest uppercase font-mono">
                      REV: 0.9.4 // NODE #004
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="font-headline-lg text-headline-lg uppercase tracking-wider text-bone-ivory leading-none">
                      STEP INTO THE VOID.
                    </h1>
                    <p className="font-body-md text-body-md text-bone-ivory-dim mt-space-xs">
                      Authenticate your neural link or bind your soul to the battlefield. Ranked ELO ratings, custom eldritch grimoires, and deep match telemetry await.
                    </p>
                  </div>
                  {/* Dual Mode Switcher Tabs */}
                  <div className="grid grid-cols-2 gap-space-xs bg-surface-container-lowest p-1">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className={`py-2.5 px-space-md text-center font-headline-sm text-headline-sm uppercase tracking-widest transition-all ${
                        mode === 'signin'
                          ? 'bg-blood-crimson text-bone-ivory shadow-[0_0_16px_rgba(163,19,43,0.5)]'
                          : 'bg-void-surface text-bone-ivory-muted hover:text-bone-ivory'
                      }`}
                    >
                      COMMENCE COMBAT // SIGN IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className={`py-2.5 px-space-md text-center font-headline-sm text-headline-sm uppercase tracking-widest transition-all ${
                        mode === 'register'
                          ? 'bg-blood-crimson text-bone-ivory shadow-[0_0_16px_rgba(163,19,43,0.5)]'
                          : 'bg-void-surface text-bone-ivory-muted hover:text-bone-ivory'
                      }`}
                    >
                      CONSECRATE SOUL // REGISTER
                    </button>
                  </div>
                </div>

                {/* Fast Guest / Social Matrix */}
                <div className="flex flex-col gap-space-sm">
                  <button
                    type="button"
                    onClick={handleGuestPlay}
                    className="w-full py-3 px-space-md bg-pumpkin-orange/15 hover:bg-pumpkin-orange/25 text-pumpkin-orange border border-pumpkin-orange/40 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[20px] group-hover:rotate-45 transition-transform">bolt</span>
                      <span className="font-headline-sm text-headline-sm uppercase tracking-wider">QUICK COMBAT GUEST PASS</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-pumpkin-orange-blaze uppercase tracking-widest font-mono">
                      [ NO ELO RECORD // INSTANT QUEUE ]
                    </span>
                  </button>
                </div>

                {/* Horizontal HUD Breaker */}
                <div className="flex items-center gap-space-md my-space-xs">
                  <div className="h-px bg-surface-container-highest flex-1"></div>
                  <span className="font-label-sm text-label-sm tracking-widest text-bone-ivory-muted uppercase font-mono">
                    — OR CONVENTIONAL CIPHER TRANSMISSION —
                  </span>
                  <div className="h-px bg-surface-container-highest flex-1"></div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-blood-crimson/20 border border-blood-crimson text-blood-crimson-bright p-space-sm font-label-sm text-label-sm font-mono uppercase tracking-wider">
                    [ERROR]: {error}
                  </div>
                )}

                {/* Interactive Form Fields */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
                  {/* Handle Field (Register Mode Only) */}
                  {mode === 'register' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory-dim" htmlFor="gm-handle">
                          CALL-SIGN // GRANDMASTER HANDLE
                        </label>
                        <span className="font-label-sm text-label-sm text-pumpkin-orange-blaze font-mono flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-pumpkin-orange"></span> AVAILABLE
                        </span>
                      </div>
                      <div className="relative bg-surface-container-lowest flex items-center px-space-md py-3 border border-void-border focus-within:border-blood-crimson transition-all">
                        <span className="material-symbols-outlined text-bone-ivory-muted text-[20px] mr-2">skull</span>
                        <input
                          id="gm-handle"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent text-bone-ivory font-label-md text-label-md tracking-wider placeholder:text-bone-ivory-muted focus:outline-none uppercase"
                          placeholder="VOID_STRIKER_99"
                        />
                        <span className="text-blood-crimson font-mono text-label-sm tracking-widest">OK</span>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory-dim" htmlFor="neural-email">
                      NEURAL TRANSMISSION LINK // EMAIL
                    </label>
                    <div className="relative bg-surface-container-lowest flex items-center px-space-md py-3 border border-void-border focus-within:border-blood-crimson transition-all">
                      <span className="material-symbols-outlined text-bone-ivory-muted text-[20px] mr-2">alternate_email</span>
                      <input
                        id="neural-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-bone-ivory font-label-md text-label-md tracking-wider placeholder:text-bone-ivory-muted focus:outline-none"
                        placeholder="grandmaster@void.network"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory-dim" htmlFor="gm-cipher">
                        OCCULT PASSPHRASE // CIPHER
                      </label>
                    </div>
                    <div className="relative bg-surface-container-lowest flex items-center px-space-md py-3 border border-void-border focus-within:border-blood-crimson transition-all">
                      <span className="material-symbols-outlined text-bone-ivory-muted text-[20px] mr-2">key</span>
                      <input
                        id="gm-cipher"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent text-bone-ivory font-label-md text-label-md tracking-wider placeholder:text-bone-ivory-muted focus:outline-none"
                        placeholder="Enter your secret cipher"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-bone-ivory-muted hover:text-bone-ivory transition-colors focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Faction Allegiance Selector (Registration State) */}
                  {mode === 'register' && (
                    <div className="flex flex-col gap-space-sm mt-space-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm uppercase tracking-widest text-bone-ivory-dim">
                          CURSED COHORT ALLEGIANCE // DEFAULT FIGURINE SET
                        </span>
                        <span className="font-label-sm text-label-sm text-bone-ivory-muted font-mono">[SELECT ONE]</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                        {/* Carnival Card */}
                        <div
                          onClick={() => setFaction('carnival')}
                          className={`cursor-pointer p-space-sm transition-all flex flex-col justify-between border ${
                            faction === 'carnival'
                              ? 'bg-surface-container border-blood-crimson ring-2 ring-blood-crimson shadow-[0_0_18px_rgba(163,19,43,0.45)]'
                              : 'bg-surface-container-lowest border-void-border hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm text-label-sm text-blood-crimson font-mono font-bold uppercase">THE CARNIVAL</span>
                            <span className="material-symbols-outlined text-blood-crimson text-[18px]">theater_comedy</span>
                          </div>
                          <div className="text-title-sm font-title-sm text-bone-ivory uppercase leading-none mb-1">
                            HARLEQUIN GAMBIT
                          </div>
                          <p className="font-body-sm text-body-sm text-bone-ivory-dim leading-snug">
                            Psychological horror &amp; grinning jesters. Disorient tactical positions.
                          </p>
                        </div>
                        {/* Swarm Card */}
                        <div
                          onClick={() => setFaction('swarm')}
                          className={`cursor-pointer p-space-sm transition-all flex flex-col justify-between border ${
                            faction === 'swarm'
                              ? 'bg-surface-container border-cursed-violet ring-2 ring-cursed-violet shadow-[0_0_18px_rgba(100,47,158,0.45)]'
                              : 'bg-surface-container-lowest border-void-border hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm text-label-sm text-tertiary font-mono font-bold uppercase">THE SWARM</span>
                            <span className="material-symbols-outlined text-tertiary text-[18px]">pest_control</span>
                          </div>
                          <div className="text-title-sm font-title-sm text-bone-ivory uppercase leading-none mb-1">
                            ABYSSAL THREADING
                          </div>
                          <p className="font-body-sm text-body-sm text-bone-ivory-dim leading-snug">
                            Arachnid dread and chitin bone relics. Constrict board space.
                          </p>
                        </div>
                        {/* Harvest Card */}
                        <div
                          onClick={() => setFaction('harvest')}
                          className={`cursor-pointer p-space-sm transition-all flex flex-col justify-between border ${
                            faction === 'harvest'
                              ? 'bg-surface-container border-pumpkin-orange ring-2 ring-pumpkin-orange shadow-[0_0_18px_rgba(230,106,24,0.45)]'
                              : 'bg-surface-container-lowest border-void-border hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono font-bold uppercase">CURSED HARVEST</span>
                            <span className="material-symbols-outlined text-pumpkin-orange text-[18px]">local_fire_department</span>
                          </div>
                          <div className="text-title-sm font-title-sm text-bone-ivory uppercase leading-none mb-1">
                            WITCHING PYRE
                          </div>
                          <p className="font-body-sm text-body-sm text-bone-ivory-dim leading-snug">
                            Witches and pyrotechnic pumpkin terror. Unfurl chaotic area denial.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Impact Action Button */}
                  <div className="pt-space-sm">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 px-space-xl bg-blood-crimson hover:bg-blood-crimson-bright text-bone-ivory font-headline-lg text-headline-lg uppercase tracking-widest shadow-[0_0_24px_rgba(163,19,43,0.65)] hover:shadow-[0_0_36px_rgba(214,31,61,0.9)] transition-all flex items-center justify-center gap-space-md group"
                    >
                      <span className="material-symbols-outlined text-[28px] group-hover:scale-125 transition-transform text-bone-ivory">sports_martial_arts</span>
                      <span>
                        {loading
                          ? 'COMMUNICATING WITH SANCTUM...'
                          : mode === 'signin'
                          ? 'COMMENCE COMBAT & DEPLOY'
                          : 'CONSECRATE SOUL & ENTER ARENA'}
                      </span>
                      <span className="material-symbols-outlined text-[28px] group-hover:translate-x-1.5 transition-transform text-bone-ivory">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Wing Terminal (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-gutter">
                {/* Figurine Triad Artwork Panel */}
                <div className="bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-sm border border-void-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blood-crimson"></span>
                      <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-widest font-bold">
                        CURSED FIGURINE CODEX
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-pumpkin-orange font-mono">TIER-1 ARCHETYPE</span>
                  </div>
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-ink-black flex items-center justify-center group border border-void-border">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt="Cursed Figurine Codex"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBov4-pf8mGHFXqBnRcuFaoe4Qj1dV1aBamUt1QOttEkUQH2V8EuMwGyRx338Y_AbF0A-LvQtzqToLtcrxaMmk3oiiqqEJ6F7cU2JmiN5No7BQC8yR50k6ktB7wOVXDQOZNorNkppf4NUbnMvO8YIxiVqrWQUIumsmQlf8p5vAjoQqSVHahFuPzGHURnPoEs5eca-DbMTGY-YylK0npMqeNUXSGWECCk67xNk8-F1YA6EICosBMv3d6"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-85"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-bone-ivory uppercase tracking-wider drop-shadow-md">
                        TRINITY OF DESPAIR
                      </span>
                      <span className="px-2 py-0.5 bg-blood-crimson text-bone-ivory font-label-sm text-label-sm uppercase tracking-widest font-mono">
                        SEASON IV: ECLIPSE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Telemetry Grid */}
                <div className="bg-surface-container-low p-space-md shadow-xl flex flex-col gap-space-sm border border-void-border">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-bone-ivory uppercase tracking-widest font-bold">
                      ARENA INFRASTRUCTURE TELEMETRY
                    </span>
                    <span className="text-blood-crimson text-label-sm font-mono">[OPTIMAL]</span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs font-mono text-label-sm">
                    <div className="bg-surface-container-lowest p-space-sm flex flex-col gap-1 border border-void-border">
                      <span className="text-bone-ivory-muted text-label-sm">MATCHMAKING LATENCY</span>
                      <div className="flex items-center justify-between">
                        <span className="text-pumpkin-orange font-bold text-label-md">12.4 MS</span>
                        <span className="w-1.5 h-1.5 bg-pumpkin-orange"></span>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm flex flex-col gap-1 border border-void-border">
                      <span className="text-bone-ivory-muted text-label-sm">STOCKFISH WASM</span>
                      <div className="flex items-center justify-between">
                        <span className="text-blood-crimson-bright font-bold text-label-md">ARMED</span>
                        <span className="w-1.5 h-1.5 bg-blood-crimson-bright animate-pulse"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from './lib/supabase';

interface AuthPageProps {
  onAuth: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

export default function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } }
        });
        if (signUpError) throw signUpError;
        
        onAuth({ name: name || email.split('@')[0], email });
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;

        onAuth({ 
          name: data.user?.user_metadata?.display_name || email.split('@')[0], 
          email: data.user?.email || ''
        });
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('DATABASE OFFLINE: Please provide your Supabase API keys to the system.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center justify-center p-space-md relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-tertiary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <button className="flex items-center gap-2 text-on-surface-variant hover:text-bone-ivory font-label-sm uppercase tracking-wider mb-space-lg transition-colors" onClick={onBack}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Return to Arena</span>
        </button>

        <div className="bg-surface-card border border-surface-container-high shadow-2xl rounded-xl overflow-hidden">
          <div className="p-space-lg flex flex-col items-center border-b border-surface-container-high bg-surface-container-low">
            <h1 className="font-display-lg text-display-lg text-bone-ivory uppercase tracking-tight text-center">
              {mode === 'login' ? 'ENTER THE SANCTUM' : 'FORGE YOUR BLOODLINE'}
            </h1>
            <p className="font-label-sm text-primary uppercase tracking-widest mt-1 text-center">
              {mode === 'login' ? '[ ALREADY INITIATED ]' : '[ NEW COMBATANT REGISTRATION ]'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-space-lg flex flex-col gap-space-md">
            {error && (
              <div className="bg-error-container/20 border border-error text-error p-3 rounded font-label-sm uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-bone-ivory uppercase tracking-wider">Combatant Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-surface-dark border border-surface-container-high rounded p-3 text-bone-ivory font-body-md focus:border-primary-container focus:outline-none transition-colors"
                  placeholder="e.g. Valkyrie_Zero"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-bone-ivory uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-surface-dark border border-surface-container-high rounded p-3 text-bone-ivory font-body-md focus:border-primary-container focus:outline-none transition-colors"
                placeholder="combatant@realm.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-bone-ivory uppercase tracking-wider">Secure Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-surface-dark border border-surface-container-high rounded p-3 text-bone-ivory font-body-md focus:border-primary-container focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-primary-container hover:bg-crimson-glow text-bone-ivory font-headline-md text-headline-md py-3 rounded uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? 'INITIATING...' : (mode === 'login' ? 'COMMENCE COMBAT' : 'JOIN THE HORDE')}
            </button>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-label-sm text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors"
              >
                {mode === 'login' ? 'NO ACCOUNT? REGISTER NOW →' : 'ALREADY REGISTERED? LOG IN →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

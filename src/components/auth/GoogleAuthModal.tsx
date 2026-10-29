import React, { useState } from "react";
import { getCurrentUser, signInWithGoogle, ChaturangaUser } from "../../services/authStore";
import { formatPlayerId } from "../../services/playerId";
import { authConfigured, getSupabase } from "../../lib/supabase";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: ChaturangaUser) => void;
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const currentUser = getCurrentUser();
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google sign up / sign in inputs
  const [name, setName] = useState(
    currentUser.provider === "google" && !currentUser.name.startsWith("Guest")
      ? currentUser.name
      : ""
  );
  const [email, setEmail] = useState(
    currentUser.provider === "google" && !currentUser.email.includes("@chaturanga.local")
      ? currentUser.email
      : ""
  );

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.playerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid Google email address.");
      return;
    }

    setLoading(true);
    try {
      const user = signInWithGoogle({
        name: name.trim(),
        email: email.trim(),
        picture: currentUser.picture || "/illustrations/knight.svg",
        bio: currentUser.bio || "Passionate chess & tactical strategist.",
      });
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Google Sign In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseOAuth = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || "Google OAuth redirect failed. You can sign in using your Google email below.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-title"
    >
      <div className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#F4F4F4] overflow-hidden">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] text-[#8A8A8A] hover:text-white flex items-center justify-center border-none cursor-pointer transition-colors text-sm font-bold"
        >
          ✕
        </button>

        {/* Google Header Branding */}
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-2 shadow-md shrink-0">
            {/* Official Google G Logo SVG */}
            <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#AFF65B] uppercase font-bold">
              GOOGLE IDENTITY & SYNC
            </div>
            <h2 id="google-auth-title" className="matiks-headline text-2xl text-[#F4F4F4] m-0">
              Sign In with Google
            </h2>
          </div>
        </div>

        {/* 8-Digit Player ID Showcase Card */}
        <div className="mt-5 bg-[#1F1F1F] border border-[#AFF65B]/30 rounded-2xl p-4 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#AFF65B] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
              YOUR OFFICIAL 8-DIGIT PLAYER ID
            </span>
            <span className="text-[9px] font-mono text-[#8A8A8A] uppercase">
              1200 Baseline Elo
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#0E0E0E] py-2 px-3.5 rounded-xl border border-white/5">
            <div className="font-mono text-xl sm:text-2xl font-black text-[#AFF65B] tracking-widest select-all">
              {formatPlayerId(currentUser.playerId)}
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-white hover:text-[#AFF65B] text-xs font-mono font-bold rounded-lg border border-white/10 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              {copiedId ? "✓ COPIED" : "📋 COPY ID"}
            </button>
          </div>
          <p className="font-body text-[11px] text-[#8A8A8A] mt-2 mb-0 leading-normal">
            Your permanent 8-digit Player ID is generated by us. Link your Google account so your rating, match history, and friend connections stay saved across devices.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#E5484D]/15 border border-[#E5484D]/40 text-[#FF8585] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Google OAuth One-Click Button */}
        <div className="mt-5">
          <button
            type="button"
            disabled={loading}
            onClick={authConfigured ? handleSupabaseOAuth : undefined}
            className={`w-full py-3.5 px-4 bg-white hover:bg-[#F2F2F2] text-[#1F1F1F] font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer active:scale-[0.99] border-none ${
              !authConfigured ? "opacity-95" : ""
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12c0 2.11.45 3.86 1.24 5.42l4.04-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#141414] px-3 text-[11px] font-mono uppercase text-[#777]">
            Or enter your Google details
          </span>
        </div>

        {/* Google Account Registration / Sign-In Form */}
        <form onSubmit={handleGoogleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5">
              Google Account Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Hunter"
              className="w-full bg-[#1C1C1C] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5">
              Google Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.hunter@gmail.com"
              className="w-full bg-[#1C1C1C] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Sign In with Google & Go to Profile →</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#777]">
          <span>Direct redirection to Profile Page</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer text-xs"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

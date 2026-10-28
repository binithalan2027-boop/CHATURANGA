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
  const [tab, setTab] = useState<"quick" | "custom">("quick");
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Custom Google account form state
  const [name, setName] = useState(
    currentUser.provider === "google" ? currentUser.name : ""
  );
  const [email, setEmail] = useState(
    currentUser.provider === "google" ? currentUser.email : ""
  );
  const [bio, setBio] = useState(currentUser.bio || "Passionate chess & math player.");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentUser.picture || "/illustrations/knight.svg"
  );

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.playerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleQuickSignIn = (accountName: string, accountEmail: string, avatarUrl: string) => {
    setLoading(true);
    setError("");
    try {
      const user = signInWithGoogle({
        name: accountName,
        email: accountEmail,
        picture: avatarUrl,
        bio: bio || "Tactical chess player on Chaturanga.",
      });
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Google Sign In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid Google email address.");
      return;
    }
    handleQuickSignIn(name, email, selectedAvatar);
  };

  const handleSupabaseOAuth = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || "Google OAuth redirect failed.");
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
              GOOGLE IDENTITY & SOCIAL SYNC
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
              Standard 1200 Elo
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
            Your unique 8-digit Player ID is generated by us. Share it with friends so they can easily find, add, and match with you in real-time.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#E5484D]/15 border border-[#E5484D]/40 text-[#FF8585] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-[#0E0E0E] rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setTab("quick")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${
              tab === "quick"
                ? "bg-[#2A2A2A] text-[#AFF65B] font-bold"
                : "bg-transparent text-[#8A8A8A] hover:text-white"
            }`}
          >
            One-Tap Google Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("custom")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors ${
              tab === "custom"
                ? "bg-[#2A2A2A] text-[#AFF65B] font-bold"
                : "bg-transparent text-[#8A8A8A] hover:text-white"
            }`}
          >
            Custom Account Setup
          </button>
        </div>

        {/* Tab 1: One-Tap Google Sign In */}
        {tab === "quick" && (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-[#AAA] m-0">
              Select your Google profile to instantly sign in and link your 8-digit Player ID:
            </p>

            {/* Quick Account 1: Vinit Sharma */}
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleQuickSignIn(
                  "Vinit Sharma",
                  "vinz97512@gmail.com",
                  "/illustrations/knight.svg"
                )
              }
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1C1C] hover:bg-[#262626] border border-white/10 hover:border-[#AFF65B]/60 cursor-pointer transition-all text-left group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EA4335] text-white font-bold flex items-center justify-center text-sm shadow-md">
                  V
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-[#AFF65B] transition-colors">
                    Vinit Sharma
                  </div>
                  <div className="text-xs text-[#8A8A8A] font-mono">
                    vinz97512@gmail.com
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#AFF65B] bg-[#AFF65B]/10 py-1 px-2.5 rounded-lg border border-[#AFF65B]/20">
                Continue →
              </span>
            </button>

            {/* Quick Account 2: Active Player Account */}
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleQuickSignIn(
                  currentUser.name.startsWith("Guest") ? "Google Player" : currentUser.name,
                  currentUser.email.includes("@chaturanga.local")
                    ? "player.chaturanga@gmail.com"
                    : currentUser.email,
                  "/illustrations/rook.svg"
                )
              }
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1C1C] hover:bg-[#262626] border border-white/10 hover:border-[#AFF65B]/60 cursor-pointer transition-all text-left group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white font-bold flex items-center justify-center text-sm shadow-md">
                  G
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-[#AFF65B] transition-colors">
                    {currentUser.name.startsWith("Guest") ? "Google Player" : currentUser.name}
                  </div>
                  <div className="text-xs text-[#8A8A8A] font-mono">
                    {currentUser.email.includes("@chaturanga.local")
                      ? "player.chaturanga@gmail.com"
                      : currentUser.email}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#AFF65B] bg-[#AFF65B]/10 py-1 px-2.5 rounded-lg border border-[#AFF65B]/20">
                Continue →
              </span>
            </button>

            {/* Supabase OAuth redirect if enabled */}
            {authConfigured && (
              <button
                type="button"
                disabled={loading}
                onClick={handleSupabaseOAuth}
                className="w-full py-3 bg-white hover:bg-[#F0F0F0] text-[#111] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md mt-2"
              >
                Sign in with Official Google OAuth (Redirect)
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Custom Google Account Form */}
        {tab === "custom" && (
          <form onSubmit={handleCustomSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                Your Full Name (from Google)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vinit Sharma"
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
                placeholder="e.g. vinz97512@gmail.com"
                className="w-full bg-[#1C1C1C] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                Player Avatar Selection
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: "/illustrations/knight.svg", label: "Knight" },
                  { id: "/illustrations/rook.svg", label: "Rook" },
                  { id: "/illustrations/bishop.svg", label: "Bishop" },
                  { id: "/illustrations/queen.svg", label: "Queen" },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAvatar(a.id)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-1 ${
                      selectedAvatar === a.id
                        ? "bg-[#262626] border-[#AFF65B]"
                        : "bg-[#1C1C1C] border-white/5 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={a.id} alt={a.label} className="w-8 h-8 object-contain" />
                    <span className="text-[10px] font-mono text-[#AAA]">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5">
                Player Bio
              </label>
              <textarea
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your chess style or favorite variant..."
                rows={2}
                className="w-full bg-[#1C1C1C] text-white text-xs px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg active:scale-95"
            >
              Complete Google Sign In & Save Player ID
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#777]">
          <span>Provisional 1200 Starting Elo</span>
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

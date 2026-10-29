import React, { useState, useEffect } from "react";
import { getCurrentUser, signInWithGoogle, ChaturangaUser } from "../../services/authStore";
import { formatPlayerId } from "../../services/playerId";
import { authConfigured, getSupabase } from "../../lib/supabase";
import { getBaseUrl } from "../../online/client";

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
  const [step, setStep] = useState<"email" | "verify">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Step 1: Name and Email
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

  // Step 2: 6-Digit Verification Code
  const [code, setCode] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Timer countdown for resending code
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Reset modal state whenever opened
  useEffect(() => {
    if (isOpen) {
      setError("");
      setInfoMsg("");
      setCode("");
      setSimulatedCode(null);
      setStep("email");
      const user = getCurrentUser();
      if (user.provider === "google" && !user.name.startsWith("Guest")) {
        setName(user.name);
      }
      if (user.provider === "google" && !user.email.includes("@chaturanga.local")) {
        setEmail(user.email);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.playerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const callAuthApi = async (path: string, payload: any) => {
    const base = getBaseUrl();
    const fullUrl = `${base}${path}`;
    try {
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch {
      // Fallback to relative URL
      const fallbackRes = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await fallbackRes.json();
    }
  };

  // Step 1: Send verification code to email
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid Google email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await callAuthApi("/api/auth/send-code", {
        name: cleanName,
        email: cleanEmail,
      });

      if (!data.ok) {
        throw new Error(data.error || "Failed to send verification code. Please check your email.");
      }

      setStep("verify");
      setCountdown(30);

      if (data.simulated && data.code) {
        setSimulatedCode(data.code);
        setInfoMsg(`A 6-digit verification code has been generated for ${cleanEmail}.`);
      } else {
        setInfoMsg(`We sent a 6-digit verification code to ${cleanEmail}. Please check your inbox.`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and finish sign in
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = code.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const data = await callAuthApi("/api/auth/verify-code", {
        email: cleanEmail,
        code: cleanCode,
      });

      if (!data.ok || !data.verified) {
        throw new Error(data.error || "Incorrect or expired verification code.");
      }

      // Success: Save user profile with emailVerified: true
      const user = signInWithGoogle({
        name: cleanName,
        email: cleanEmail,
        emailVerified: true,
        picture: currentUser.picture || "/illustrations/knight.svg",
        bio: currentUser.bio || "Passionate chess & tactical strategist.",
      });

      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please check the code and try again.");
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

  const handleOAuthClick = () => {
    if (authConfigured) {
      handleSupabaseOAuth();
    } else {
      // Guide user to email verification
      setError("");
      setInfoMsg("Enter your Google account email below to receive a secure 6-digit verification code.");
      const emailInput = document.getElementById("google-auth-email");
      if (emailInput) {
        emailInput.focus();
      }
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
              GOOGLE IDENTITY & EMAIL VERIFICATION
            </div>
            <h2 id="google-auth-title" className="matiks-headline text-2xl text-[#F4F4F4] m-0">
              {step === "email" ? "Sign In with Google" : "Verify Your Email"}
            </h2>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4 text-[11px] font-mono font-semibold">
          <span
            className={`px-2.5 py-1 rounded-lg ${
              step === "email"
                ? "bg-[#AFF65B] text-[#0E0E0E] font-bold"
                : "bg-white/10 text-[#AFF65B]"
            }`}
          >
            1. Email Details
          </span>
          <span className="text-[#666]">→</span>
          <span
            className={`px-2.5 py-1 rounded-lg ${
              step === "verify"
                ? "bg-[#AFF65B] text-[#0E0E0E] font-bold"
                : "bg-white/5 text-[#888]"
            }`}
          >
            2. Verify 6-Digit Code
          </span>
        </div>

        {/* 8-Digit Player ID Showcase Card */}
        <div className="mt-4 bg-[#1F1F1F] border border-[#AFF65B]/30 rounded-2xl p-3.5 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#AFF65B] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#AFF65B] animate-pulse" />
              OFFICIAL 8-DIGIT PLAYER ID
            </span>
            <span className="text-[9px] font-mono text-[#8A8A8A] uppercase">
              1200 Baseline Elo
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#0E0E0E] py-2 px-3.5 rounded-xl border border-white/5">
            <div className="font-mono text-lg sm:text-xl font-black text-[#AFF65B] tracking-widest select-all">
              {formatPlayerId(currentUser.playerId)}
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="px-2.5 py-1 bg-[#262626] hover:bg-[#333] text-white hover:text-[#AFF65B] text-[11px] font-mono font-bold rounded-lg border border-white/10 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              {copiedId ? "✓ COPIED" : "📋 COPY ID"}
            </button>
          </div>
          <p className="font-body text-[11px] text-[#8A8A8A] mt-2 mb-0 leading-normal">
            Your permanent 8-digit Player ID is generated by us. Verifying your Google email connects your profile and ensures your rating and match history stay isolated and secure.
          </p>
        </div>

        {/* Alerts: Error & Info */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#E5484D]/15 border border-[#E5484D]/40 text-[#FF8585] text-xs font-semibold">
            {error}
          </div>
        )}
        {infoMsg && !error && (
          <div className="mt-4 p-3 rounded-xl bg-[#AFF65B]/10 border border-[#AFF65B]/30 text-[#AFF65B] text-xs font-medium">
            {infoMsg}
          </div>
        )}

        {/* STEP 1: Enter Name and Google Email */}
        {step === "email" && (
          <>
            {/* Google OAuth One-Click Button */}
            <div className="mt-4">
              <button
                type="button"
                disabled={loading}
                onClick={handleOAuthClick}
                className="w-full py-3 px-4 bg-white hover:bg-[#F2F2F2] text-[#1F1F1F] font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer active:scale-[0.99] border-none"
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

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#141414] px-3 text-[11px] font-mono uppercase text-[#777]">
                Or verify with your Google email
              </span>
            </div>

            {/* Email Code Request Form */}
            <form onSubmit={handleRequestCode} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1">
                  Google Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full bg-[#1C1C1C] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1">
                  Google Email Address
                </label>
                <input
                  id="google-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.hunter@gmail.com"
                  className="w-full bg-[#1C1C1C] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                />
                <span className="block text-[10px] text-[#777] mt-1">
                  We'll send a 6-digit verification code to confirm ownership.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Sending Verification Code…</span>
                ) : (
                  <span>Send 6-Digit Verification Code →</span>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Enter 6-digit OTP code */}
        {step === "verify" && (
          <div className="mt-4">
            {/* Simulated Demo Mode Banner */}
            {simulatedCode && (
              <div className="mb-4 p-3 rounded-2xl bg-[#AFF65B]/10 border border-[#AFF65B]/40 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#AFF65B] block">
                    ⚡ Demo Mode Verification Code:
                  </span>
                  <span className="font-mono text-xl font-black text-white tracking-widest">
                    {simulatedCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(simulatedCode)}
                  className="px-3 py-1.5 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-mono text-[11px] font-bold rounded-xl border-none cursor-pointer transition-all active:scale-95"
                >
                  Insert Code
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5 flex items-center justify-between">
                  <span>Enter 6-Digit Verification Code</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setInfoMsg("");
                    }}
                    className="text-[#AFF65B] hover:underline bg-transparent border-none cursor-pointer text-[10px] lowercase"
                  >
                    change email
                  </button>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full bg-[#1C1C1C] text-[#AFF65B] text-center text-2xl font-mono font-bold tracking-[8px] py-3 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none"
                />
                <span className="block text-[11px] text-[#888] mt-1.5 text-center">
                  Enter the 6-digit code sent to <strong className="text-white">{email}</strong>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length < 6}
                className="w-full py-3.5 bg-[#AFF65B] hover:bg-white text-[#0E0E0E] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Verifying Code…</span>
                ) : (
                  <span>Verify Code & Access Profile →</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="text-[#888] hover:text-white bg-transparent border-none cursor-pointer"
                >
                  ← Back to Email
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={() => handleRequestCode()}
                  className="text-[#AFF65B] hover:underline bg-transparent border-none cursor-pointer disabled:text-[#666] disabled:no-underline"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-[#777]">
          <span>Email ownership verified via secure OTP</span>
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

import React, { useState, useEffect } from "react";
import { submitFeedback, FeedbackSubmission, getFeedbackList } from "../../services/feedbackStore";
import { ChaturangaUser } from "../../services/authStore";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: ChaturangaUser | null;
  initialTab?: "modes" | "working" | "not_working" | "all";
}

const NEW_MODE_CHIPS = [
  { id: "duck", label: "🦆 Duck Chess" },
  { id: "horde", label: "♟️ Horde Mode" },
  { id: "antichess", label: "🔄 Antichess" },
  { id: "crazyhouse", label: "🏰 Crazyhouse" },
  { id: "four_player", label: "👥 4-Player Chess" },
  { id: "spell_chess", label: "🔮 Spell Chess" },
  { id: "puzzle_rush", label: "⚡ Puzzle Rush" },
  { id: "daily_puzzles", label: "🎯 Daily Endgame Puzzles" },
  { id: "harder_bots", label: "🤖 Stockfish 16 Max" },
  { id: "mobile_pwa", label: "📱 Mobile App / PWA" },
];

const WORKING_CHIPS = [
  { id: "piece_glide", label: "⚡ Piece Glide Motion" },
  { id: "black_rotation", label: "🔄 Rotated Black Board" },
  { id: "math_duel", label: "🧠 Math Duel / Gate" },
  { id: "bot_ratings", label: "🤖 Bot Elo Scaling" },
  { id: "dark_theme", label: "🖤 Dark Minimalist Theme" },
  { id: "achievements", label: "🏆 Stamp Achievements" },
  { id: "offline_client", label: "🌐 Fast Offline Mode" },
  { id: "clocks", label: "⏱️ Smooth Chess Clocks" },
];

const NOT_WORKING_CHIPS = [
  { id: "clock_delay", label: "⏱️ Clock / Time Lag" },
  { id: "mobile_layout", label: "📱 Mobile Screen Layout" },
  { id: "bot_delay", label: "🤖 Bot Move Delay" },
  { id: "sound_fx", label: "🔊 Sound FX Glitch" },
  { id: "room_join", label: "🌐 Online Room Join Issue" },
  { id: "google_login", label: "🔑 Google Sign In Prompt" },
  { id: "rating_calc", label: "📊 Elo / Rating Stats" },
  { id: "piece_drag", label: "♟️ Piece Drag & Drop Feel" },
];

export default function FeedbackModal({
  isOpen,
  onClose,
  user,
  initialTab = "all",
}: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState<"modes" | "working" | "not_working" | "all">(initialTab);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newModesWanted, setNewModesWanted] = useState("");
  const [whatIsWorking, setWhatIsWorking] = useState("");
  const [whatIsNotWorking, setWhatIsNotWorking] = useState("");
  const [rating, setRating] = useState<"great" | "good" | "okay" | "needs_work" | null>("great");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(
    user?.email && !user.email.includes("@chaturanga.local") ? user.email : ""
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<FeedbackSubmission | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user?.name && !contactName) setContactName(user.name);
    if (user?.email && !user.email.includes("@chaturanga.local") && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasContent =
    selectedTags.length > 0 ||
    newModesWanted.trim().length > 0 ||
    whatIsWorking.trim().length > 0 ||
    whatIsNotWorking.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) return;

    const submission = submitFeedback({
      category: activeTab,
      rating,
      newModesWanted: newModesWanted.trim(),
      whatIsWorking: whatIsWorking.trim(),
      whatIsNotWorking: whatIsNotWorking.trim(),
      selectedTags,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      playerId: user?.playerId,
    });

    setLastSubmission(submission);
    setIsSubmitted(true);
    setHistoryList(getFeedbackList());
  };

  const handleResetForm = () => {
    setSelectedTags([]);
    setNewModesWanted("");
    setWhatIsWorking("");
    setWhatIsNotWorking("");
    setRating("great");
    setIsSubmitted(false);
    setLastSubmission(null);
  };

  const openHistory = () => {
    setHistoryList(getFeedbackList());
    setShowHistory(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#141414] border border-white/10 rounded-3xl shadow-2xl text-[#F4F4F4] overflow-hidden">
        {/* Top Header Bar */}
        <div className="shrink-0 px-6 sm:px-8 pt-6 pb-4 border-b border-white/5 flex items-start justify-between bg-[#181818]/80">
          <div>
            <div className="text-[10px] font-body font-semibold tracking-[2px] text-[#AFF65B] uppercase mb-1 flex items-center gap-2">
              <span>💬</span>
              <span>COMMUNITY FEEDBACK</span>
            </div>
            <h2 id="feedback-title" className="font-heading text-xl sm:text-2xl text-[#F4F4F4] m-0">
              Help Us Improve Chaturanga
            </h2>
            <p className="font-body text-xs text-[#8A8A8A] mt-1 mb-0">
              Tell us what you love, what feels broken, and what new game modes you want next.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] text-[#8A8A8A] hover:text-white flex items-center justify-center border-none cursor-pointer transition-colors text-sm font-bold shrink-0 ml-4"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5">
          {showHistory ? (
            /* Submission History View */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg text-[#F4F4F4] m-0">Your Past Feedback</h3>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-[#AFF65B] bg-transparent border-none cursor-pointer hover:underline"
                >
                  ← Back to feedback form
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="py-8 text-center text-[#8A8A8A] text-xs">
                  No feedback submitted yet.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#1C1C1C] border border-white/5 rounded-2xl p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#8A8A8A]">
                        <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#AFF65B]/10 text-[#AFF65B] uppercase text-[10px] font-bold">
                          {item.category}
                        </span>
                      </div>

                      {item.selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedTags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#282828] text-[#E0E0E0]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.newModesWanted && (
                        <div className="text-xs text-[#F4F4F4] mt-1">
                          <strong className="text-[#AFF65B]">New Modes:</strong> {item.newModesWanted}
                        </div>
                      )}
                      {item.whatIsWorking && (
                        <div className="text-xs text-[#F4F4F4]">
                          <strong className="text-[#38D9A9]">Working:</strong> {item.whatIsWorking}
                        </div>
                      )}
                      {item.whatIsNotWorking && (
                        <div className="text-xs text-[#F4F4F4]">
                          <strong className="text-[#FF6B6B]">Friction/Bug:</strong> {item.whatIsNotWorking}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isSubmitted && lastSubmission ? (
            /* Success Confirmation Screen */
            <div className="py-6 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#AFF65B]/15 border border-[#AFF65B]/40 flex items-center justify-center text-2xl text-[#AFF65B]">
                ✓
              </div>

              <div>
                <h3 className="font-heading text-xl text-[#F4F4F4] m-0">Thank You For Your Feedback!</h3>
                <p className="font-body text-xs text-[#8A8A8A] max-w-md mx-auto mt-2 leading-relaxed">
                  Your suggestions have been recorded and will directly guide the next features,
                  new modes, and bug fixes for Chaturanga.
                </p>
              </div>

              {/* Submission Summary Card */}
              <div className="w-full bg-[#1C1C1C] border border-white/5 rounded-2xl p-4 text-left flex flex-col gap-2 mt-2">
                <div className="text-[10px] font-mono text-[#AFF65B] uppercase tracking-wider">
                  Submission Summary
                </div>
                {lastSubmission.selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lastSubmission.selectedTags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#282828] text-[#F4F4F4]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {lastSubmission.newModesWanted && (
                  <p className="text-xs text-[#F4F4F4] m-0">
                    <strong className="text-[#AFF65B]">New Modes:</strong> {lastSubmission.newModesWanted}
                  </p>
                )}
                {lastSubmission.whatIsWorking && (
                  <p className="text-xs text-[#F4F4F4] m-0">
                    <strong className="text-[#38D9A9]">Working:</strong> {lastSubmission.whatIsWorking}
                  </p>
                )}
                {lastSubmission.whatIsNotWorking && (
                  <p className="text-xs text-[#F4F4F4] m-0">
                    <strong className="text-[#FF6B6B]">Issues Reported:</strong> {lastSubmission.whatIsNotWorking}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn-raised text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Send Another Idea
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-lime text-xs py-2 px-6 rounded-xl font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Active Feedback Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Category Nav Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "all" as const, label: "📋 All-in-One", sub: "Complete" },
                  { id: "modes" as const, label: "💡 New Modes", sub: "What you want" },
                  { id: "working" as const, label: "🌟 Working", sub: "What is good" },
                  { id: "not_working" as const, label: "⚠️ Issues", sub: "Bugs & friction" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-2 rounded-xl text-center border cursor-pointer transition-all ${
                      activeTab === tab.id
                        ? "bg-[#AFF65B]/15 border-[#AFF65B] text-[#F4F4F4] shadow-sm"
                        : "bg-[#1C1C1C] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4] hover:bg-[#222]"
                    }`}
                  >
                    <div className="font-heading text-xs truncate">{tab.label}</div>
                    <div className="text-[9px] font-mono opacity-70 mt-0.5">{tab.sub}</div>
                  </button>
                ))}
              </div>

              {/* 1. What else new modes you want */}
              {(activeTab === "all" || activeTab === "modes") && (
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="new-modes-field"
                      className="font-heading text-sm text-[#F4F4F4] flex items-center gap-2"
                    >
                      <span className="text-base">💡</span>
                      <span>What new modes or variants do you want?</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#8A8A8A]">Select or write</span>
                  </div>

                  {/* Mode suggestion quick chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {NEW_MODE_CHIPS.map((chip) => {
                      const selected = selectedTags.includes(chip.label);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleTag(chip.label)}
                          className={`text-xs py-1 px-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "bg-[#AFF65B]/20 border-[#AFF65B] text-[#AFF65B] font-semibold"
                              : "bg-[#222] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4] hover:bg-[#282828]"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    id="new-modes-field"
                    value={newModesWanted}
                    onChange={(e) => setNewModesWanted(e.target.value)}
                    rows={2}
                    placeholder="e.g. Duck chess, Horde chess, custom piece moves, or a daily puzzle rush mode..."
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-xs text-[#F4F4F4] placeholder-[#555] focus:outline-none focus:border-[#AFF65B]/60 transition-colors resize-none"
                  />
                </div>
              )}

              {/* 2. What is working */}
              {(activeTab === "all" || activeTab === "working") && (
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="working-field"
                      className="font-heading text-sm text-[#F4F4F4] flex items-center gap-2"
                    >
                      <span className="text-base">🌟</span>
                      <span>What is working well?</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#8A8A8A]">What feels great</span>
                  </div>

                  {/* Praise quick chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {WORKING_CHIPS.map((chip) => {
                      const selected = selectedTags.includes(chip.label);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleTag(chip.label)}
                          className={`text-xs py-1 px-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "bg-[#38D9A9]/20 border-[#38D9A9] text-[#38D9A9] font-semibold"
                              : "bg-[#222] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4] hover:bg-[#282828]"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    id="working-field"
                    value={whatIsWorking}
                    onChange={(e) => setWhatIsWorking(e.target.value)}
                    rows={2}
                    placeholder="e.g. Love the rotated board for Black, piece glide is snappy, math duel format is fun..."
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-xs text-[#F4F4F4] placeholder-[#555] focus:outline-none focus:border-[#AFF65B]/60 transition-colors resize-none"
                  />
                </div>
              )}

              {/* 3. What is not working for the app */}
              {(activeTab === "all" || activeTab === "not_working") && (
                <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="not-working-field"
                      className="font-heading text-sm text-[#F4F4F4] flex items-center gap-2"
                    >
                      <span className="text-base">⚠️</span>
                      <span>What is not working or feels friction?</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#8A8A8A]">Bugs & pain points</span>
                  </div>

                  {/* Friction quick chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {NOT_WORKING_CHIPS.map((chip) => {
                      const selected = selectedTags.includes(chip.label);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleTag(chip.label)}
                          className={`text-xs py-1 px-2.5 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "bg-[#FF6B6B]/20 border-[#FF6B6B] text-[#FF6B6B] font-semibold"
                              : "bg-[#222] border-white/5 text-[#8A8A8A] hover:text-[#F4F4F4] hover:bg-[#282828]"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    id="not-working-field"
                    value={whatIsNotWorking}
                    onChange={(e) => setWhatIsNotWorking(e.target.value)}
                    rows={2}
                    placeholder="e.g. Clock had a small delay, button on mobile was hard to tap, piece drag froze once..."
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-xs text-[#F4F4F4] placeholder-[#555] focus:outline-none focus:border-[#FF6B6B]/60 transition-colors resize-none"
                  />
                </div>
              )}

              {/* Overall Satisfaction */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-xs font-body text-[#8A8A8A]">Overall app experience:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "great" as const, emoji: "😍", label: "Great" },
                    { id: "good" as const, emoji: "😊", label: "Good" },
                    { id: "okay" as const, emoji: "😐", label: "Okay" },
                    { id: "needs_work" as const, emoji: "🙁", label: "Needs Work" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRating(r.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs border cursor-pointer transition-colors flex items-center gap-1 ${
                        rating === r.id
                          ? "bg-[#AFF65B]/20 border-[#AFF65B] text-[#F4F4F4]"
                          : "bg-[#1E1E1E] border-white/5 text-[#8A8A8A] hover:bg-[#252525]"
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[11px]">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Contact Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label htmlFor="contact-name" className="text-[11px] font-body text-[#8A8A8A] block mb-1">
                    Your Name or Handle (Optional)
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Grandmaster"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-2.5 text-xs text-[#F4F4F4] placeholder-[#555] focus:outline-none focus:border-[#AFF65B]/60"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="text-[11px] font-body text-[#8A8A8A] block mb-1">
                    Email / Discord for follow-up (Optional)
                  </label>
                  <input
                    id="contact-email"
                    type="text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-2.5 text-xs text-[#F4F4F4] placeholder-[#555] focus:outline-none focus:border-[#AFF65B]/60"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={openHistory}
                  className="text-xs text-[#8A8A8A] hover:text-[#AFF65B] bg-transparent border-none cursor-pointer flex items-center gap-1"
                >
                  <span>📜</span>
                  <span>View My Past Submissions</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-raised text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasContent}
                    className={`text-xs py-2 px-6 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      hasContent
                        ? "bg-[#AFF65B] hover:bg-[#9ee44a] text-[#0E0E0E] shadow-md shadow-[#AFF65B]/20"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    🚀 Submit Feedback
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

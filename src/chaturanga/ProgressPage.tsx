import { useState, useMemo } from "react";
import { loadStore, drillStats } from "./drills";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_SETS,
  getUnlockedAchievementIds,
  getAchievementProgress,
  isAchievementUnlocked,
  type Achievement,
} from "./achievements";
import StampTile from "./StampTile";

export interface ProgressPageProps {
  onBack?: () => void;
  onOpenStampBook?: () => void;
  onOpenDrills?: () => void;
}

export default function ProgressPage({
  onBack,
  onOpenStampBook,
  onOpenDrills,
}: ProgressPageProps) {
  const [store] = useState(() => loadStore());
  const stats = useMemo(() => drillStats(store), [store]);
  const progress = useMemo(() => getAchievementProgress(), []);
  const unlockedIds = useMemo(() => getUnlockedAchievementIds(), []);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Determine latest unlocked stamp (or fallback to first milestone)
  const latestStamp: Achievement = useMemo(() => {
    if (unlockedIds.length > 0) {
      const lastId = unlockedIds[unlockedIds.length - 1];
      const match = ACHIEVEMENTS.find((a) => a.id === lastId);
      if (match) return match;
    }
    // Default showcase
    return ACHIEVEMENTS[0];
  }, [unlockedIds]);

  const hasUnlockedAny = unlockedIds.length > 0;

  // Next milestone: first locked achievement
  const nextMilestone = useMemo(() => {
    return ACHIEVEMENTS.find((a) => !isAchievementUnlocked(a.id)) || null;
  }, []);

  const displayedAchievements = useMemo(() => {
    if (activeTab === "all") return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.set === activeTab);
  }, [activeTab]);

  // Days of current week (Monday through Sunday)
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const letters = ["M", "T", "W", "T", "F", "S", "S"];
    return letters.map((dayLetter, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(10);
      const isToday = i === dayOfWeek;
      const isPast = i < dayOfWeek;
      const isFuture = i > dayOfWeek;
      const solved = (store.days[dateStr]?.solved ?? 0) > 0;
      return {
        dayLetter,
        dateStr,
        isToday,
        isPast,
        isFuture,
        solved,
      };
    });
  }, [store]);

  return (
    <div
      className="w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4] py-8 px-4 sm:px-6 lg:px-8 select-none"
      style={{
        backgroundImage: `radial-gradient(rgba(217,213,199,0.045) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs text-[#8A8A8A] hover:text-[#AFF65B] font-body uppercase tracking-wider bg-transparent border-0 cursor-pointer p-0 mr-2"
                >
                  ← Home
                </button>
              )}
              <span className="matiks-kicker text-xs tracking-widest text-[#AFF65B] uppercase">
                STREAKS &amp; ACHIEVEMENTS
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl text-white tracking-wide uppercase m-0">
              PLAYER PROGRESS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {onOpenStampBook && (
              <button
                type="button"
                onClick={onOpenStampBook}
                className="py-2.5 px-5 bg-[#262626] hover:bg-[#333] text-white font-body text-xs font-semibold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                Stamp Book ({progress.unlocked}/{progress.total}) →
              </button>
            )}
          </div>
        </header>

        {/* Responsive Grid: Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Streaks Card + Stamp Book Preview */}
          <div className="md:col-span-7 space-y-6">
            {/* 1. Training Streak Card */}
            <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:p-7 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="matiks-kicker text-[11px] text-[#AFF65B] block mb-1">
                    TRAINING STREAK
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-6xl sm:text-7xl text-[#AFF65B] leading-none tracking-wider">
                      {stats.streak}
                    </span>
                    <span className="font-body text-sm font-bold text-[#8A8A8A] uppercase tracking-wider">
                      {stats.streak === 1 ? "DAY" : "DAYS"}
                    </span>
                  </div>
                </div>

                {onOpenDrills && (
                  <button
                    type="button"
                    onClick={onOpenDrills}
                    className="py-2 px-3.5 bg-[#AFF65B]/15 hover:bg-[#AFF65B]/25 text-[#AFF65B] font-body text-xs font-bold uppercase tracking-wider rounded-xl border border-[#AFF65B]/30 cursor-pointer transition-all"
                  >
                    Solve Drill →
                  </button>
                )}
              </div>

              {/* 7 Day Squares: M-S */}
              <div className="my-5">
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {weekDays.map((day, idx) => {
                    const isSolved = day.solved;
                    const isPendingToday = day.isToday && !isSolved;

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-[#8A8A8A]">
                          {day.dayLetter}
                        </span>
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-heading text-lg transition-all ${
                            isSolved
                              ? "bg-[#AFF65B] text-[#0E0E0E] shadow-[0_0_12px_rgba(175,246,91,0.3)] font-bold"
                              : isPendingToday
                                ? "border-2 border-dashed border-[#AFF65B] bg-transparent text-[#AFF65B] animate-pulse"
                                : day.isPast
                                  ? "bg-[#262626] border border-white/5 text-[#555]"
                                  : "bg-[#161616] border border-white/5 text-[#444]"
                          }`}
                        >
                          {isSolved ? "✓" : isPendingToday ? "?" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Required Caption */}
              <p className="text-xs text-[#8A8A8A] font-body italic m-0 pt-2 border-t border-white/5">
                Solve at least one drill today to keep the streak alive.
              </p>
            </section>

            {/* 2. Collection Progress Card */}
            <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="matiks-kicker text-[11px] text-[#AFF65B] block mb-1">
                    COLLECTION PROGRESS
                  </span>
                  <h3 className="font-heading text-2xl text-white tracking-wide m-0">
                    STAMP ALBUM
                  </h3>
                </div>
                {/* Dynamically calculated n / N counter */}
                <div className="font-heading text-2xl text-white">
                  <span className="text-[#AFF65B]">{progress.unlocked}</span>
                  <span className="text-[#8A8A8A]"> / {progress.total}</span>
                  <span className="text-xs font-body text-[#8A8A8A] ml-1 uppercase">
                    COLLECTED
                  </span>
                </div>
              </div>

              {/* 3x2 Grid preview using StampTile */}
              <div className="grid grid-cols-3 gap-3 my-4">
                {ACHIEVEMENTS.slice(0, 6).map((ach) => (
                  <StampTile
                    key={ach.id}
                    achievement={ach}
                    size="sm"
                    onClick={onOpenStampBook}
                  />
                ))}
              </div>

              {/* Ghost Open Stamp Book Button */}
              {onOpenStampBook && (
                <button
                  type="button"
                  onClick={onOpenStampBook}
                  className="w-full py-3 bg-[#262626] hover:bg-[#333] text-white font-body text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md mt-2"
                >
                  Open Full Stamp Book ({progress.unlocked}/{progress.total}) →
                </button>
              )}
            </section>
          </div>

          {/* Right Column: Latest Stamp Card + Desktop Next Milestone */}
          <div className="md:col-span-5 space-y-6">
            {/* 3. Latest Stamp Card */}
            <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <span className="matiks-kicker text-[11px] text-[#AFF65B] block mb-1">
                  LATEST UNLOCKED STAMP
                </span>
                <h3 className="font-heading text-2xl text-white tracking-wide m-0 mb-4">
                  {hasUnlockedAny ? latestStamp.title : "FIRST MILESTONE"}
                </h3>

                <div className="flex items-center justify-center p-4 bg-[#141414] rounded-2xl border border-white/5 my-3">
                  <StampTile
                    achievement={latestStamp}
                    size="lg"
                    onClick={onOpenStampBook}
                  />
                </div>

                <div className="text-center space-y-1.5 mt-4">
                  <div className="font-heading text-xl text-white tracking-wide">
                    {latestStamp.title}
                  </div>
                  <p className="text-xs text-[#8A8A8A] font-body leading-relaxed m-0">
                    {latestStamp.description}
                  </p>
                  <div className="pt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        hasUnlockedAny
                          ? "bg-[#AFF65B]/15 text-[#AFF65B] border border-[#AFF65B]/30"
                          : "bg-[#262626] text-[#8A8A8A] border border-white/10"
                      }`}
                    >
                      {hasUnlockedAny ? "STAMP COLLECTED" : "LOCKED"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Desktop-only Next Milestone Card */}
            {nextMilestone && (
              <section className="hidden md:block bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 shadow-xl">
                <span className="matiks-kicker text-[11px] text-[#F2D500] block mb-1">
                  NEXT TARGET MILESTONE
                </span>
                <h3 className="font-heading text-xl text-white tracking-wide m-0 mb-2">
                  {nextMilestone.title}
                </h3>
                <p className="text-xs text-[#8A8A8A] font-body leading-relaxed m-0 mb-4">
                  {nextMilestone.description}
                </p>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-[#8A8A8A] mb-1.5">
                    <span>Overall Progress</span>
                    <span className="text-[#AFF65B]">
                      {progress.unlocked} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#262626] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-[#AFF65B] rounded-full transition-all duration-500"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* 5. Category Tabs: Browse & Showcase All Stamps by Category */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-[22px] p-6 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
            <div>
              <span className="matiks-kicker text-[11px] text-[#AFF65B] block mb-1">
                STAMPS SHOWCASE
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl text-white tracking-wide uppercase m-0">
                BROWSE BY CATEGORY
              </h2>
            </div>
            <div className="font-heading text-xl text-white">
              <span className="text-[#AFF65B]">
                {displayedAchievements.filter((a) => isAchievementUnlocked(a.id)).length}
              </span>
              <span className="text-[#8A8A8A]"> / {displayedAchievements.length}</span>
              <span className="text-xs font-body text-[#8A8A8A] ml-1 uppercase">UNLOCKED</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              className={`py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#AFF65B] text-[#0E0E0E] font-bold shadow"
                  : "bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4] border border-white/5"
              }`}
            >
              All Stamps ({progress.unlocked}/{progress.total})
            </button>
            {ACHIEVEMENT_SETS.map((s) => {
              const count = ACHIEVEMENTS.filter((a) => a.set === s.id).length;
              const unlocked = ACHIEVEMENTS.filter((a) => a.set === s.id && isAchievementUnlocked(a.id)).length;
              const isSelected = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(s.id)}
                  className={`py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#AFF65B] text-[#0E0E0E] font-bold shadow"
                      : "bg-[#262626] text-[#8A8A8A] hover:text-[#F4F4F4] border border-white/5"
                  }`}
                >
                  {s.name.replace(" Set", "")} ({unlocked}/{count})
                </button>
              );
            })}
          </div>

          {/* Stamps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {displayedAchievements.map((ach) => (
              <StampTile
                key={ach.id}
                achievement={ach}
                size="sm"
                onClick={onOpenStampBook}
              />
            ))}
          </div>

          {onOpenStampBook && (
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#8A8A8A] font-body">
                Showing {displayedAchievements.length} stamps in {activeTab === "all" ? "all categories" : `${activeTab} category`}
              </span>
              <button
                type="button"
                onClick={onOpenStampBook}
                className="py-2.5 px-5 bg-[#262626] hover:bg-[#333] text-white text-xs font-semibold uppercase tracking-wider rounded-xl border border-white/10 cursor-pointer transition-all active:scale-95 shadow"
              >
                Open Full Stamp Album →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
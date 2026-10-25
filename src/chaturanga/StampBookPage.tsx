import { useState } from 'react';
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  isAchievementUnlocked,
  Achievement
} from './achievements';
import StampTile from './StampTile';

interface StampBookPageProps {
  onBack?: () => void;
  onPlay?: () => void;
}

export default function StampBookPage({ onPlay, onBack }: StampBookPageProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const progress = getAchievementProgress();

  const sets = [
    { id: 'variant', name: 'Variant Set', desc: 'Rules from Fischer 960 to Atomic detonations' },
    { id: 'chess-mm', name: 'Chess MM Set', desc: 'Mental mathematics, speed duels & spellcraft' },
    { id: 'training', name: 'Training Set', desc: 'Tactical milestones, openings & mating sprints' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#0E0E0E] text-[#F4F4F4] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation & Return */}
        {onBack && (
          <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#8A8A8A] hover:text-[#AFF65B] font-body text-xs font-semibold uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
            >
              ← Return Home
            </button>
            <div className="hidden sm:block matiks-kicker">ALBUM COLLECTION</div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="matiks-kicker mb-1">COLLECTIBLE ACHIEVEMENTS</div>
            <h1 className="matiks-headline text-4xl sm:text-6xl text-[#F4F4F4]">
              STAMP BOOK
            </h1>
            <p className="font-body text-sm text-[#8A8A8A] max-w-lg mt-1">
              Earn vintage perforated stamps by conquering unique chess variants, mastering mental math duels, and solving tactical trials.
            </p>
          </div>

          {/* Big fraction readout */}
          <div className="flex items-center gap-4 bg-[#1A1A1A] border border-white/5 px-6 py-4 rounded-2xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-body uppercase tracking-wider text-[#8A8A8A]">COLLECTED</span>
              <div className="font-heading text-4xl leading-none">
                <span className="text-[#AFF65B]">{progress.unlocked}</span>
                <span className="text-[#8A8A8A]"> / {progress.total}</span>
              </div>
            </div>
            {/* Circular progress visual */}
            <div className="w-12 h-12 rounded-full border-4 border-[#262626] border-t-[#AFF65B] flex items-center justify-center font-body text-xs font-bold text-[#AFF65B]">
              {progress.percentage}%
            </div>
          </div>
        </div>

        {/* Milestone Stepper Trail */}
        <div className="my-8 bg-[#1A1A1A] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="matiks-kicker">MILESTONE TRAIL</span>
            <span className="font-body text-xs text-[#8A8A8A] hidden sm:inline">
              Next milestone at {progress.unlocked < 4 ? '4' : progress.unlocked < 7 ? '7' : '10'} stamps
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="relative flex items-center justify-between px-4 py-2 min-w-[320px]">
              {/* Connecting line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#262626] z-0" />
              <div
                className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-[#AFF65B] z-0 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (progress.unlocked / progress.total) * 90))}%` }}
              />

              {[
                { milestone: 1, label: 'First Blood' },
                { milestone: 4, label: 'Variant Scout' },
                { milestone: 7, label: 'Tactician' },
                { milestone: 10, label: 'Grand Collector' },
              ].map((node) => {
                const reached = progress.unlocked >= node.milestone;
                return (
                  <div key={node.milestone} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm transition-all duration-300 ${
                        reached
                          ? 'bg-[#AFF65B] text-[#0E0E0E] shadow-[0_0_12px_rgba(175,246,91,0.5)]'
                          : 'bg-[#262626] text-[#8A8A8A] border border-white/10'
                      }`}
                    >
                      {reached ? '✓' : node.milestone}
                    </div>
                    <span className="text-[10px] font-body text-[#8A8A8A] mt-2 text-center whitespace-nowrap">
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sets Section */}
        <div className="flex flex-col gap-10">
          {sets.map((s) => {
            const setAchievements = ACHIEVEMENTS.filter((a) => a.set === s.id);
            const setUnlocked = setAchievements.filter((a) => isAchievementUnlocked(a.id)).length;
            const setTotal = setAchievements.length;

            return (
              <section key={s.id} className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                  <div className="flex items-baseline gap-3">
                    <h2 className="matiks-headline text-2xl text-[#F4F4F4]">
                      {s.name}
                    </h2>
                    <span className="font-body text-xs text-[#8A8A8A] hidden sm:inline">
                      — {s.desc}
                    </span>
                  </div>
                  <div className="font-heading text-lg">
                    <span className="text-[#AFF65B]">{setUnlocked}</span>
                    <span className="text-[#8A8A8A]"> / {setTotal}</span>
                  </div>
                </div>

                {/* Stamps grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {setAchievements.map((ach) => (
                    <StampTile
                      key={ach.id}
                      achievement={ach}
                      onClick={() => setSelectedAchievement(ach)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Action Prompt */}
        <div className="mt-12 bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="matiks-headline text-3xl text-[#F4F4F4]">
              READY TO EARN YOUR NEXT STAMP?
            </h3>
            <p className="font-body text-sm text-[#8A8A8A] mt-1">
              Jump into a bot match, experiment with Fog of War, or test your speed in Chess MM.
            </p>
          </div>
          {onPlay && (
            <button
              onClick={onPlay}
              className="btn-lime px-8 py-3.5 text-sm uppercase font-semibold tracking-wider shrink-0"
            >
              Play Match
            </button>
          )}
        </div>
      </div>

      {/* Stamp Detail Modal */}
      {selectedAchievement && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="matiks-kicker mb-2">{selectedAchievement.setName}</div>
            <h3 className="font-heading text-2xl text-[#F4F4F4] mb-4">
              {selectedAchievement.title}
            </h3>

            <div className="p-3 bg-[#262626] rounded-xl border border-white/10 my-2">
              <img
                src={
                  isAchievementUnlocked(selectedAchievement.id)
                    ? selectedAchievement.unlockedStampSvg
                    : selectedAchievement.lockedStampSvg
                }
                alt={selectedAchievement.title}
                className="w-36 h-48 object-contain"
              />
            </div>

            <p className="font-body text-xs text-[#8A8A8A] mt-4 leading-relaxed">
              {selectedAchievement.description}
            </p>

            <div className="mt-4 mb-6">
              {isAchievementUnlocked(selectedAchievement.id) ? (
                <span className="pill-unlocked">UNLOCKED IN LOCAL PROFILE</span>
              ) : (
                <span className="text-xs font-mono text-[#8A8A8A] bg-[#262626] px-3 py-1 rounded-full border border-white/10">
                  LOCKED — Complete objective to unlock
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="btn-raised w-full py-2.5 text-xs uppercase tracking-wider font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

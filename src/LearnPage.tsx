import { useState } from 'react';

interface LearnPageProps {
  onBack: () => void;
  onPlay: () => void;
}

interface VideoLesson {
  id: string;
  title: string;
  category: 'openings' | 'tactics' | 'endgame' | 'beginner';
  author: string;
  duration: string;
  youtubeId: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

const GOTHAM_LESSONS: VideoLesson[] = [
  {
    id: '1',
    title: 'How To Play Chess: The Ultimate Guide',
    category: 'beginner',
    author: 'GothamChess (Levy Rozman)',
    duration: '22:15',
    youtubeId: 'OCSbzArwB10',
    description: 'Learn how to play chess from scratch! Covers piece movement, checkmate patterns, and basic rules.',
    level: 'Beginner',
  },
  {
    id: '2',
    title: '10 Chess Openings Everyone Should Know',
    category: 'openings',
    author: 'GothamChess (Levy Rozman)',
    duration: '28:40',
    youtubeId: 'RMVxl-i5dAk',
    description: 'Master essential chess openings for White and Black including the Caro-Kann, Italian Game, and Vienna.',
    level: 'Beginner',
  },
  {
    id: '3',
    title: 'How To Win At Chess (Every Rating Level)',
    category: 'tactics',
    author: 'GothamChess (Levy Rozman)',
    duration: '31:10',
    youtubeId: 'E3y0QnO253c',
    description: 'Breakdown of strategic principles and tactical patterns from 500 ELO all the way to 2000 ELO.',
    level: 'Intermediate',
  },
  {
    id: '4',
    title: 'The Only Endgame Guide You Will Ever Need',
    category: 'endgame',
    author: 'GothamChess (Levy Rozman)',
    duration: '25:05',
    youtubeId: '3u-gWnE3QhU',
    description: 'King and pawn endgames, rook endgames, and opposition rules explained with clarity.',
    level: 'Intermediate',
  },
  {
    id: '5',
    title: 'How To Calculate In Chess Like A Grandmaster',
    category: 'tactics',
    author: 'GothamChess (Levy Rozman)',
    duration: '24:50',
    youtubeId: 'b33aWkZkC_k',
    description: 'Train your brain to visualize candidate moves, tactics, sacrifices, and checkmate nets.',
    level: 'Advanced',
  },
  {
    id: '6',
    title: 'The Vienna Gambit: Win Games In 10 Moves',
    category: 'openings',
    author: 'GothamChess (Levy Rozman)',
    duration: '18:30',
    youtubeId: 'L8pC2255N4o',
    description: 'Levy\'s signature aggressive opening for White that catches opponents completely off guard.',
    level: 'Intermediate',
  },
];

export default function LearnPage({ onBack, onPlay }: LearnPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(GOTHAM_LESSONS[0]);

  const filteredLessons = activeCategory === 'all'
    ? GOTHAM_LESSONS
    : GOTHAM_LESSONS.filter(l => l.category === activeCategory);

  return (
    <div className="min-h-screen bg-void-black text-on-surface-variant font-body-md p-8 relative overflow-hidden">
      {/* Spooky Glowing Accents */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-primary rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-tertiary rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-2 h-2 bg-secondary rounded-full shadow-[0_0_12px_2px_theme(colors.secondary)] opacity-60 animate-pulse pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <button 
            className="font-label-sm uppercase tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-2" 
            onClick={onBack}
          >
            <span>←</span> Flee to Sanctuary
          </button>
          <button 
            className="font-label-sm uppercase tracking-widest bg-primary text-bone-ivory px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors shadow-[0_0_15px_theme(colors.primary)]" 
            onClick={onPlay}
          >
            Slay AI Demons ⚔️
          </button>
        </div>

        <header className="mb-12 text-center relative z-10">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <div className="w-16 h-16 bg-void-black border-2 border-tertiary text-tertiary flex items-center justify-center font-display-lg rounded-sm shadow-[0_0_12px_theme(colors.tertiary)]">
              QST
            </div>
            <span className="font-label-sm text-tertiary uppercase tracking-widest">Chaturanga Academy of Dark Arts</span>
          </div>
          <h1 className="font-display-lg text-bone-ivory uppercase tracking-tight mb-2 text-shadow-md">
            Master The Cursed Board
          </h1>
          <p className="font-body-md text-on-surface-variant/80 italic">
            Forbidden visual grimoires & rituals translated by GothamChess (Levy Rozman)
          </p>
        </header>

        {/* Main Active Video Player */}
        {activeVideo && (
          <div className="bg-surface-card rounded-xl p-space-lg shadow-2xl border border-surface-container-high mb-12 flex flex-col lg:flex-row gap-8 relative z-10">
            <div className="w-full lg:w-2/3 aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_20px_theme(colors.primary)] border border-primary/30">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="w-full lg:w-1/3 flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap gap-3 mb-2 font-label-sm uppercase tracking-widest">
                <span className="bg-surface-container-low text-primary px-3 py-1 rounded border border-primary/20">
                  Rank: {activeVideo.level}
                </span>
                <span className="bg-surface-container-low text-tertiary px-3 py-1 rounded border border-tertiary/20">
                  🎙️ {activeVideo.author}
                </span>
                <span className="bg-surface-container-low text-secondary px-3 py-1 rounded border border-secondary/20">
                  ⏱️ {activeVideo.duration}
                </span>
              </div>
              <h2 className="font-headline-md text-bone-ivory uppercase">
                {activeVideo.title}
              </h2>
              <p className="font-body-md text-on-surface-variant">
                {activeVideo.description}
              </p>
            </div>
          </div>
        )}

        {/* Category Toggles */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 relative z-10">
          {[
            { id: 'all', label: 'All Rituals' },
            { id: 'beginner', label: '🌱 Neophyte Rules' },
            { id: 'openings', label: '⚔️ Blood Openings' },
            { id: 'tactics', label: '🧠 Dark Tactics' },
            { id: 'endgame', label: '👑 Death Endgames' },
          ].map(cat => (
            <button
              key={cat.id}
              className={`font-label-sm uppercase tracking-widest px-5 py-3 rounded border transition-all ${
                activeCategory === cat.id 
                  ? 'bg-secondary text-void-black border-secondary shadow-[0_0_10px_theme(colors.secondary)]' 
                  : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:border-secondary/50 hover:text-secondary'
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lesson Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter relative z-10">
          {filteredLessons.map(lesson => (
            <div
              key={lesson.id}
              className={`bg-surface-card rounded-xl p-space-lg shadow-2xl border border-surface-container-high cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl ${
                activeVideo?.id === lesson.id 
                  ? 'border-primary shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                  : 'border-surface-container-high hover:border-secondary/50'
              }`}
              onClick={() => setActiveVideo(lesson)}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4 border border-void-black group">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  src={`https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
                  alt={lesson.title}
                />
                <div className="absolute inset-0 bg-void-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-12 h-12 bg-primary/90 text-bone-ivory rounded-full flex items-center justify-center text-xl shadow-[0_0_15px_theme(colors.primary)] pl-1">
                    ▶
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 bg-void-black/90 text-bone-ivory font-label-sm px-2 py-1 rounded text-xs border border-surface-container-high">
                  {lesson.duration}
                </span>
              </div>
              <div className="space-y-2">
                <span className="inline-block text-xs font-label-sm uppercase tracking-widest text-secondary mb-1">
                  {lesson.level}
                </span>
                <h3 className="font-headline-md text-bone-ivory uppercase text-lg line-clamp-2 leading-tight">
                  {lesson.title}
                </h3>
                <p className="font-body-md text-on-surface-variant text-sm line-clamp-2">
                  {lesson.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

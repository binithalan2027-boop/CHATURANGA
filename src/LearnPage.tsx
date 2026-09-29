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
    <div className="learn-screen">
      <div className="learn-container">
        {/* Navigation Bar */}
        <div className="learn-top-bar">
          <button className="auth-back" onClick={onBack}>← Back to Home</button>
          <button className="btn-new-game" onClick={onPlay}>Practice vs AI ⚔️</button>
        </div>

        <header className="learn-header">
          <div className="auth-logo">
            <div className="auth-logo-box">QST</div>
            <span className="auth-logo-name">Chaturanga Academy</span>
          </div>
          <h1 className="learn-title">MASTER THE BOARD</h1>
          <p className="learn-subtitle">Curated video guides & lessons by GothamChess (Levy Rozman)</p>
        </header>

        {/* Main Active Video Player */}
        {activeVideo && (
          <div className="video-hero-player">
            <div className="video-iframe-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="video-details font-jetbrains">
              <div className="video-meta-row">
                <span className="level-badge">{activeVideo.level}</span>
                <span className="author-name">🎙️ {activeVideo.author}</span>
                <span className="duration-tag">⏱️ {activeVideo.duration}</span>
              </div>
              <h2>{activeVideo.title}</h2>
              <p>{activeVideo.description}</p>
            </div>
          </div>
        )}

        {/* Category Toggles */}
        <div className="learn-categories">
          {[
            { id: 'all', label: 'All Lessons' },
            { id: 'beginner', label: '🌱 Beginner Rules' },
            { id: 'openings', label: '⚔️ Openings' },
            { id: 'tactics', label: '🧠 Tactics & Strategy' },
            { id: 'endgame', label: '👑 Endgames' },
          ].map(cat => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lesson Cards Grid */}
        <div className="lessons-grid">
          {filteredLessons.map(lesson => (
            <div
              key={lesson.id}
              className={`lesson-card ${activeVideo?.id === lesson.id ? 'selected' : ''}`}
              onClick={() => setActiveVideo(lesson)}
            >
              <div className="thumbnail-box">
                <img
                  src={`https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
                  alt={lesson.title}
                />
                <span className="play-icon-overlay">▶</span>
                <span className="thumb-duration">{lesson.duration}</span>
              </div>
              <div className="card-info">
                <span className="card-level">{lesson.level}</span>
                <h3>{lesson.title}</h3>
                <p>{lesson.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

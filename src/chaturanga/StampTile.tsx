import { useState } from 'react';
import { Achievement, isAchievementUnlocked } from './achievements';

interface StampTileProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function StampVectorIcon({ icon, color }: { icon?: string; color: string }) {
  switch (icon) {
    case 'knight':
      return (
        <path
          d="M35 85 C35 85 30 75 32 60 C34 45 42 35 55 30 C58 24 68 20 78 22 C88 24 95 32 95 42 C95 46 98 48 102 46 C106 44 112 40 115 45 C118 50 112 58 105 62 C115 65 125 72 125 85 L35 85 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'king':
    case 'crown':
      return (
        <path
          d="M40 85 L45 50 L65 65 L80 40 L95 65 L115 50 L120 85 Z M75 25 H85 V35 H75 Z M70 30 H90 V32 H70 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'queen':
      return (
        <path
          d="M42 85 L46 55 L65 70 L80 48 L95 70 L114 55 L118 85 Z M46 50 A4 4 0 1 1 46 49.9 Z M80 43 A4 4 0 1 1 80 42.9 Z M114 50 A4 4 0 1 1 114 49.9 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'rook':
      return (
        <path
          d="M45 85 L48 55 H55 V45 H65 V55 H75 V45 H85 V55 H95 V45 H105 V55 H112 L115 85 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'bishop':
      return (
        <path
          d="M80 30 C65 45 60 60 62 85 H98 C100 60 95 45 80 30 Z M80 22 A4 4 0 1 1 80 21.9 Z M72 50 L88 62"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill={color}
          opacity="0.9"
        />
      );
    case 'burst':
      return (
        <path
          d="M80 30 L88 55 L115 50 L98 70 L120 90 L92 90 L80 115 L68 90 L40 90 L62 70 L45 50 L72 55 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'shield':
      return (
        <path
          d="M45 35 H115 V65 C115 90 80 110 80 110 C80 110 45 90 45 65 Z"
          fill={color}
          opacity="0.85"
        />
      );
    case 'trophy':
      return (
        <path
          d="M50 35 H110 V65 C110 82 95 95 80 95 C65 95 50 82 50 65 Z M70 95 H90 V110 H70 Z M55 110 H105 V115 H55 Z M50 45 H38 V60 H50 Z M110 45 H122 V60 H110 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'bolt':
      return (
        <path
          d="M85 25 L50 70 H80 L75 115 L110 65 H80 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'clock':
      return (
        <g fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" opacity="0.9">
          <circle cx="80" cy="70" r="38" />
          <path d="M80 50 V72 L96 82" />
        </g>
      );
    case 'target':
      return (
        <g fill="none" stroke={color} strokeWidth="6" opacity="0.9">
          <circle cx="80" cy="70" r="38" />
          <circle cx="80" cy="70" r="24" />
          <circle cx="80" cy="70" r="8" fill={color} />
        </g>
      );
    case 'star':
      return (
        <path
          d="M80 30 L92 58 L122 62 L100 82 L106 112 L80 96 L54 112 L60 82 L38 62 L68 58 Z"
          fill={color}
          opacity="0.9"
        />
      );
    case 'dice':
      return (
        <g fill="none" stroke={color} strokeWidth="6" opacity="0.9">
          <rect x="48" y="38" width="64" height="64" rx="12" />
          <circle cx="64" cy="54" r="5" fill={color} />
          <circle cx="96" cy="54" r="5" fill={color} />
          <circle cx="80" cy="70" r="5" fill={color} />
          <circle cx="64" cy="86" r="5" fill={color} />
          <circle cx="96" cy="86" r="5" fill={color} />
        </g>
      );
    case 'fog':
      return (
        <g stroke={color} strokeWidth="7" strokeLinecap="round" opacity="0.9">
          <path d="M45 50 H115" />
          <path d="M40 70 H120" />
          <path d="M50 90 H110" />
        </g>
      );
    case 'book':
      return (
        <path
          d="M45 40 Q80 48 80 52 Q80 48 115 40 V95 Q80 102 80 106 Q80 102 45 95 Z"
          fill={color}
          opacity="0.85"
        />
      );
    case 'pi':
    case 'sum':
      return (
        <text
          x="80"
          y="85"
          fill={color}
          fontSize="56"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {icon === 'sum' ? '∑' : 'π'}
        </text>
      );
    case 'pawn':
    default:
      return (
        <path
          d="M80 32 A14 14 0 1 1 80 31.9 Z M65 55 C65 50 95 50 95 55 C95 62 88 68 88 82 H72 C72 68 65 62 65 55 Z M55 88 H105 V96 H55 Z"
          fill={color}
          opacity="0.9"
        />
      );
  }
}

export default function StampTile({
  achievement,
  isUnlocked: explicitUnlocked,
  onClick,
  size = 'md',
}: StampTileProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const unlocked = explicitUnlocked !== undefined ? explicitUnlocked : isAchievementUnlocked(achievement.id);

  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-32 h-44',
    lg: 'w-44 h-60',
  }[size];

  const stampImgSrc = unlocked ? achievement.unlockedStampSvg : achievement.lockedStampSvg;
  const accent = achievement.accentColor || '#AFF65B';
  const denomination = achievement.denomination || '25¢';

  return (
    <div
      onClick={onClick}
      title={`${achievement.title} — ${achievement.description} (${unlocked ? 'Unlocked' : 'Locked'})`}
      className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
      style={{
        background: '#1F1F1F',
        border: '1.5px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Stamp Container with Perforations */}
      <div className={`relative ${sizeClasses} flex items-center justify-center rounded overflow-hidden`}>
        {!imgFailed ? (
          <img
            src={stampImgSrc}
            alt={achievement.title}
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-contain filter transition-all duration-300 ${
              unlocked
                ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105'
                : 'opacity-40 grayscale contrast-125'
            }`}
            loading="lazy"
          />
        ) : (
          /* Built-in Resilient Perforated Postage Stamp SVG */
          <svg
            viewBox="0 0 160 220"
            className={`w-full h-full filter transition-all duration-300 ${
              unlocked
                ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105'
                : 'opacity-40 grayscale contrast-125'
            }`}
          >
            {/* Outer Perforated Frame */}
            <rect x="6" y="6" width="148" height="208" rx="4" fill="#D9D5C7" />

            {/* Scalloped Perforations Along Edges */}
            {[24, 48, 72, 96, 120, 144, 168, 192].map((y) => (
              <g key={`hole-side-${y}`}>
                <circle cx="6" cy={y} r="5" fill="#1F1F1F" />
                <circle cx="154" cy={y} r="5" fill="#1F1F1F" />
              </g>
            ))}
            {[26, 52, 78, 104, 130].map((x) => (
              <g key={`hole-tb-${x}`}>
                <circle cx={x} cy="6" r="5" fill="#1F1F1F" />
                <circle cx={x} cy="214" r="5" fill="#1F1F1F" />
              </g>
            ))}

            {/* Inner Stamp Body */}
            <rect
              x="16"
              y="16"
              width="128"
              height="188"
              rx="2"
              fill={unlocked ? '#121212' : '#141414'}
              stroke={unlocked ? accent : '#444'}
              strokeWidth="2"
            />

            {/* Diagonal Stamp Lines Pattern (Subtle) */}
            <line x1="20" y1="20" x2="140" y2="20" stroke={accent} strokeWidth="1" opacity="0.3" />
            <line x1="20" y1="200" x2="140" y2="200" stroke={accent} strokeWidth="1" opacity="0.3" />

            {/* Postal Header */}
            <text
              x="22"
              y="32"
              fill={unlocked ? '#F4F4F4' : '#8A8A8A'}
              fontSize="9"
              fontWeight="bold"
              letterSpacing="1.5"
              fontFamily="sans-serif"
            >
              CHATURANGA
            </text>

            {/* Denomination Readout */}
            <text
              x="138"
              y="32"
              fill={unlocked ? accent : '#666'}
              fontSize="10"
              fontWeight="bold"
              textAnchor="end"
              fontFamily="monospace"
            >
              {denomination}
            </text>

            {/* Central Stamp Illustration */}
            <g transform="translate(0, 20)">
              <StampVectorIcon
                icon={achievement.icon}
                color={unlocked ? accent : '#666'}
              />
            </g>

            {/* Stamp Bottom Name Banner */}
            <rect
              x="20"
              y="172"
              width="120"
              height="22"
              rx="3"
              fill={unlocked ? accent : '#222'}
            />
            <text
              x="80"
              y="186"
              fill={unlocked ? '#0E0E0E' : '#8A8A8A'}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
              letterSpacing="0.8"
            >
              {achievement.title.slice(0, 18).toUpperCase()}
            </text>
          </svg>
        )}

        {/* Status Pill Badge */}
        {unlocked ? (
          <div className="absolute bottom-1 right-1 z-10">
            <span className="pill-unlocked shadow-md text-[9px] py-0.5 px-1.5 font-bold">
              UNLOCKED
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded pointer-events-none">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-[#8A8A8A] bg-[#141414]/90 px-2 py-0.5 rounded border border-white/10">
              LOCKED
            </span>
          </div>
        )}
      </div>

      {/* Info Label Below */}
      <div className="w-full text-center mt-2 px-1">
        <div className="font-heading text-xs sm:text-sm text-[#F4F4F4] tracking-wide truncate">
          {achievement.title}
        </div>
        <div className="text-[10px] font-body text-[#8A8A8A] line-clamp-2 leading-tight mt-0.5">
          {achievement.description}
        </div>
      </div>
    </div>
  );
}
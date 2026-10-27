import React from 'react';
import { SpellId } from './spellConfig';

export interface SpellIconProps {
  id: SpellId;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SpellIcon({
  id,
  size = 48,
  className = '',
  style,
}: SpellIconProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      viewBox="0 0 512 512"
      className={`spell-icon spell-icon-${id} ${className}`}
      style={{
        display: 'block',
        width: pixelSize,
        height: pixelSize,
        flexShrink: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="104" fill="#111111" />

      {id === 'freeze' && (
        <>
          <g stroke="#50A0F0" strokeWidth="24" strokeLinecap="round">
            <line x1="256" y1="112" x2="256" y2="400" />
            <path d="M232 168 L256 144 L280 168" fill="none" />
            <path d="M232 344 L256 368 L280 344" fill="none" />
            <line x1="131" y1="184" x2="381" y2="328" />
            <path d="M165 220 L150 195 L178 188" fill="none" />
            <path d="M334 324 L362 317 L347 292" fill="none" />
            <line x1="381" y1="184" x2="131" y2="328" />
            <path d="M334 188 L362 195 L347 220" fill="none" />
            <path d="M165 292 L150 317 L178 324" fill="none" />
          </g>
          <circle cx="256" cy="256" r="28" fill="#F4F4F4" />
        </>
      )}

      {id === 'jump' && (
        <>
          <rect x="176" y="316" width="160" height="72" rx="20" fill="#66D4C2" />
          <path
            d="M120 340 C140 160 372 160 392 340"
            fill="none"
            stroke="#66D4C2"
            strokeWidth="26"
            strokeLinecap="round"
            strokeDasharray="32 24"
          />
          <polygon points="392,352 422,298 362,310" fill="#F4F4F4" />
        </>
      )}

      {id === 'skip' && (
        <>
          <path
            d="M136 156 L232 256 L136 356"
            fill="none"
            stroke="#F07040"
            strokeWidth="36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M256 156 L352 256 L256 356"
            fill="none"
            stroke="#F07040"
            strokeWidth="36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="376" y="156" width="30" height="200" rx="15" fill="#F4F4F4" />
        </>
      )}

      {id === 'surge' && (
        <>
          <polygon
            points="268,96 156,268 244,268 200,416 348,236 264,236"
            fill="#F2D500"
            stroke="#F2D500"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          <circle cx="372" cy="148" r="46" fill="#F4F4F4" />
          <path
            d="M372 124 V172 M348 148 H396"
            stroke="#111111"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </>
      )}

      {id === 'promote' && (
        <>
          <path d="M256 96 L298 146 H272 V204 H240 V146 H214 Z" fill="#F4F4F4" />
          <g transform="translate(136, 170) scale(2.4)">
            <circle cx="50" cy="30" r="15" fill="#A594F0" />
            <path d="M36 52 H64 L68 72 H32 Z" fill="#A594F0" />
            <rect x="26" y="72" width="48" height="14" rx="6" fill="#A594F0" />
            <rect x="40" y="52" width="20" height="5" rx="2" fill="#F4F4F4" />
          </g>
        </>
      )}

      {id === 'timeboost' && (
        <>
          <path
            d="M172 136 H340 M172 376 H340"
            stroke="#F4F4F4"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M192 144 C192 244 320 244 320 144 Z M192 368 C192 268 320 268 320 368 Z"
            fill="#F4F4F4"
            opacity="0.9"
          />
          <circle cx="256" cy="256" r="16" fill="#F4F4F4" />
          <circle cx="372" cy="148" r="46" fill="#F07040" />
          <path
            d="M372 124 V172 M348 148 H396"
            stroke="#F4F4F4"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </>
      )}

      {id === 'timedrain' && (
        <>
          <path
            d="M172 136 H340 M172 376 H340"
            stroke="#F4F4F4"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M192 144 C192 244 320 244 320 144 Z M192 368 C192 268 320 268 320 368 Z"
            fill="#F4F4F4"
            opacity="0.9"
          />
          <circle cx="256" cy="256" r="16" fill="#F4F4F4" />
          <circle cx="372" cy="148" r="46" fill="#F07040" />
          <path
            d="M348 148 H396"
            stroke="#F4F4F4"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </>
      )}

      {id === 'poison' && (
        <>
          <path
            d="M256 116 C256 116 168 236 168 300 C168 350 206 388 256 388 C306 388 344 350 344 300 C344 236 256 116 256 116 Z"
            fill="#E5484D"
          />
          <circle cx="240" cy="286" r="22" fill="#111111" />
          <circle cx="282" cy="330" r="14" fill="#111111" />
          <circle cx="276" cy="254" r="10" fill="#111111" />
          <rect x="156" y="416" width="200" height="24" rx="12" fill="#F4F4F4" />
        </>
      )}

      {id === 'rewind' && (
        <>
          <path
            d="M256 136 A120 120 0 1 0 376 256"
            fill="none"
            stroke="#0FB567"
            strokeWidth="36"
            strokeLinecap="round"
          />
          <polygon points="256,92 256,180 188,136" fill="#0FB567" />
          <polygon points="280,216 280,296 216,256" fill="#F4F4F4" />
        </>
      )}
    </svg>
  );
}

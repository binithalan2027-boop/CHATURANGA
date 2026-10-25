/**
 * Chaturanga Design Tokens v1
 * Grounded in design-tokens.json and chaturanga-graphics-spec.md
 */

export const TOKENS = {
  color: {
    surface: {
      void: '#0E0E0E',
      charcoal: '#1A1A1A',
      raised: '#262626',
      offwhite: '#F4F4F4',
      border: '#333333',
    },
    accent: {
      lime: '#AFF65B',
      yellow: '#F2D500',
      lavender: '#A594F0',
      teal: '#66D4C2',
      coral: '#F07040',
      emerald: '#0FB567',
      sky: '#50A0F0',
      red: '#E5484D',
    },
    board: {
      light: '#D9D5C7',
      dark: '#5F7A4A',
      lastMove: '#F2D500',
    },
  },
  font: {
    heading: "'Bebas Neue', Impact, sans-serif",
    body: "'Poppins', Arial, sans-serif",
    indic: "'Noto Devanagari', sans-serif",
  },
  radius: {
    tile: '22px',
    chip: '16px',
    pill: '999px',
  },
  spacing: {
    screenMargin: '16px',
    tileGap: '12px',
  },
} as const;

export type ThemeTokens = typeof TOKENS;

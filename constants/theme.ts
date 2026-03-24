import { Platform } from 'react-native';

// ─── Brand ────────────────────────────────────────────────────────────────────
// TODO: replace with final SaaS name & tagline
export const Brand = {
  name: 'Fitzo',
  tagline: 'Tu plataforma de fitness',
} as const;

// ─── Palettes ─────────────────────────────────────────────────────────────────
const palette = {
  // Accent
  violet400: '#9B93FF',
  violet500: '#6C63FF',
  violet600: '#5046E5',

  // Neutrals – dark
  ink900: '#07070F',
  ink800: '#0A0A18',
  ink750: '#0D0D22',
  ink700: '#0F0F1A',

  // Neutrals – light
  snow50:  '#FAFAFA',
  snow100: '#F4F4F5',
  snow200: '#E4E4E7',

  // Text
  white:    '#FFFFFF',
  gray300:  '#D1D1DB',
  gray500:  '#8A8A9A',
  gray700:  '#4A4A5A',

  // Semantic
  green400:  '#34D399',
  red400:    '#F87171',
  amber400:  '#FBBF24',

  // Vibrant (Green-Blue)
  vibrant400: '#8be85e',
  vibrant500: '#81da7e',
  vibrant600: '#41bfe8',
  vibrant700: '#4cd6c8',
} as const;

// ─── Theme shape ──────────────────────────────────────────────────────────────
export interface AppTheme {
  // Backgrounds
  bgDeep:   string;
  bgBase:   string;
  bgSubtle: string;
  bgCard:   string;
  surface:  string;

  // Text
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;

  // Accent
  accent:        string;
  accentLight:   string;
  accentDim:     string;
  accentBorder:  string;
  accentGlow:    string;

  // Borders
  borderSubtle:  string;
  borderMuted:   string;

  // Semantic
  success: string;
  error:   string;
  warning: string;

  // Gradient stops
  gradients: {
    bg:      [string, string, string];
    accent:  [string, string];
    topGlow: [string, string];
  };
}

export const darkTheme: AppTheme = {
  // Backgrounds
  bgDeep:   palette.ink900,
  bgBase:   palette.ink800,
  bgSubtle: palette.ink750,
  bgCard:   palette.ink700,
  surface:  'rgba(255,255,255,0.05)',

  // Text
  textPrimary:   palette.white,
  textSecondary: palette.gray500,
  textMuted:     palette.gray700,

  // Accent
  accent:        palette.violet500,
  accentLight:   palette.violet400,
  accentDim:     'rgba(108,99,255,0.15)',
  accentBorder:  'rgba(108,99,255,0.4)',
  accentGlow:    'rgba(108,99,255,0.07)',

  // Borders
  borderSubtle:  'rgba(255,255,255,0.06)',
  borderMuted:   'rgba(255,255,255,0.08)',

  // Semantic
  success: palette.green400,
  error:   palette.red400,
  warning: palette.amber400,

  // Gradient stops
  gradients: {
    bg:     [palette.ink900, palette.ink800, palette.ink750],
    accent: [palette.violet500, palette.violet400],
    topGlow: ['rgba(108,99,255,0.12)', 'rgba(108,99,255,0)'],
  },
};

export const lightTheme: AppTheme = {
  bgDeep:   palette.snow50,
  bgBase:   palette.snow100,
  bgSubtle: palette.snow100,
  bgCard:   '#FFFFFF',
  surface:  'rgba(0,0,0,0.04)' as const,

  textPrimary:   '#111118',
  textSecondary: '#52525B',
  textMuted:     '#A1A1AA',

  accent:        palette.violet500,
  accentLight:   palette.violet400,
  accentDim:     'rgba(108,99,255,0.10)' as const,
  accentBorder:  'rgba(108,99,255,0.35)' as const,
  accentGlow:    'rgba(108,99,255,0.05)' as const,

  borderSubtle:  'rgba(0,0,0,0.06)' as const,
  borderMuted:   'rgba(0,0,0,0.08)' as const,

  success: palette.green400,
  error:   palette.red400,
  warning: palette.amber400,

  gradients: {
    bg:      [palette.snow50, palette.snow100, palette.snow100] as [string, string, string],
    accent:  [palette.violet500, palette.violet400]             as [string, string],
    topGlow: ['rgba(108,99,255,0.08)', 'rgba(108,99,255,0)']           as [string, string],
  },
} as const;

export const cyanTheme: AppTheme = {
  ...darkTheme,
  accent:        palette.vibrant700,
  accentLight:   palette.vibrant400,
  accentDim:     'rgba(76,214,200,0.15)' as const, // Based on #4cd6c8
  accentBorder:  'rgba(76,214,200,0.45)' as const,
  accentGlow:    'rgba(76,214,200,0.08)' as const,

  gradients: {
    ...darkTheme.gradients,
    accent:  [palette.vibrant500, palette.vibrant600] as [string, string],
    topGlow: ['rgba(76,214,200,0.14)', 'rgba(76,214,200,0)'] as [string, string],
  },
} as const;

// ─── Active theme ─────────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light' | 'cyan';

/**
 * Helper to get the theme object based on mode string.
 */
export const getTheme = (mode: ThemeMode): AppTheme => {
    switch (mode) {
        case 'light': return lightTheme;
        case 'cyan':  return cyanTheme;
        default:      return darkTheme;
    }
};

// Default export if we still need a global (for non-store-aware components)
export const theme = darkTheme;

// ─── Legacy Colors (kept for backward compatibility) ──────────────────────────
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: palette.violet500,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: palette.violet500,
  },
  dark: {
    text: '#ECEDEE',
    background: palette.ink900,
    tint: palette.white,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: palette.white,
  },
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

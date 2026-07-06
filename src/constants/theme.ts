import { Platform } from 'react-native';

// PCM Color Palette
// Single source of truth. No dark mode. Import Colors wherever needed.

export const Colors = {
  // Screen backgrounds
  /** Default content screen background */
  background: '#f8f9ff',
  /** Login / auth screen background */
  bgLogin: '#fafcff',
  /** Secondary dark layer */
  bgDark: '#0b1c2e',

  // Surfaces (cards, panels, inputs)
  /** White card / dialog */
  surface: '#ffffff',
  /** Card with slight transparency */
  surfaceCard: 'rgba(255,255,255,0.97)',
  /** Subtle element background (rows, chips) */
  surfaceElement: '#F0F0F3',
  /** Selected state background */
  surfaceSelected: '#E0E1E6',
  /** Text input background */
  surfaceInput: 'rgba(248,249,255,0.85)',
  /** Card icon background, subtle panels */
  surfaceContainer: '#e5eeff',

  // Text
  /** Primary body text */
  textPrimary: '#0b1c30',
  /** Secondary / supporting text */
  textSecondary: '#45464d',
  /** Muted / disabled text */
  textMuted: '#76777d',
  /** Text on dark / colored surfaces */
  textInverse: '#ffffff',
  /** Hyperlinks */
  textLink: '#000099',
  /** Input placeholder */
  textPlaceholder: '#c6c6cd',

  // Brand / Action
  /** Primary brand blue-navy */
  brand: '#000099',
  // Inverse brand (for text on brand color or dark backgrounds)
  brandInverse: '#ffffff',
  /** Darker brand (hover / pressed) */
  brandDark: '#000099',

  // Borders
  /** Standard border (inputs, cards) */
  border: '#76777d',
  /** Subtle divider */
  borderSubtle: '#c6c6cd',

  // Buttons
  btnPrimary: '#000099',
  btnPrimaryText: '#ffffff',

  // Form controls
  checkboxActive: '#0b1c30',

  // Header / TopBar
  headerBg: '#02023d',
  headerText: '#ffffff',

  // App Footer (global — dark navy, used on all screens)
  appFooterBg: '#02023d',
  appFooterText: '#ffffff',
  appFooterTextMuted: 'rgba(255,255,255,0.75)',

  // Danger / destructive actions
  danger: '#ba1a1a',
  dangerBg: '#ffdad6',

  // Wizard step accents
  stepFrom: '#16a34a',  // Origen (From) header — green
  stepTo: '#d97706',    // Destino (To) header — amber
  stepDone: '#16a34a',  // completed step circle
} as const;

export type ColorKey = keyof typeof Colors;

// Typography

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// Spacing scale (4 pt grid)

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Layout

export const MaxContentWidth = 800;

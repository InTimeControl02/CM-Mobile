import { Colors } from '@/constants/theme';

/**
 * Returns the app color palette.
 * No dark mode — single light theme for PCM.
 */
export function useTheme() {
  return Colors;
}

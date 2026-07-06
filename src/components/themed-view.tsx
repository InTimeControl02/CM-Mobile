import { View, type ViewProps } from 'react-native';

import { ColorKey } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  /** Key from Colors palette for backgroundColor */
  colorKey?: ColorKey;
};

export function ThemedView({ style, colorKey, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[{ backgroundColor: theme[colorKey ?? 'surface'] as string }, style]}
      {...otherProps}
    />
  );
}

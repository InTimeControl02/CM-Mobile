import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

/**
 * AppFooter — global footer used on every screen.
 * Dark navy background with PCM branding and nav links.
 */
type AppFooterProps = {
  onSupportPress?: () => void;
};

export function AppFooter({ onSupportPress }: AppFooterProps = {}) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.row}>
        <Text style={styles.brand}>PCM</Text>
        <View style={styles.divider} />
        <Text style={styles.copy} numberOfLines={1}>© 2026 In Time Control</Text>
        <View style={styles.spacer} />
        <TouchableOpacity activeOpacity={0.7} onPress={onSupportPress}>
          <Text style={styles.link}>Soporte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: Colors.appFooterBg,
    borderTopWidth: 2,
    borderTopColor: Colors.brand,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.appFooterText,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  copy: {
    fontSize: 11,
    color: Colors.appFooterTextMuted,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  link: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.appFooterTextMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';

export function AppFooter() {
  const [supportVisible, setSupportVisible] = useState(false);

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.row}>
          <Text style={styles.brand}>CM</Text>
          <View style={styles.divider} />
          <Text style={styles.copy} numberOfLines={1}>© 2026 In Time Control</Text>
          <View style={styles.spacer} />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSupportVisible(true)}>
            <Text style={styles.link}>Soporte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={supportVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSupportVisible(false)} />
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <SymbolView
              name={{ ios: 'headphones', android: 'headset_mic', web: 'headset_mic' }}
              tintColor={Colors.brand}
              size={20}
            />
            <Text style={styles.dropdownHeaderText}>Soporte Técnico</Text>
          </View>
          <View style={styles.dropdownDivider} />
          <View style={styles.supportRow}>
            <SymbolView
              name={{ ios: 'envelope', android: 'email', web: 'email' }}
              tintColor={Colors.textMuted}
              size={16}
            />
            <Text style={styles.supportValue}>sistemas@intimecontrol.com</Text>
          </View>
          <View style={styles.dropdownDivider} />
          <View style={styles.supportRow}>
            <SymbolView
              name={{ ios: 'phone', android: 'phone', web: 'phone' }}
              tintColor={Colors.textMuted}
              size={16}
            />
            <Text style={styles.supportValue}>+52 811 334 0057</Text>
          </View>
        </View>
      </Modal>
    </>
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

  // Support modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdown: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    minWidth: 260,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  supportValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    flexWrap: 'wrap',
  },
});

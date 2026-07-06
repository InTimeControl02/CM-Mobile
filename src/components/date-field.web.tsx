import { Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {/* @ts-ignore — JSX renders to DOM on web, <input> is valid here */}
      <input
        type="date"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.surface,
          paddingInline: 12,
          paddingBlock: 10,
          fontSize: 15,
          color: value ? Colors.textPrimary : Colors.textPlaceholder,
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {value ? (
        <TouchableOpacity
          style={{ borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => onChange('')}
          activeOpacity={0.7}>
          <Text style={{ fontSize: 16, color: Colors.textMuted, fontWeight: '600' }}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

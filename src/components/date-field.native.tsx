import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

// Build Date from yyyy-mm-dd using local time (avoids UTC-midnight shift)
function ymdToDate(ymd: string): Date {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format Date to yyyy-mm-dd using local date parts
function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <View style={df.row}>
        <TouchableOpacity style={[df.btn, df.btnFlex]} onPress={() => setShow(true)} activeOpacity={0.75}>
          <Text style={value ? df.value : df.placeholder}>{value || 'Seleccionar fecha'}</Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity style={df.clearBtn} onPress={() => onChange('')} activeOpacity={0.7}>
            <Text style={df.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={ymdToDate(value)}
          mode="date"
          display="default"
          onValueChange={(_event, date) => {
            setShow(false);
            if (date) onChange(formatDateLocal(date));
          }}
          onDismiss={() => setShow(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={df.overlay}>
            <View style={df.sheet}>
              <TouchableOpacity style={df.doneRow} onPress={() => setShow(false)} activeOpacity={0.7}>
                <Text style={df.doneText}>Listo</Text>
              </TouchableOpacity>
              <DateTimePicker
                value={ymdToDate(value)}
                mode="date"
                display="spinner"
                onValueChange={(_event, date) => {
                  if (date) onChange(formatDateLocal(date));
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const df = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 10 },
  btnFlex: { flex: 1 },
  value: { fontSize: 15, color: Colors.textPrimary },
  placeholder: { fontSize: 15, color: Colors.textPlaceholder },
  clearBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  doneRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  doneText: { fontSize: 16, fontWeight: '700', color: Colors.brand },
});

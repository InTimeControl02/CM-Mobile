import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/app-footer';
import { DateField } from '@/components/date-field';
import { Colors } from '@/constants/theme';
import { ApiError } from '@/services/api';
import {
  Cable,
  ConnectFormData,
  PullFormData,
  TestFormData,
  getCable,
  updateCable,
} from '@/services/cables';
import { WorkGroup, getWorkGroups } from '@/services/workgroups';
import { cableStore } from '@/store/cable-selection';

// ── Helpers ────────────────────────────────────────────────────────────────────

type StepKey = 0 | 1 | 2;

function firstPendingStep(c: Cable): StepKey {
  if (!c.PulledDate) return 0;
  if (!c.TestedDate) return 1;
  if (!c.ConnectedDate_From) return 2;
  return 0;
}

function numToStr(n: number | null | undefined): string {
  return n != null ? String(n) : '';
}

// Strip time from ISO string: "2026-03-01T06:00:00.000Z" → "2026-03-01"
function isoToYMD(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

// Empty form string → null, so the field clears server-side instead of being skipped.
function orNull(s: string): string | null {
  return s.trim() ? s.trim() : null;
}

function numOrNull(s: string): number | null {
  const n = parseFloat(s);
  return s.trim() && !isNaN(n) ? n : null;
}


// ── Cable Diagram ─────────────────────────────────────────────────────────────

function CableDiagram({ cable }: { cable: Cable }) {
  return (
    <View style={diag.wrapper}>
      <View style={diag.row}>
        <View style={diag.eqBox}>
          <Text style={diag.eqLabel} numberOfLines={1}>{cable.FromEqNo}</Text>
          <Text style={diag.eqDesc} numberOfLines={2}>{cable.FromEqDescription}</Text>
          {cable.FromLocation ? <Text style={diag.eqLoc} numberOfLines={1}>{cable.FromLocation}</Text> : null}
        </View>
        <View style={diag.dot} />
        <View style={diag.center}>
          <Text style={diag.cableNo} numberOfLines={1}>{cable.CableNo}</Text>
          <Text style={diag.cableType} numberOfLines={1}>{cable.CableType}</Text>
        </View>
        <View style={diag.dot} />
        <View style={diag.eqBox}>
          <Text style={diag.eqLabel} numberOfLines={1}>{cable.ToEqNo}</Text>
          <Text style={diag.eqDesc} numberOfLines={2}>{cable.ToEqDescription}</Text>
          {cable.ToLocation ? <Text style={diag.eqLoc} numberOfLines={1}>{cable.ToLocation}</Text> : null}
        </View>
      </View>

      {/* Test requirement badges */}
      {(cable.NeedInsulTest || cable.NeedHipotTest) ? (
        <View style={diag.badges}>
          {cable.NeedInsulTest ? <View style={diag.badge}><Text style={diag.badgeText}>MEG requerido</Text></View> : null}
          {cable.NeedHipotTest ? <View style={diag.badge}><Text style={diag.badgeText}>HIPOT requerido</Text></View> : null}
        </View>
      ) : null}
    </View>
  );
}

const diag = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, paddingVertical: 12 },
  // flex row — no fixed widths, no scroll, always fits the screen
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 4 },
  eqBox: { flex: 1, minWidth: 0, borderWidth: 2, borderColor: Colors.brand, paddingHorizontal: 4, paddingVertical: 6, alignItems: 'center', backgroundColor: Colors.surfaceContainer },
  eqLabel: { fontSize: 12, fontWeight: '800', color: Colors.brand, letterSpacing: 0.3 },
  eqDesc: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  eqLoc: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  center: { flex: 1.1, minWidth: 0, borderWidth: 2, borderColor: Colors.textMuted, paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center', backgroundColor: Colors.surfaceElement },
  cableNo: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.3 },
  cableType: { fontSize: 10, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  badge: { backgroundColor: Colors.surfaceContainer, borderWidth: 1, borderColor: Colors.brand, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.brand },
});

// ── Step Indicator ─────────────────────────────────────────────────────────────

const STEPS = ['I Cableado', 'II Prueba', 'III Conexión'] as const;

function StepIndicator({ cable, active, onSelect }: { cable: Cable; active: StepKey; onSelect: (s: StepKey) => void }) {
  const done = [!!cable.PulledDate, !!cable.TestedDate, !!cable.ConnectedDate_From];
  return (
    <View style={si.row}>
      {STEPS.map((label, idx) => {
        const isDone = done[idx];
        const isActive = active === idx;
        return (
          <TouchableOpacity key={idx} style={si.item} onPress={() => onSelect(idx as StepKey)} activeOpacity={0.75}>
            <View style={[si.circle, isDone && si.circleDone, !isDone && isActive && si.circleActive]}>
              {isDone
                ? <Text style={si.checkmark}>✓</Text>
                : <Text style={[si.circleNum, isActive && si.circleNumActive]}>{idx + 1}</Text>}
            </View>
            <Text style={[si.label, isDone && si.labelDone, !isDone && isActive && si.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            {idx < STEPS.length - 1 && <View style={si.line} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const si = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: Colors.surface, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, alignItems: 'center' },
  item: { alignItems: 'center', flex: 1 },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.borderSubtle, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, marginBottom: 4 },
  circleDone: { backgroundColor: Colors.stepDone, borderColor: Colors.stepDone },
  circleActive: { borderColor: Colors.brand, backgroundColor: Colors.surfaceContainer },
  circleNum: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  circleNumActive: { color: Colors.brand },
  checkmark: { fontSize: 14, color: Colors.textInverse, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  labelDone: { color: Colors.stepDone },
  labelActive: { color: Colors.brand },
  line: { position: 'absolute', top: 16, right: -8, width: 16, height: 2, backgroundColor: Colors.borderSubtle },
});

// ── WorkGroup Picker Modal ─────────────────────────────────────────────────────

// Browser keeps focus on the tapped row/button; aria-hidden then lands on a
// focused ancestor when the modal closes. Blurring first avoids the warning.
function blurActiveElement() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}

function WGPickerModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (wg: WorkGroup) => void }) {
  const [wgs, setWGs] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    blurActiveElement();
    onClose();
  }

  function handleSelect(wg: WorkGroup) {
    blurActiveElement();
    onSelect(wg);
    onClose();
  }

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    getWorkGroups()
      .then(setWGs)
      .catch(e => setError(e instanceof ApiError ? e.message : 'Error al cargar cuadrillas.'))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={wgm.overlay}>
        <View style={wgm.sheet}>
          <View style={wgm.header}>
            <Text style={wgm.title}>Seleccionar Cuadrilla</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}><Text style={wgm.close}>✕</Text></TouchableOpacity>
          </View>
          {loading
            ? <ActivityIndicator color={Colors.brand} style={{ marginVertical: 32 }} />
            : error
              ? <Text style={wgm.error}>{error}</Text>
              : <FlatList
                  data={wgs}
                  keyExtractor={w => String(w.WorkGroupID)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={wgm.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                      <Text style={wgm.wgCode}>{item.WGCode}</Text>
                      <View style={wgm.people}>
                        <Text style={wgm.person}>Oficial: {item.WGLeader}</Text>
                        <Text style={wgm.person}>Cabo: {item.Foreman}</Text>
                        <Text style={wgm.person}>Supervisor: {item.Supervisor}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={wgm.sep} />}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />}
        </View>
      </View>
    </Modal>
  );
}

const wgm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  close: { fontSize: 16, color: Colors.textMuted, padding: 4 },
  row: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  wgCode: { fontSize: 15, fontWeight: '700', color: Colors.brand, letterSpacing: 0.3 },
  people: { gap: 2 },
  person: { fontSize: 12, color: Colors.textSecondary },
  sep: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 16 },
  error: { fontSize: 14, color: Colors.danger, textAlign: 'center', margin: 24 },
});

// ── Shared form helpers ────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={fs.label}>{children}</Text>;
}

function FieldInput({ value, onChange, placeholder, readOnly, multiline, keyboardType }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  readOnly?: boolean; multiline?: boolean; keyboardType?: 'default' | 'numeric';
}) {
  return (
    <TextInput
      style={[fs.input, readOnly && fs.inputReadOnly, multiline && fs.inputMulti]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.textPlaceholder}
      editable={!readOnly}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      keyboardType={keyboardType ?? 'default'}
    />
  );
}

function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <TouchableOpacity style={fs.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[fs.box, checked && fs.boxChecked]}>
        {checked && <Text style={fs.tick}>✓</Text>}
      </View>
      <Text style={fs.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={[fs.sectionHeader, { borderLeftColor: color }]}>
      <Text style={[fs.sectionTitle, { color }]}>{label}</Text>
    </View>
  );
}

function SaveButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity style={[fs.saveBtn, loading && fs.saveBtnDisabled]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={Colors.textInverse} /> : <Text style={fs.saveBtnLabel}>Guardar</Text>}
    </TouchableOpacity>
  );
}

function WGPickerRow({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={wgrow.btn} onPress={onPress} activeOpacity={0.75}>
      <Text style={value ? wgrow.value : wgrow.placeholder}>{value || 'Seleccionar cuadrilla...'}</Text>
      <Text style={wgrow.arrow}>▾</Text>
    </TouchableOpacity>
  );
}

const fs = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: 14 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary },
  inputReadOnly: { backgroundColor: Colors.surfaceElement, color: Colors.textMuted },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  box: { width: 22, height: 22, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  boxChecked: { backgroundColor: Colors.checkboxActive, borderColor: Colors.checkboxActive },
  tick: { fontSize: 13, color: Colors.textInverse, fontWeight: '700' },
  checkLabel: { fontSize: 14, color: Colors.textPrimary },
  sectionHeader: { borderLeftWidth: 4, paddingLeft: 10, paddingVertical: 6, marginTop: 20, marginBottom: 4, backgroundColor: Colors.surfaceElement },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  saveBtn: { backgroundColor: Colors.btnPrimary, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', color: Colors.btnPrimaryText, letterSpacing: 0.3 },
});

const wgrow = StyleSheet.create({
  btn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 15, color: Colors.textPrimary },
  placeholder: { fontSize: 15, color: Colors.textPlaceholder },
  arrow: { fontSize: 14, color: Colors.textMuted },
});

// ── Step I — Cableado ──────────────────────────────────────────────────────────

function StepCableado({ cable, onSaved }: { cable: Cable; onSaved: (c: Cable) => void }) {
  const [form, setForm] = useState<PullFormData>({
    reelNo: cable.DrumNo ?? '',
    designLength: numToStr(cable.DesignLength),
    actualLength: numToStr(cable.PulledLength),
    pulledDate: isoToYMD(cable.PulledDate),
    wgCode: cable.WGPulled ?? '',
    oficial: '',
    cabo: '',
    supervisor: '',
    pendientes: cable.PulledPending ?? '',
  });
  const [wgOpen, setWgOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!cable.WGPulled) return;
    getWorkGroups().then(wgs => {
      const wg = wgs.find(w => w.WGCode === cable.WGPulled);
      if (wg) setForm(f => ({ ...f, oficial: wg.WGLeader, cabo: wg.Foreman, supervisor: wg.Supervisor }));
    }).catch(() => {});
  }, []);

  const balance = form.designLength && form.actualLength
    ? String(parseFloat(form.designLength) - parseFloat(form.actualLength))
    : '';

  function applyWG(wg: WorkGroup) {
    setForm(f => ({ ...f, wgCode: wg.WGCode, oficial: wg.WGLeader, cabo: wg.Foreman, supervisor: wg.Supervisor }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateCable(cable.CableNo, {
        PulledDate: orNull(form.pulledDate),
        WGPulled: orNull(form.wgCode),
        PulledLength: numOrNull(form.actualLength),
        PulledPending: orNull(form.pendientes),
      });
      const merged = { ...cable, ...updated };
      setMsg({ type: 'ok', text: 'Cableado guardado.' });
      cableStore.set(merged);
      onSaved(merged);
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof ApiError ? e.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <FieldLabel>No. Tambor</FieldLabel>
      <FieldInput value={form.reelNo} readOnly />

      <FieldLabel>Longitud Diseño (m)</FieldLabel>
      <FieldInput value={form.designLength} readOnly />

      <FieldLabel>Longitud Actual (m)</FieldLabel>
      <FieldInput value={form.actualLength} onChange={v => setForm(f => ({ ...f, actualLength: v }))} placeholder="0.00" keyboardType="numeric" />

      <FieldLabel>Balance (m)</FieldLabel>
      <FieldInput value={balance} readOnly placeholder="Auto calculado" />

      <FieldLabel>Fecha de Jale</FieldLabel>
      <DateField value={form.pulledDate} onChange={v => setForm(f => ({ ...f, pulledDate: v }))} />

      <FieldLabel>Cuadrilla</FieldLabel>
      <WGPickerRow value={form.wgCode} onPress={() => setWgOpen(true)} />

      <FieldLabel>Oficial</FieldLabel>
      <FieldInput value={form.oficial} readOnly placeholder="Se llena al seleccionar cuadrilla" />

      <FieldLabel>Cabo</FieldLabel>
      <FieldInput value={form.cabo} readOnly placeholder="Se llena al seleccionar cuadrilla" />

      <FieldLabel>Supervisor</FieldLabel>
      <FieldInput value={form.supervisor} readOnly placeholder="Se llena al seleccionar cuadrilla" />

      <FieldLabel>Pendientes</FieldLabel>
      <FieldInput value={form.pendientes} onChange={v => setForm(f => ({ ...f, pendientes: v }))} placeholder="Observaciones o pendientes..." multiline />

      {msg && <Text style={{ marginTop: 12, fontSize: 13, color: msg.type === 'ok' ? Colors.stepDone : Colors.danger }}>{msg.text}</Text>}
      <SaveButton onPress={handleSave} loading={saving} />
      <WGPickerModal visible={wgOpen} onClose={() => setWgOpen(false)} onSelect={applyWG} />
    </View>
  );
}

// ── Step II — Prueba ───────────────────────────────────────────────────────────

function StepPrueba({ cable, onSaved }: { cable: Cable; onSaved: (c: Cable) => void }) {
  const [form, setForm] = useState<TestFormData>({
    testedDate: isoToYMD(cable.TestedDate),
    wgCode: cable.WGTested ?? '',
    oficial: '',
    cabo: '',
    supervisor: '',
    pruebaMeg: !!cable.NeedInsulTest,
    pruebaHipot: !!cable.NeedHipotTest,
  });
  const [wgOpen, setWgOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!cable.WGTested) return;
    getWorkGroups().then(wgs => {
      const wg = wgs.find(w => w.WGCode === cable.WGTested);
      if (wg) setForm(f => ({ ...f, oficial: wg.WGLeader, cabo: wg.Foreman, supervisor: wg.Supervisor }));
    }).catch(() => {});
  }, []);

  function applyWG(wg: WorkGroup) {
    setForm(f => ({ ...f, wgCode: wg.WGCode, oficial: wg.WGLeader, cabo: wg.Foreman, supervisor: wg.Supervisor }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateCable(cable.CableNo, {
        TestedDate: orNull(form.testedDate),
        WGTested: orNull(form.wgCode),
        NeedInsulTest: form.pruebaMeg,
        NeedHipotTest: form.pruebaHipot,
      });
      const merged = { ...cable, ...updated };
      setMsg({ type: 'ok', text: 'Prueba guardada.' });
      cableStore.set(merged);
      onSaved(merged);
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof ApiError ? e.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <FieldLabel>Fecha de Prueba</FieldLabel>
      <DateField value={form.testedDate} onChange={v => setForm(f => ({ ...f, testedDate: v }))} />

      <FieldLabel>Cuadrilla</FieldLabel>
      <WGPickerRow value={form.wgCode} onPress={() => setWgOpen(true)} />

      <FieldLabel>Oficial</FieldLabel>
      <FieldInput value={form.oficial} onChange={v => setForm(f => ({ ...f, oficial: v }))} placeholder="Nombre oficial" />

      <FieldLabel>Cabo</FieldLabel>
      <FieldInput value={form.cabo} onChange={v => setForm(f => ({ ...f, cabo: v }))} placeholder="Nombre cabo" />

      <FieldLabel>Supervisor</FieldLabel>
      <FieldInput value={form.supervisor} onChange={v => setForm(f => ({ ...f, supervisor: v }))} placeholder="Nombre supervisor" />

      <Checkbox checked={form.pruebaMeg} onToggle={() => setForm(f => ({ ...f, pruebaMeg: !f.pruebaMeg }))} label="Prueba MEG realizada" />
      <Checkbox checked={form.pruebaHipot} onToggle={() => setForm(f => ({ ...f, pruebaHipot: !f.pruebaHipot }))} label="Prueba HIPOT realizada" />

      {msg && <Text style={{ marginTop: 12, fontSize: 13, color: msg.type === 'ok' ? Colors.stepDone : Colors.danger }}>{msg.text}</Text>}
      <SaveButton onPress={handleSave} loading={saving} />
      <WGPickerModal visible={wgOpen} onClose={() => setWgOpen(false)} onSelect={applyWG} />
    </View>
  );
}

// ── Step III — Conexión ────────────────────────────────────────────────────────

function StepConexion({ cable, onSaved }: { cable: Cable; onSaved: (c: Cable) => void }) {
  const [form, setForm] = useState<ConnectFormData>({
    fromDate: isoToYMD(cable.ConnectedDate_From),
    fromWGCode: cable.WGConnected_From ?? '',
    fromOficial: '',
    fromCabo: '',
    fromSupervisor: '',
    fromPendientes: cable.ConnectedPending_From ?? '',
    toDate: isoToYMD(cable.ConnectedDate_To),
    toWGCode: cable.WGConnected_To ?? '',
    toOficial: '',
    toCabo: '',
    toSupervisor: '',
    toPendientes: cable.ConnectedPending_To ?? '',
    observaciones: cable.Remarks ?? '',
  });
  const [fromWgOpen, setFromWgOpen] = useState(false);
  const [toWgOpen, setToWgOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const fromCode = cable.WGConnected_From;
    const toCode = cable.WGConnected_To;
    if (!fromCode && !toCode) return;
    getWorkGroups().then(wgs => {
      if (fromCode) {
        const wg = wgs.find(w => w.WGCode === fromCode);
        if (wg) setForm(f => ({ ...f, fromOficial: wg.WGLeader, fromCabo: wg.Foreman, fromSupervisor: wg.Supervisor }));
      }
      if (toCode) {
        const wg = wgs.find(w => w.WGCode === toCode);
        if (wg) setForm(f => ({ ...f, toOficial: wg.WGLeader, toCabo: wg.Foreman, toSupervisor: wg.Supervisor }));
      }
    }).catch(() => {});
  }, []);

  function applyFromWG(wg: WorkGroup) {
    setForm(f => ({ ...f, fromWGCode: wg.WGCode, fromOficial: wg.WGLeader, fromCabo: wg.Foreman, fromSupervisor: wg.Supervisor }));
  }

  function applyToWG(wg: WorkGroup) {
    setForm(f => ({ ...f, toWGCode: wg.WGCode, toOficial: wg.WGLeader, toCabo: wg.Foreman, toSupervisor: wg.Supervisor }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateCable(cable.CableNo, {
        ConnectedDate_From: orNull(form.fromDate),
        WGConnected_From: orNull(form.fromWGCode),
        ConnectedPending_From: orNull(form.fromPendientes),
        ConnectedDate_To: orNull(form.toDate),
        WGConnected_To: orNull(form.toWGCode),
        ConnectedPending_To: orNull(form.toPendientes),
        Remarks: orNull(form.observaciones),
      });
      const merged = { ...cable, ...updated };
      setMsg({ type: 'ok', text: 'Conexión guardada.' });
      cableStore.set(merged);
      onSaved(merged);
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof ApiError ? e.message : 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <SectionHeader label={`ORIGEN — ${cable.FromEqNo}`} color={Colors.stepFrom} />

      <FieldLabel>Fecha Conexión</FieldLabel>
      <DateField value={form.fromDate} onChange={v => setForm(f => ({ ...f, fromDate: v }))} />
      <FieldLabel>Cuadrilla</FieldLabel>
      <WGPickerRow value={form.fromWGCode} onPress={() => setFromWgOpen(true)} />
      <FieldLabel>Oficial</FieldLabel>
      <FieldInput value={form.fromOficial} onChange={v => setForm(f => ({ ...f, fromOficial: v }))} placeholder="Nombre oficial" />
      <FieldLabel>Cabo</FieldLabel>
      <FieldInput value={form.fromCabo} onChange={v => setForm(f => ({ ...f, fromCabo: v }))} placeholder="Nombre cabo" />
      <FieldLabel>Supervisor</FieldLabel>
      <FieldInput value={form.fromSupervisor} onChange={v => setForm(f => ({ ...f, fromSupervisor: v }))} placeholder="Nombre supervisor" />
      <FieldLabel>Pendientes</FieldLabel>
      <FieldInput value={form.fromPendientes} onChange={v => setForm(f => ({ ...f, fromPendientes: v }))} placeholder="Pendientes origen..." multiline />

      <SectionHeader label={`DESTINO — ${cable.ToEqNo}`} color={Colors.stepTo} />

      <FieldLabel>Fecha Conexión</FieldLabel>
      <DateField value={form.toDate} onChange={v => setForm(f => ({ ...f, toDate: v }))} />
      <FieldLabel>Cuadrilla</FieldLabel>
      <WGPickerRow value={form.toWGCode} onPress={() => setToWgOpen(true)} />
      <FieldLabel>Oficial</FieldLabel>
      <FieldInput value={form.toOficial} onChange={v => setForm(f => ({ ...f, toOficial: v }))} placeholder="Nombre oficial" />
      <FieldLabel>Cabo</FieldLabel>
      <FieldInput value={form.toCabo} onChange={v => setForm(f => ({ ...f, toCabo: v }))} placeholder="Nombre cabo" />
      <FieldLabel>Supervisor</FieldLabel>
      <FieldInput value={form.toSupervisor} onChange={v => setForm(f => ({ ...f, toSupervisor: v }))} placeholder="Nombre supervisor" />
      <FieldLabel>Pendientes</FieldLabel>
      <FieldInput value={form.toPendientes} onChange={v => setForm(f => ({ ...f, toPendientes: v }))} placeholder="Pendientes destino..." multiline />

      <SectionHeader label="OBSERVACIONES" color={Colors.textMuted} />
      <FieldInput value={form.observaciones} onChange={v => setForm(f => ({ ...f, observaciones: v }))} placeholder="Observaciones generales..." multiline />

      {msg && <Text style={{ marginTop: 12, fontSize: 13, color: msg.type === 'ok' ? Colors.stepDone : Colors.danger }}>{msg.text}</Text>}
      <SaveButton onPress={handleSave} loading={saving} />

      <WGPickerModal visible={fromWgOpen} onClose={() => setFromWgOpen(false)} onSelect={applyFromWG} />
      <WGPickerModal visible={toWgOpen} onClose={() => setToWgOpen(false)} onSelect={applyToWG} />
    </View>
  );
}

// ── Root Screen ────────────────────────────────────────────────────────────────

export default function CableDetailScreen() {
  const [cable, setCable] = useState<Cable | null>(cableStore.get());
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [activeStep, setActiveStep] = useState<StepKey>(0);

  useEffect(() => {
    const initial = cableStore.get();
    if (!initial) { setLoadingDetail(false); return; }

    getCable(initial.CableNo)
      .then(c => {
        setCable(c);
        cableStore.set(c);
        setActiveStep(firstPendingStep(c));
      })
      .catch(() => {
        // Fallback to cableStore data
        setActiveStep(firstPendingStep(initial));
      })
      .finally(() => setLoadingDetail(false));
  }, []);

  // Update cable + StepIndicator immediately; advance after a beat so the
  // inline "guardado" message is visible before the step switches.
  function handleStepSaved(updated: Cable) {
    setCable(updated);
    setTimeout(() => {
      setActiveStep(prev => (prev < 2 ? ((prev + 1) as StepKey) : prev));
    }, 900);
  }

  if (!cable) {
    return (
      <View style={s.root}>
        <SafeAreaView style={s.headerSafe} edges={['top', 'left', 'right']}>
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/cables')} activeOpacity={0.7}>
              <Text style={s.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Detalle de Cable</Text>
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textMuted, fontSize: 14 }}>No hay cable seleccionado.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.headerSafe} edges={['top', 'left', 'right']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/cables')} activeOpacity={0.7}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{cable.CableNo}</Text>
          <Text style={s.headerSub} numberOfLines={1}>{cable.CableType}</Text>
        </View>
      </SafeAreaView>

      <CableDiagram cable={cable} />
      <StepIndicator cable={cable} active={activeStep} onSelect={setActiveStep} />

      {loadingDetail ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.brand} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* key forces remount with fresh initial state when detail loads */}
          {activeStep === 0 && <StepCableado key={`pull-${cable.CableNo}`} cable={cable} onSaved={handleStepSaved} />}
          {activeStep === 1 && <StepPrueba key={`test-${cable.CableNo}`} cable={cable} onSaved={handleStepSaved} />}
          {activeStep === 2 && <StepConexion key={`conn-${cable.CableNo}`} cable={cable} onSaved={handleStepSaved} />}
        </ScrollView>
      )}

      <AppFooter />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerSafe: { backgroundColor: Colors.headerBg },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, borderBottomWidth: 2, borderBottomColor: Colors.brand },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.headerText, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.headerText, letterSpacing: 0.3, flex: 1 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', maxWidth: 100 },
});

import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { ApiError } from '@/services/api';
import {
  WorkGroup,
  CreateWorkGroupPayload,
  UpdateWorkGroupPayload,
  getWorkGroups,
  createWorkGroup,
  updateWorkGroup,
  deleteWorkGroup,
} from '@/services/workgroups';

// ── Form state ─────────────────────────────────────────────────────────────────

type FormData = {
  wgCode: string;
  wgLeader: string;
  foreman: string;
  supervisor: string;
  password: string;
  confirmPassword: string;
  groupSelect: string;
};

const EMPTY_FORM: FormData = {
  wgCode: '',
  wgLeader: '',
  foreman: '',
  supervisor: '',
  password: '',
  confirmPassword: '',
  groupSelect: '1',
};

// ── Row ────────────────────────────────────────────────────────────────────────

function WorkGroupRow({ wg, onEdit }: { wg: WorkGroup; onEdit: (wg: WorkGroup) => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onEdit(wg)} activeOpacity={0.75}>
      <View style={styles.rowAccent} />
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowCode}>{wg.WGCode}</Text>
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            tintColor={Colors.brand}
            size={18}
          />
        </View>
        <Text style={styles.rowMeta}>Oficial: <Text style={styles.rowMetaValue}>{wg.WGLeader}</Text></Text>
        <Text style={styles.rowMeta}>Cabo: <Text style={styles.rowMetaValue}>{wg.Foreman}</Text></Text>
        <Text style={styles.rowMeta}>Supervisor: <Text style={styles.rowMetaValue}>{wg.Supervisor}</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Modal form ─────────────────────────────────────────────────────────────────

type FormModalProps = {
  mode: 'create' | 'edit';
  initial: FormData;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function FormModal({ mode, initial, onClose, onSave, onDelete }: FormModalProps) {
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setError(null);

    if (mode === 'create') {
      if (!form.wgCode.trim()) { setError('El código de grupo es requerido.'); return; }
      if (!form.wgLeader.trim()) { setError('El líder es requerido.'); return; }
      if (!form.foreman.trim()) { setError('El capataz es requerido.'); return; }
      if (!form.supervisor.trim()) { setError('El supervisor es requerido.'); return; }
      if (!form.password) { setError('La contraseña es requerida.'); return; }
    }

    if (form.password) {
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    } else if (mode === 'edit' && form.confirmPassword) {
      setError('Ingresa la contraseña en ambos campos.');
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    setConfirmDeleteVisible(true);
  }

  async function confirmDelete() {
    setConfirmDeleteVisible(false);
    setDeleting(true);
    setError(null);
    try {
      await onDelete?.();
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const msg = status === 409
        ? 'No se puede eliminar: hay registros o usuarios asociados.'
        : status === 404
          ? 'El grupo ya no existe.'
          : e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />

        <Text style={styles.modalTitle}>
          {mode === 'create' ? 'Nuevo Grupo' : 'Editar Grupo'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.modalForm}>
            {mode === 'create' && (
              <>
                <Field label="CÓDIGO DE GRUPO" value={form.wgCode} onChangeText={v => set('wgCode', v)}
                  placeholder="Ej. WG01" autoCapitalize="characters" />
                <Field label="GRUPO SELECT (número)" value={form.groupSelect}
                  onChangeText={v => set('groupSelect', v.replace(/\D/g, ''))}
                  placeholder="1" keyboardType="number-pad" />
              </>
            )}

            <Field label="OFICIAL" value={form.wgLeader} onChangeText={v => set('wgLeader', v)}
              placeholder="Nombre del oficial" />
            <Field label="CABO" value={form.foreman} onChangeText={v => set('foreman', v)}
              placeholder="Nombre del cabo" />
            <Field label="SUPERVISOR" value={form.supervisor} onChangeText={v => set('supervisor', v)}
              placeholder="Nombre del supervisor" />
            <Field
              label={mode === 'edit' ? 'NUEVA CONTRASEÑA (vacío = sin cambio)' : 'CONTRASEÑA'}
              value={form.password}
              onChangeText={v => set('password', v)}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
            />
            <Field
              label="CONFIRMAR CONTRASEÑA"
              value={form.confirmPassword}
              onChangeText={v => set('confirmPassword', v)}
              placeholder="Repite la contraseña"
              secureTextEntry
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color={Colors.btnPrimaryText} />
                : <Text style={styles.saveBtnText}>{mode === 'create' ? 'Crear Grupo' : 'Guardar Cambios'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            {mode === 'edit' && onDelete && (
              <TouchableOpacity
                style={[styles.deleteBtn, (deleting || loading) && styles.saveBtnDisabled]}
                onPress={handleDelete}
                disabled={deleting || loading}
                activeOpacity={0.85}>
                {deleting ? (
                  <ActivityIndicator color={Colors.btnPrimaryText} />
                ) : (
                  <>
                    <SymbolView
                      name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                      tintColor={Colors.btnPrimaryText}
                      size={16}
                    />
                    <Text style={styles.deleteBtnText}>Eliminar grupo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Confirm delete modal */}
      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}>
        <Pressable style={styles.confirmBackdrop} onPress={() => setConfirmDeleteVisible(false)} />
        <View style={styles.confirmBox}>
          <View style={styles.confirmIconRow}>
            <SymbolView
              name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
              tintColor={Colors.danger}
              size={28}
            />
          </View>
          <Text style={styles.confirmTitle}>Eliminar grupo</Text>
          <Text style={styles.confirmBody}>
            ¿Estás seguro? Esta acción no se puede deshacer.
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={() => setConfirmDeleteVisible(false)}
              activeOpacity={0.7}>
              <Text style={styles.confirmCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={confirmDelete}
              activeOpacity={0.85}>
              <Text style={styles.confirmDeleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'email-address';
};

function Field({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize, keyboardType }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'words'}
        autoCorrect={false}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 56;

export default function WorkGroupsScreen() {
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; initial: FormData } | null>(null);
  const [editTarget, setEditTarget] = useState<WorkGroup | null>(null);

  async function loadGroups() {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await getWorkGroups();
      setGroups(data);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : 'Error al cargar grupos.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { loadGroups(); }, []);

  function openCreate() {
    setEditTarget(null);
    setModal({ mode: 'create', initial: EMPTY_FORM });
  }

  function openEdit(wg: WorkGroup) {
    setEditTarget(wg);
    setModal({
      mode: 'edit',
      initial: {
        wgCode: wg.WGCode,
        wgLeader: wg.WGLeader,
        foreman: wg.Foreman,
        supervisor: wg.Supervisor,
        password: '',
        confirmPassword: '',
        groupSelect: '1',
      },
    });
  }

  async function handleSave(data: FormData) {
    if (modal?.mode === 'create') {
      const payload: CreateWorkGroupPayload = {
        wgCode: data.wgCode.trim(),
        wgLeader: data.wgLeader.trim(),
        foreman: data.foreman.trim(),
        supervisor: data.supervisor.trim(),
        password: data.password,
        groupSelect: parseInt(data.groupSelect, 10) || 1,
      };
      await createWorkGroup(payload);
    } else if (editTarget) {
      const patch: UpdateWorkGroupPayload = {};
      if (data.wgLeader.trim()) patch.wgLeader = data.wgLeader.trim();
      if (data.foreman.trim()) patch.foreman = data.foreman.trim();
      if (data.supervisor.trim()) patch.supervisor = data.supervisor.trim();
      if (data.password) patch.password = data.password;
      await updateWorkGroup(editTarget.WGCode, patch);
    }
    setModal(null);
    await loadGroups();
  }

  async function handleDelete() {
    if (!editTarget) return;
    await deleteWorkGroup(editTarget.WGCode);
    setModal(null);
    await loadGroups();
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/dashboard')} activeOpacity={0.7} style={styles.backBtn}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={Colors.headerText}
              size={20}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Grupos</Text>
          <TouchableOpacity onPress={openCreate} activeOpacity={0.7} style={styles.addBtn}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={Colors.headerText}
              size={22}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content */}
      {loadingList ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : listError ? (
        <View style={styles.centered}>
          <Text style={styles.listError}>{listError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGroups} activeOpacity={0.7}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay grupos registrados.{'\n'}Toca + para crear uno.</Text>
            </View>
          ) : (
            groups.map(wg => (
              <WorkGroupRow key={wg.WGCode} wg={wg} onEdit={openEdit} />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal */}
      {modal && (
        <FormModal
          mode={modal.mode}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  headerSafe: {
    backgroundColor: Colors.headerBg,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.brand,
    gap: 8,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.headerText,
    letterSpacing: 0.5,
  },
  addBtn: {
    padding: 8,
  },

  // List
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: Spacing.two,
    paddingBottom: 100,
  },

  // Row
  row: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowAccent: {
    width: 4,
    backgroundColor: Colors.brand,
  },
  rowContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowCode: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  rowMeta: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  rowMetaValue: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  listError: {
    fontSize: 15,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.brand,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderSubtle,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  modalForm: {
    gap: 20,
    paddingBottom: 8,
  },

  // Form fields
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.textSecondary,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '500',
  },

  // Buttons
  saveBtn: {
    height: 48,
    backgroundColor: Colors.btnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.btnPrimaryText,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  // Confirm delete modal
  confirmBackdrop: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmBox: {
    position: 'absolute',
    top: '35%',
    left: 24,
    right: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmIconRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(186,26,26,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.btnPrimaryText,
  },

  deleteBtn: {
    height: 48,
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.btnPrimaryText,
  },
});

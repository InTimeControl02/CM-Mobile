import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/app-footer';
import { Colors } from '@/constants/theme';
import { ApiError } from '@/services/api';
import { forgotPassword, resetPassword, verifyResetCode } from '@/services/auth';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeRef = useRef<TextInput>(null);

  function clearError() {
    setError(null);
  }

  // ── Step 1: send code ──────────────────────────────────────────────────────

  async function handleSendCode() {
    if (loading) return;
    clearError();
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setStep('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify code ────────────────────────────────────────────────────

  async function handleVerifyCode() {
    if (loading) return;
    clearError();
    const trimmed = code.replace(/\D/g, '');
    if (trimmed.length < 4) {
      setError('Ingresa el código de verificación.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyResetCode({ email: email.trim(), code: trimmed });
      setResetToken(res.resetToken);
      setStep('password');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 400 || e.status === 422
            ? 'Código incorrecto o expirado.'
            : e.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: set new password ───────────────────────────────────────────────

  async function handleResetPassword() {
    if (loading) return;
    clearError();
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), resetToken, newPassword });
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderStepIndicator() {
    const steps: Step[] = ['email', 'code', 'password'];
    const labels = ['Correo', 'Código', 'Contraseña'];
    const current = steps.indexOf(step);
    return (
      <View style={s.stepRow}>
        {steps.map((st, i) => (
          <View key={st} style={s.stepItem}>
            <View style={[s.stepDot, i <= current && s.stepDotActive]}>
              <Text style={[s.stepDotText, i <= current && s.stepDotTextActive]}>
                {i < current ? '✓' : String(i + 1)}
              </Text>
            </View>
            <Text style={[s.stepLabel, i === current && s.stepLabelActive]}>{labels[i]}</Text>
            {i < steps.length - 1 && <View style={[s.stepLine, i < current && s.stepLineDone]} />}
          </View>
        ))}
      </View>
    );
  }

  function renderStep() {
    if (step === 'email') {
      return (
        <>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Recuperar Contraseña</Text>
            <Text style={s.cardSubtitle}>Te enviaremos un código de verificación a tu correo.</Text>
          </View>
          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={s.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={Colors.textPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                value={email}
                onChangeText={v => { setEmail(v); clearError(); }}
                onSubmitEditing={handleSendCode}
                editable={!loading}
              />
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[s.submitButton, loading && s.submitButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleSendCode}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={Colors.btnPrimaryText} />
                : <><Text style={s.submitButtonText}>Enviar Código</Text><Text style={s.submitArrow}>→</Text></>}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 'code') {
      return (
        <>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Ingresa el Código</Text>
            <Text style={s.cardSubtitle}>Código enviado a:</Text>
            <Text style={s.emailText}>{email}</Text>
          </View>
          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CÓDIGO DE VERIFICACIÓN</Text>
              <TextInput
                ref={codeRef}
                style={s.codeInput}
                placeholder="------"
                placeholderTextColor={Colors.textPlaceholder}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
                autoCorrect={false}
                autoComplete="one-time-code"
                spellCheck={false}
                textAlign="center"
                value={code}
                onChangeText={v => { setCode(v.replace(/\D/g, '')); clearError(); }}
                onSubmitEditing={handleVerifyCode}
                editable={!loading}
              />
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[s.submitButton, loading && s.submitButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleVerifyCode}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={Colors.btnPrimaryText} />
                : <><Text style={s.submitButtonText}>Verificar Código</Text><Text style={s.submitArrow}>→</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => { setStep('email'); clearError(); }} activeOpacity={0.7}>
              <Text style={s.backText}>← Cambiar correo</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // step === 'password'
    return (
      <>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Nueva Contraseña</Text>
          <Text style={s.cardSubtitle}>Crea una contraseña segura para tu cuenta.</Text>
        </View>
        <View style={s.form}>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>NUEVA CONTRASEÑA</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textPlaceholder}
              secureTextEntry
              returnKeyType="next"
              value={newPassword}
              onChangeText={v => { setNewPassword(v); clearError(); }}
              editable={!loading}
            />
            <Text style={s.fieldHint}>Mínimo 8 caracteres</Text>
          </View>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textPlaceholder}
              secureTextEntry
              returnKeyType="done"
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); clearError(); }}
              onSubmitEditing={handleResetPassword}
              editable={!loading}
            />
          </View>
          {error ? <Text style={s.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[s.submitButton, loading && s.submitButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleResetPassword}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.btnPrimaryText} />
              : <><Text style={s.submitButtonText}>Guardar Contraseña</Text><Text style={s.submitArrow}>→</Text></>}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={s.logoWrapper}>
            <Image
              source={require('@/assets/images/favicon_logo_ITC-removebg.png')}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          <View style={s.card}>
            <View style={s.accentLine} />
            {renderStepIndicator()}
            {renderStep()}
          </View>

          <TouchableOpacity style={s.loginRow} onPress={() => router.replace('/')} activeOpacity={0.7}>
            <Text style={s.loginText}>← Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </ScrollView>
        <AppFooter />
      </SafeAreaView>
    </View>
  );
}

const STEP_DOT = 28;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLogin },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
    gap: 24,
  },

  logoWrapper: { alignItems: 'center' },
  logo: { width: 120, height: 120 },

  card: {
    width: '92%',
    maxWidth: 448,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 32,
    paddingVertical: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: Colors.brand,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 28,
    paddingLeft: 4,
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: STEP_DOT,
    height: STEP_DOT,
    borderRadius: STEP_DOT / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brand,
  },
  stepDotText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepDotTextActive: { color: Colors.btnPrimaryText },
  stepLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  stepLabelActive: { color: Colors.brand, fontWeight: '700' },
  stepLine: { width: 20, height: 2, backgroundColor: Colors.border, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: Colors.brand },

  // Card content
  cardHeader: { marginBottom: 28, paddingLeft: 4, gap: 6 },
  cardTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cardSubtitle: { fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  emailText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: Colors.brand },

  form: { gap: 20 },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fieldHint: { fontSize: 12, lineHeight: 16, color: Colors.textMuted, marginTop: -4 },
  input: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  codeInput: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
  },
  errorText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: Colors.danger },

  submitButton: {
    height: 48,
    backgroundColor: Colors.btnPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: Colors.btnPrimaryText },
  submitArrow: { fontSize: 20, color: Colors.btnPrimaryText, fontWeight: '600' },

  backBtn: { alignSelf: 'center', paddingVertical: 4 },
  backText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: Colors.textSecondary },

  loginRow: { alignSelf: 'center', paddingVertical: 4 },
  loginText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: Colors.textSecondary },
});

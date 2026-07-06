import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { resendVerification, verifyEmail } from '@/services/auth';

const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  // useLocalSearchParams returns string | string[] — normalize to plain string
  const params = useLocalSearchParams();
  const rawEmail = params.email;
  const email = (Array.isArray(rawEmail) ? rawEmail[0] : rawEmail) ?? '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleVerify() {
    if (loading) return;
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Error de sesión. Vuelve al inicio de sesión.');
      return;
    }

    // Only keep digits in case keyboard added spaces or autocorrect chars
    const trimmed = code.replace(/\D/g, '');
    if (trimmed.length < 4) {
      setError('Ingresa el código de verificación.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email: email.trim(), code: trimmed });
      router.replace('/dashboard');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 400 || e.status === 422
            ? 'Código incorrecto o expirado.'
            : e.message
          : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resending || cooldown > 0 || !email) return;
    setError(null);
    setSuccess(null);
    setResending(true);
    try {
      await resendVerification({ email });
      setSuccess('Código reenviado. Revisa tu correo.');
      setCooldown(RESEND_COOLDOWN);
      setCode('');
      inputRef.current?.focus();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 429
            ? 'Espera antes de solicitar otro código.'
            : e.message
          : 'No se pudo reenviar el código.';
      setError(msg);
    } finally {
      setResending(false);
    }
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

            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Verifica tu Correo</Text>
              <Text style={s.cardSubtitle}>
                Enviamos un código de verificación a:
              </Text>
              {email ? <Text style={s.emailText}>{email}</Text> : null}
            </View>

            <View style={s.form}>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>CÓDIGO DE VERIFICACIÓN</Text>
                <TextInput
                  ref={inputRef}
                  style={s.codeInput}
                  placeholder="------"
                  placeholderTextColor={Colors.textPlaceholder}
                  keyboardType="number-pad"
                  maxLength={8}
                  autoFocus
                  autoCorrect={false}
                  autoComplete="one-time-code"
                  spellCheck={false}
                  value={code}
                  onChangeText={v => { setCode(v.replace(/\D/g, '')); setError(null); setSuccess(null); }}
                  onSubmitEditing={handleVerify}
                  editable={!loading}
                  textAlign="center"
                />
              </View>

              {error ? <Text style={s.errorText}>{error}</Text> : null}
              {success ? <Text style={s.successText}>{success}</Text> : null}

              <TouchableOpacity
                style={[s.submitButton, loading && s.submitButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleVerify}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.btnPrimaryText} />
                ) : (
                  <>
                    <Text style={s.submitButtonText}>Verificar</Text>
                    <Text style={s.submitArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={s.resendRow}>
                <Text style={s.resendText}>¿No recibiste el código? </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending || cooldown > 0}
                  activeOpacity={0.7}>
                  <Text style={[s.resendLink, (resending || cooldown > 0) && s.resendLinkDisabled]}>
                    {cooldown > 0 ? `Reenviar (${cooldown}s)` : 'Reenviar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={s.backBtn}
                onPress={() => router.replace('/')}
                activeOpacity={0.7}>
                <Text style={s.backText}>← Volver al inicio de sesión</Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>

        <AppFooter />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgLogin,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },

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

  cardHeader: {
    marginBottom: 32,
    paddingLeft: 4,
    gap: 8,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  emailText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.brand,
  },

  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: Colors.textPrimary,
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

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.danger,
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.stepFrom,
  },

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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.btnPrimaryText,
  },
  submitArrow: {
    fontSize: 20,
    color: Colors.btnPrimaryText,
    fontWeight: '600',
  },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.textLink,
  },
  resendLinkDisabled: {
    color: Colors.textMuted,
  },

  backBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});

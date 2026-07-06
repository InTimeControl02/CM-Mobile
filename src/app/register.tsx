import { Link, router } from 'expo-router';
import { useState } from 'react';
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
import { register } from '@/services/auth';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (loading) return;
    setError(null);

    if (!username.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 409
            ? 'El usuario o correo ya está registrado.'
            : e.message
          : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/favicon_logo_ITC-removebg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.accentLine} />

            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Crear Cuenta</Text>
              <Text style={styles.cardSubtitle}>Registro al Sistema de Control PCM</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>

              {/* Usuario */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>USUARIO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Elige un usuario"
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={username}
                  onChangeText={setUsername}
                  editable={!loading}
                />
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CORREO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              {/* Contraseña */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textPlaceholder}
                  secureTextEntry
                  returnKeyType="next"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>

              <Text style={styles.fieldHint}>Mínimo 8 caracteres</Text>

              {/* Confirmar */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textPlaceholder}
                  secureTextEntry
                  returnKeyType="done"
                  value={confirm}
                  onChangeText={setConfirm}
                  onSubmitEditing={handleRegister}
                  editable={!loading}
                />
              </View>

              {/* Error */}
              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Botón */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.btnPrimaryText} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Crear Cuenta</Text>
                    <Text style={styles.submitArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Link a login */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                <Link href="/" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
                  </TouchableOpacity>
                </Link>
              </View>

            </View>
          </View>
        </ScrollView>

        <AppFooter />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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

  // Logo
  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },

  // Card
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

  // Form
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
  input: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    marginTop: -4,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.danger,
  },

  // Button
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

  // Login link
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  loginText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.textLink,
  },
});

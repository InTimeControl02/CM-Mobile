import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/app-footer';
import { Colors } from '@/constants/theme';
import { STORAGE_KEYS } from '@/constants/config';
import { ApiError } from '@/services/api';
import { VerificationRequiredError, login, logout } from '@/services/auth';

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const [rememberMe, setRememberMe] = useState(false);
  const [checking, setChecking] = useState(true);

  // On mount: if token + rememberMe=true → go to dashboard; otherwise clear stale token
  useEffect(() => {
    async function checkSession() {
      const [[, token], [, remember]] = await AsyncStorage.multiGet([
        STORAGE_KEYS.token,
        STORAGE_KEYS.rememberMe,
      ]);
      if (token && remember === 'true') {
        router.replace('/dashboard');
      } else if (token) {
        await logout();
      }
      setChecking(false);
    }
    checkSession();
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (loading) return;
    setError(null);

    if (!username.trim() || !password) {
      setError('Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password, rememberMe });
      router.replace('/dashboard');
    } catch (e) {
      if (e instanceof VerificationRequiredError) {
        router.replace({ pathname: '/verify-email', params: { email: e.email } });
        return;
      }
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : e.status === 403
              ? 'Error de servidor. Contacta al administrador.'
              : e.message
          : 'Ocurrió un error inesperado.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Login area — fills at least full screen height */}
        <SafeAreaView style={[styles.loginArea, { minHeight: height }]} edges={['top', 'left', 'right']}>

          {/* Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('@/assets/images/favicon_logo_ITC-removebg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Login card */}
          <View style={styles.card}>
            {/* Left accent line */}
            <View style={styles.accentLine} />

            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Ingreso al Sistema</Text>
              <Text style={styles.cardSubtitle}>Gestión de Control Industrial PCM</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>

              {/* Usuario */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>USUARIO O CORREO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su usuario"
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={username}
                  onChangeText={setUsername}
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
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
              </View>

              {/* Error */}
              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Recordarme + Olvidaste */}
              <View style={styles.optionsGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(v => !v)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberLabel}>Recordarme</Text>
                </TouchableOpacity>
              </View>

              {/* Botón principal */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.btnPrimaryText} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                    <Text style={styles.loginArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotLinkBtn} activeOpacity={0.7} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Link a registro */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.registerLink}>Regístrate</Text>
                  </TouchableOpacity>
                </Link>
              </View>

            </View>
          </View>
        </SafeAreaView>

        {/* Footer al fondo de la página, scrollea con el contenido */}
        <AppFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgLogin,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  // Logo
  logoWrapper: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
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
    gap: 24,
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

  optionsGroup: {
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.checkboxActive,
    borderColor: Colors.checkboxActive,
  },
  checkMark: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
  rememberLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.danger,
  },
  forgotLinkBtn: {
    alignSelf: 'center',
  },
  forgotLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textLink,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.textLink,
  },

  // Button
  loginButton: {
    height: 48,
    backgroundColor: Colors.btnPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: Colors.btnPrimaryText,
  },
  loginArrow: {
    fontSize: 20,
    color: Colors.btnPrimaryText,
    fontWeight: '600',
  },
});

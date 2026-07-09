import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/app-footer';
import { Colors, Spacing } from '@/constants/theme';
import { getLoginType, getStoredUser, getStoredWorkgroup, logout } from '@/services/auth';

// ── Module Card ────────────────────────────────────────────────────────────────

type ModuleCardProps = {
  title: string;
  description: string;
  onPress?: () => void;
};

function ModuleCard({ title, description, onPress }: ModuleCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardAccent} />

      <View style={styles.cardIconWrapper}>
        <SymbolView
          name={{ ios: 'cable.connector', android: 'settings_input_component', web: 'settings_input_component' }}
          tintColor={Colors.brand}
          size={28}
        />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>

      <View style={styles.cardFooterRow}>
        <Text style={styles.cardFooterLabel}>ACCEDER AL MÓDULO</Text>
        <SymbolView
          name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
          tintColor={Colors.brand}
          size={20}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── Placeholder Card ───────────────────────────────────────────────────────────

function PlaceholderCard() {
  return (
    <View style={styles.placeholderCard}>
      <SymbolView
        name={{ ios: 'plus.circle', android: 'add_circle', web: 'add_circle' }}
        tintColor={Colors.textMuted}
        size={32}
        style={{ opacity: 0.5 }}
      />
      <Text style={styles.placeholderText}>Espacio Reservado{'\n'}Módulo Futuro</Text>
    </View>
  );
}

// ── Dashboard Screen ───────────────────────────────────────────────────────────

const HEADER_HEIGHT = 56;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'worker' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarInitials, setAvatarInitials] = useState('');

  useEffect(() => {
    async function loadSession() {
      const type = await getLoginType();
      setLoginType(type);
      if (type === 'worker') {
        const wg = await getStoredWorkgroup();
        const name = wg?.wgCode ?? 'Trabajador';
        setDisplayName(name);
        setAvatarInitials(name.slice(0, 2).toUpperCase());
      } else {
        const user = await getStoredUser();
        const name = user?.username ?? 'Admin';
        setDisplayName(name);
        setAvatarInitials(name.slice(0, 2).toUpperCase());
      }
    }
    loadSession();
  }, []);

  function openMenu() { setMenuVisible(v => !v); }
  function closeMenu() { setMenuVisible(false); }

  async function handleLogout() {
    closeMenu();
    await logout();
    router.replace('/');
  }

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <SafeAreaView style={styles.headerSafe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>CM</Text>

          {/* Avatar — opens profile menu */}
          <TouchableOpacity onPress={openMenu} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Panel de Control</Text>

        <View style={styles.cardsGrid}>
          <ModuleCard
            title="Registro de Cableado"
            description="Gestión y seguimiento de tendido de cables y conectividad. Monitoreo de rutas, estado de instalación y reportes de certificación."
            onPress={() => router.push('/cables')}
          />
          {loginType === 'admin' && (
            <ModuleCard
              title="Gestión de Grupos"
              description="Creación y edición de grupos de trabajo. Administra códigos de grupo, líderes, capataces y supervisores."
              onPress={() => router.push('/workgroups')}
            />
          )}
        </View>
      </ScrollView>

      {/* Global footer */}
      <AppFooter />

      {/* Backdrop — closes profile menu */}
      {menuVisible && (
        <Pressable style={styles.backdrop} onPress={closeMenu} />
      )}

      {/* Profile dropdown */}
      {menuVisible && (
        <View style={[styles.dropdown, { top: insets.top + HEADER_HEIGHT }]}>
          <View style={styles.dropdownUserRow}>
            <View style={styles.dropdownAvatar}>
              <Text style={styles.dropdownAvatarText}>{avatarInitials}</Text>
            </View>
            <View>
              <Text style={styles.dropdownUserRole}>
                {loginType === 'worker' ? 'Grupo' : 'Administrador'}
              </Text>
              <Text style={styles.dropdownUserName}>{displayName}</Text>
            </View>
          </View>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity style={styles.dropdownLogoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'arrow.right.square', android: 'logout', web: 'logout' }}
              tintColor={Colors.danger}
              size={20}
            />
            <Text style={styles.dropdownLogoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.brand,
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.headerText,
    letterSpacing: 1.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brandInverse,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },

  // Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  pageTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.two,
  },
  cardsGrid: {
    gap: Spacing.three,
  },

  // Module card
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 24,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: Colors.brand,
  },
  cardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  cardBody: {
    gap: Spacing.one,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardDesc: {
    paddingLeft: 8,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  cardFooterLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '600',
    color: Colors.brand,
    textTransform: 'uppercase',
  },

  // Placeholder card
  placeholderCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: 24,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textMuted,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Dropdown menu
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 49,
  },
  dropdown: {
    position: 'absolute',
    right: 12,
    zIndex: 50,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  dropdownUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  dropdownUserRole: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dropdownUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 0,
  },
  dropdownLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: 'transparent',
  },
  dropdownLogoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.danger,
  },
});

import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/app-footer';
import { Colors, Spacing } from '@/constants/theme';
import { ApiError } from '@/services/api';
import { Cable, CableFilterType, getCables } from '@/services/cables';
import { cableStore } from '@/store/cable-selection';

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: CableFilterType; label: string }[] = [
  { key: 'all',        label: 'Todos' },
  { key: 'pulling',    label: 'Por Jalar' },
  { key: 'testing',    label: 'Por Probar' },
  { key: 'connecting', label: 'Por Conectar' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ── Cable List Item ────────────────────────────────────────────────────────────

function CableItem({
  cable,
  onPress,
}: {
  cable: Cable;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.itemAccent} />
      <View style={styles.itemBody}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCableNo}>{cable.CableNo}</Text>
          <Text style={styles.itemType} numberOfLines={1}>{cable.CableType}</Text>
        </View>
        <View style={styles.itemRoute}>
          <Text style={styles.itemEq} numberOfLines={1}>{cable.FromEqNo}</Text>
          <Text style={styles.itemArrow}>→</Text>
          <Text style={styles.itemEq} numberOfLines={1}>{cable.ToEqNo}</Text>
        </View>
      </View>
      <Text style={styles.itemChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CablesScreen() {
  const [activeFilter, setActiveFilter] = useState<CableFilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [cables, setCables] = useState<Cable[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(
    async (type: CableFilterType, search: string, targetPage: number, pageSize: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCables(type, search, targetPage, pageSize);
        setCables(data);
        setPage(targetPage);
        setHasMore(data.length === pageSize);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Error al cargar cables.';
        setError(msg);
        setCables([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Filter or page-size change → reset to page 1 immediately (no debounce).
  useEffect(() => {
    fetchPage(activeFilter, searchText, 1, limit);
  }, [activeFilter, limit]);

  // Search text → debounced, also resets to page 1.
  // lastSearchRef skips the redundant fetch on mount (filter effect above already covers it).
  const lastSearchRef = useRef(searchText);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchText === lastSearchRef.current) return;
    debounceRef.current = setTimeout(() => {
      lastSearchRef.current = searchText;
      fetchPage(activeFilter, searchText, 1, limit);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  function handleFilterChange(filter: CableFilterType) {
    setActiveFilter(filter);
  }

  function handlePrevPage() {
    if (page <= 1 || loading) return;
    fetchPage(activeFilter, searchText, page - 1, limit);
  }

  function handleNextPage() {
    if (!hasMore || loading) return;
    fetchPage(activeFilter, searchText, page + 1, limit);
  }

  function handleLimitChange(size: number) {
    setLimit(size);
  }

  function handleCablePress(cable: Cable) {
    cableStore.set(cable);
    router.push('/cable-detail');
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/dashboard')} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro de Cableado</Text>
        </View>
      </SafeAreaView>

      {/* ── Filter tabs — wrapped in View to prevent layout split bug ── */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
              onPress={() => handleFilterChange(tab.key)}
              activeOpacity={0.7}>
              <Text style={[styles.tabLabel, activeFilter === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cable, equipo, tipo..."
          placeholderTextColor={Colors.textPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Cable list ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchCables(activeFilter, searchText)}
            activeOpacity={0.7}>
            <Text style={styles.retryLabel}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cables}
          keyExtractor={c => c.CableNo}
          renderItem={({ item }) => (
            <CableItem cable={item} onPress={() => handleCablePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No se encontraron cables.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── Pagination controls ── */}
      <View style={styles.paginationBar}>
        <View style={styles.pageSizeGroup}>
          <Text style={styles.pageSizeLabel}>Por página:</Text>
          {PAGE_SIZE_OPTIONS.map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.pageSizeBtn, limit === size && styles.pageSizeBtnActive]}
              onPress={() => handleLimitChange(size)}
              activeOpacity={0.7}>
              <Text style={[styles.pageSizeText, limit === size && styles.pageSizeTextActive]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pageNavGroup}>
          <TouchableOpacity
            style={[styles.pageNavBtn, page <= 1 && styles.pageNavBtnDisabled]}
            onPress={handlePrevPage}
            disabled={page <= 1 || loading}
            activeOpacity={0.7}>
            <Text style={[styles.pageNavText, page <= 1 && styles.pageNavTextDisabled]}>‹ Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>Página {page}</Text>
          <TouchableOpacity
            style={[styles.pageNavBtn, !hasMore && styles.pageNavBtnDisabled]}
            onPress={handleNextPage}
            disabled={!hasMore || loading}
            activeOpacity={0.7}>
            <Text style={[styles.pageNavText, !hasMore && styles.pageNavTextDisabled]}>Siguiente ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AppFooter />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  headerSafe: { backgroundColor: Colors.headerBg },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.brand,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.headerText, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.headerText, letterSpacing: 0.3, flex: 1 },

  // Filter tabs — outer View fixes layout split bug
  tabsContainer: {
    flexShrink: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.textInverse },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchIcon: { fontSize: 20, color: Colors.textMuted, lineHeight: 24 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 0 },
  clearBtn: { fontSize: 14, color: Colors.textMuted, paddingHorizontal: 4 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: Spacing.three },
  separator: { height: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  itemAccent: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.brand },
  itemBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemCableNo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  itemType: { fontSize: 12, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  itemRoute: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemEq: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.2 },
  itemArrow: { fontSize: 13, color: Colors.textMuted },
  itemChevron: { fontSize: 22, color: Colors.textMuted, paddingHorizontal: 12 },

  // Pagination
  paginationBar: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  pageSizeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageSizeLabel: { fontSize: 12, color: Colors.textMuted, marginRight: 2 },
  pageSizeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.borderSubtle },
  pageSizeBtnActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  pageSizeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  pageSizeTextActive: { color: Colors.textInverse },
  pageNavGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageNavBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  pageNavBtnDisabled: { opacity: 0.4 },
  pageNavText: { fontSize: 13, fontWeight: '600', color: Colors.brand },
  pageNavTextDisabled: { color: Colors.textMuted },
  pageIndicator: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  errorText: { fontSize: 14, color: Colors.danger, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.brand },
  retryLabel: { fontSize: 14, fontWeight: '600', color: Colors.textInverse },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});

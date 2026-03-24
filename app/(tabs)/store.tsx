import { StoreAPI } from '@/api/store';
import { StoreSkeleton } from '@/components/store/StoreSkeleton';
import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GAP = 12;
const H_PAD = 20;
const COLUMN_WIDTH = (width - H_PAD * 2 - GAP) / 2;

export default function StoreScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await StoreAPI.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories from products
  const categories = ['Todos', ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))];
  const filtered = !activeCategory || activeCategory === 'Todos'
    ? products
    : products.filter((p: any) => p.category === activeCategory);

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        {/* Category pill on image */}
        {item.category && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.category.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.price}</Text>
          <View style={styles.addBtn}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <StoreSkeleton />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tienda</Text>
            <Text style={styles.headerSubtitle}>{filtered.length} productos</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="bag-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Category filter ── */}
        {categories.length > 1 && (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            contentContainerStyle={styles.filterList}
            style={styles.filterListContainer}
            renderItem={({ item }) => {
              const isActive = (!activeCategory && item === 'Todos') || activeCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveCategory(item === 'Todos' ? null : item)}
                  activeOpacity={0.75}
                >
                  {isActive && (
                    <LinearGradient
                      colors={theme.gradients.accent}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ── Grid ── */}
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bag-remove-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyText}>No hay productos disponibles.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: theme.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  filterListContainer: {
    flexGrow: 0,
    maxHeight: 44,
  },
  filterList: {
    paddingHorizontal: H_PAD,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderMuted,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    height: 32,
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: theme.accent,
  },
  filterChipText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    paddingBottom: 100,
  },
  gridRow: {
    gap: GAP,
    justifyContent: 'space-between',
  },

  // ── Product card ──────────────────────────────────────────────────────────
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    marginBottom: GAP + 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  imageWrap: {
    width: '100%',
    height: COLUMN_WIDTH,
    backgroundColor: theme.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 17,
  },
  description: {
    fontSize: 11,
    color: theme.textMuted,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});

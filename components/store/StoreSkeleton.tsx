import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GAP = 12;
const H_PAD = 20;
const COLUMN_WIDTH = (width - H_PAD * 2 - GAP) / 2;

// ─── Shimmer bone ─────────────────────────────────────────────────────────────
function Bone({ w, h, radius = 8, style }: { w: number | string; h: number; radius?: number; style?: any }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        { width: w as any, height: h, borderRadius: radius, backgroundColor: theme.surface, opacity },
        style,
      ]}
    />
  );
}

// ─── Product card skeleton ────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Image area */}
      <Bone w="100%" h={COLUMN_WIDTH} radius={0} />
      {/* Category pill */}
      <Bone w={56} h={18} radius={8} style={styles.pill} />
      {/* Body */}
      <View style={styles.cardBody}>
        <Bone w="90%" h={13} radius={4} />
        <Bone w="65%" h={13} radius={4} style={{ marginTop: 4 }} />
        <Bone w="80%" h={11} radius={4} style={{ marginTop: 6 }} />
        <Bone w="55%" h={11} radius={4} style={{ marginTop: 3 }} />
        <View style={styles.priceRow}>
          <Bone w={48} h={16} radius={4} />
          <Bone w={28} h={28} radius={8} />
        </View>
      </View>
    </View>
  );
}

// ─── StoreSkeleton ────────────────────────────────────────────────────────────
export function StoreSkeleton() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ gap: 6 }}>
            <Bone w={100} h={24} radius={6} />
            <Bone w={80} h={13} radius={4} />
          </View>
          <Bone w={38} h={38} radius={12} />
        </View>

        {/* ── Category chips ── */}
        <View style={styles.filterRow}>
          {[72, 80, 64, 88].map((w, i) => (
            <Bone key={i} w={w} h={32} radius={20} />
          ))}
        </View>

        {/* ── Grid ── */}
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            i % 2 === 0 ? (
              <View key={i} style={styles.gridRow}>
                <CardSkeleton />
                <CardSkeleton />
              </View>
            ) : null
          ))}
        </View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  safeArea: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 16,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: H_PAD,
    marginBottom: 16,
  },

  // Grid
  grid: {
    paddingHorizontal: H_PAD,
    gap: GAP + 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: GAP,
  },

  // Card
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  pill: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  cardBody: {
    padding: 12,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});

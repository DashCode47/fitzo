import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_W = width - 48;

// ─── Shimmer bone ─────────────────────────────────────────────────────────────
function Bone({ w, h, radius = 8, style }: { w: number | string; h: number; radius?: number; style?: any }) {
  const theme = useAppTheme();
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

// ─── HomeSkeleton ─────────────────────────────────────────────────────────────
export function HomeSkeleton() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bone w={140} h={20} radius={6} />
            <Bone w={72} h={22} radius={20} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.headerRight}>
            <Bone w={38} h={38} radius={12} />
            <Bone w={38} h={38} radius={12} />
          </View>
        </View>

        {/* ── CrowdMeter ── */}
        <View style={styles.crowdWrap}>
          <View style={styles.crowdCard}>
            <Bone w={36} h={36} radius={10} />
            <View style={{ flex: 1, gap: 6 }}>
              <Bone w={80} h={10} radius={4} />
              <Bone w={140} h={14} radius={4} />
            </View>
            <Bone w={64} h={6} radius={3} />
          </View>
        </View>

        {/* ── Promo Carousel ── */}
        <View style={styles.carouselWrap}>
          <Bone w={CARD_W} h={190} radius={20} style={{ marginHorizontal: 20 }} />
          <View style={styles.paginationRow}>
            <Bone w={18} h={6} radius={3} />
            <Bone w={6} h={6} radius={3} />
            <Bone w={6} h={6} radius={3} />
          </View>
        </View>

        {/* ── Events ── */}
        <View style={styles.section}>
          <Bone w={140} h={16} radius={5} style={{ marginBottom: 10 }} />
          <View style={styles.card}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.eventRow, i < 2 && styles.eventDivider]}>
                <Bone w={44} h={44} radius={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone w="80%" h={14} radius={4} />
                  <Bone w={60} h={10} radius={4} />
                </View>
                <Bone w={28} h={28} radius={8} />
              </View>
            ))}
          </View>
        </View>

        {/* ── Podium ── */}
        <View style={styles.section}>
          <Bone w={100} h={16} radius={5} style={{ marginBottom: 10 }} />
          <View style={[styles.card, styles.podiumCard]}>
            <View style={styles.podiumRow}>
              {/* 2nd */}
              <View style={styles.podiumItem}>
                <Bone w={56} h={56} radius={28} />
                <Bone w={60} h={10} radius={4} style={{ marginTop: 8 }} />
                <Bone w={40} h={10} radius={4} style={{ marginTop: 4 }} />
              </View>
              {/* 1st – elevated */}
              <View style={[styles.podiumItem, { marginTop: -20 }]}>
                <Bone w={22} h={22} radius={11} style={{ marginBottom: 6 }} />
                <Bone w={72} h={72} radius={36} />
                <Bone w={72} h={12} radius={4} style={{ marginTop: 8 }} />
                <Bone w={50} h={10} radius={4} style={{ marginTop: 4 }} />
              </View>
              {/* 3rd */}
              <View style={styles.podiumItem}>
                <Bone w={56} h={56} radius={28} />
                <Bone w={60} h={10} radius={4} style={{ marginTop: 8 }} />
                <Bone w={40} h={10} radius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Nutrition ── */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <Bone w={120} h={16} radius={5} style={{ marginBottom: 10 }} />
          <View style={[styles.card, styles.nutritionCard]}>
            <Bone w={72} h={72} radius={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <Bone w={80} h={9} radius={4} />
              <Bone w="85%" h={14} radius={4} />
              <Bone w="85%" h={12} radius={4} />
              <Bone w={120} h={12} radius={4} />
            </View>
            <Bone w={32} h={32} radius={10} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    gap: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // CrowdMeter
  crowdWrap: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  crowdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  // Carousel
  carouselWrap: {
    marginTop: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },

  // Events
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  eventDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },

  // Podium
  podiumCard: {
    padding: 20,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  // Nutrition
  nutritionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
});

import { theme } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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

// ─── Single row skeleton ──────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <View style={styles.row}>
      {/* Rank */}
      <Bone w={20} h={14} radius={4} style={{ marginHorizontal: 4 }} />
      {/* Avatar */}
      <Bone w={44} h={44} radius={13} />
      {/* Info */}
      <View style={styles.info}>
        <Bone w="60%" h={14} radius={4} />
        <Bone w={60} h={10} radius={4} style={{ marginTop: 4 }} />
      </View>
      {/* Score */}
      <View style={styles.scoreCol}>
        <Bone w={48} h={16} radius={4} />
        <Bone w={24} h={9} radius={3} style={{ marginTop: 3 }} />
      </View>
    </View>
  );
}

// ─── RankingsSkeleton (list area only) ───────────────────────────────────────
export function RankingsSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 8 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
});

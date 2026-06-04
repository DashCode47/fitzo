import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    list: {
      paddingHorizontal: 20,
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
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
      alignItems: "flex-end",
    },
  });

// ─── Shimmer bone ─────────────────────────────────────────────────────────────
function Bone({
  w,
  h,
  radius = 8,
  style,
  theme,
}: {
  w: number | string;
  h: number;
  radius?: number;
  style?: any;
  theme: AppTheme;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: radius,
          backgroundColor: theme.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Single row skeleton ──────────────────────────────────────────────────────
function RowSkeleton({ theme, styles }: { theme: AppTheme; styles: any }) {
  return (
    <View style={styles.row}>
      <Bone
        w={20}
        h={14}
        radius={4}
        style={{ marginHorizontal: 4 }}
        theme={theme}
      />
      <Bone w={44} h={44} radius={13} theme={theme} />
      <View style={styles.info}>
        <Bone w="60%" h={14} radius={4} theme={theme} />
        <Bone w={60} h={10} radius={4} style={{ marginTop: 4 }} theme={theme} />
      </View>
      <View style={styles.scoreCol}>
        <Bone w={48} h={16} radius={4} theme={theme} />
        <Bone w={24} h={9} radius={3} style={{ marginTop: 3 }} theme={theme} />
      </View>
    </View>
  );
}

// ─── RankingsSkeleton (list area only) ───────────────────────────────────────
export function RankingsSkeleton() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.list}>
      {Array.from({ length: 8 }).map((_, i) => (
        <RowSkeleton key={i} theme={theme} styles={styles} />
      ))}
    </View>
  );
}

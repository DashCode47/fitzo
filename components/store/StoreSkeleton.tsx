import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 12;
const H_PAD = 20;
const COLUMN_WIDTH = (width - H_PAD * 2 - GAP) / 2;

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
    },
    safeArea: {
      flex: 1,
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: H_PAD,
      paddingTop: 12,
      paddingBottom: 16,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: H_PAD,
      marginBottom: 16,
    },
    grid: {
      paddingHorizontal: H_PAD,
      gap: GAP + 4,
    },
    gridRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: GAP,
    },
    card: {
      width: COLUMN_WIDTH,
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    pill: {
      position: "absolute",
      top: 10,
      left: 10,
    },
    cardBody: {
      padding: 12,
      gap: 2,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
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

// ─── Product card skeleton ────────────────────────────────────────────────────
function CardSkeleton({ theme, styles }: { theme: AppTheme; styles: any }) {
  return (
    <View style={styles.card}>
      <Bone w="100%" h={COLUMN_WIDTH} radius={0} theme={theme} />
      <Bone w={56} h={18} radius={8} style={styles.pill} theme={theme} />
      <View style={styles.cardBody}>
        <Bone w="90%" h={13} radius={4} theme={theme} />
        <Bone
          w="65%"
          h={13}
          radius={4}
          style={{ marginTop: 4 }}
          theme={theme}
        />
        <Bone
          w="80%"
          h={11}
          radius={4}
          style={{ marginTop: 6 }}
          theme={theme}
        />
        <Bone
          w="55%"
          h={11}
          radius={4}
          style={{ marginTop: 3 }}
          theme={theme}
        />
        <View style={styles.priceRow}>
          <Bone w={48} h={16} radius={4} theme={theme} />
          <Bone w={28} h={28} radius={8} theme={theme} />
        </View>
      </View>
    </View>
  );
}

// ─── StoreSkeleton ────────────────────────────────────────────────────────────
export function StoreSkeleton() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={{ gap: 6 }}>
            <Bone w={100} h={24} radius={6} theme={theme} />
            <Bone w={80} h={13} radius={4} theme={theme} />
          </View>
          <Bone w={38} h={38} radius={12} theme={theme} />
        </View>

        <View style={styles.filterRow}>
          {[72, 80, 64, 88].map((w, i) => (
            <Bone key={i} w={w} h={32} radius={20} theme={theme} />
          ))}
        </View>

        <View style={styles.grid}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.gridRow}>
              <CardSkeleton theme={theme} styles={styles} />
              <CardSkeleton theme={theme} styles={styles} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

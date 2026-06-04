import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MuscleRank } from "@/api/ranks";
import { MUSCLE_GROUPS, RANK_TIERS } from "@/constants/ranks";

interface MuscleRankCardProps {
  rank: MuscleRank;
  bodyWeight: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    iconContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    muscleLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    repExText: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 2,
      textTransform: "uppercase",
    },
    tierBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tierText: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    alignRight: {
      alignItems: "flex-end",
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    progressContainer: {
      gap: 8,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.surface,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 6,
    },
    progressText: {
      fontSize: 11,
      color: theme.textSecondary,
      textAlign: "right",
    },
  });

export const MuscleRankCard: React.FC<MuscleRankCardProps> = ({
  rank,
  bodyWeight,
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const muscleInfo = MUSCLE_GROUPS.find((m) => m.key === rank.muscleGroup);
  const tierInfo = RANK_TIERS[rank.tierIndex];
  const isCore = rank.muscleGroup === "core";

  // Calculate weight needed for next tier
  const weightNeeded =
    rank.nextTierRatio && !isCore
      ? Math.max(0, Math.ceil(rank.nextTierRatio * bodyWeight) - rank.maxWeight)
      : null;

  const secondsNeeded =
    rank.nextTierRatio && isCore
      ? Math.max(0, Math.ceil(rank.nextTierRatio) - rank.maxWeight)
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={muscleInfo?.icon as any}
            size={24}
            color={theme.accent}
          />
          <View>
            <Text style={styles.muscleLabel}>{muscleInfo?.label}</Text>
            <Text style={styles.repExText}>{rank.representativeExercise}</Text>
          </View>
        </View>
        <View
          style={[styles.tierBadge, { backgroundColor: tierInfo.color + "20" }]}
        >
          <Text style={[styles.tierText, { color: tierInfo.color }]}>
            {tierInfo.name}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>
            {isCore ? "Máximo" : "Peso Máx."}
          </Text>
          <Text style={styles.statValue}>
            {rank.maxWeight} {isCore ? "seg" : "kg"}
          </Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={styles.statLabel}>
            {isCore ? "Ratio" : "Ratio Peso"}
          </Text>
          <Text style={styles.statValue}>{rank.ratio.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${rank.progress * 100}%`,
                backgroundColor: tierInfo.color,
              },
            ]}
          />
        </View>
        <View style={styles.progressFooter}>
          {weightNeeded !== null && (
            <Text style={styles.progressText}>
              Faltan{" "}
              <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>
                {weightNeeded}kg
              </Text>{" "}
              para el prox. nivel
            </Text>
          )}
          {secondsNeeded !== null && (
            <Text style={styles.progressText}>
              Faltan{" "}
              <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>
                {secondsNeeded}s
              </Text>{" "}
              para el prox. nivel
            </Text>
          )}
          {rank.nextTierRatio === null && (
            <Text style={styles.progressText}>¡Nivel Máximo alcanzado!</Text>
          )}
        </View>
      </View>
    </View>
  );
};

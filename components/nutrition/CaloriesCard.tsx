import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { calculateCalories } from "@/utils/nutritionCalc";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Calc = ReturnType<typeof calculateCalories>;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

const GOAL_META: Record<Calc["finalGoal"], { label: string; icon: IconName }> = {
  cut: { label: "Perder grasa", icon: "trending-down" },
  maintain: { label: "Mantener", icon: "remove" },
  bulk: { label: "Ganar músculo", icon: "trending-up" },
};

const MACROS = [
  { key: "protein", label: "Proteína", color: "#60A5FA", kcalPerG: 4 },
  { key: "carbs", label: "Carbos", color: "#FBBF24", kcalPerG: 4 },
  { key: "fat", label: "Grasas", color: "#F472B6", kcalPerG: 9 },
] as const;

interface Props {
  calc: Calc;
  stats: { weight: number; height: number; age: number; gender: string };
}

export function CaloriesCard({ calc, stats }: Props) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const goal = GOAL_META[calc.finalGoal];
  const diff = calc.calories - calc.tdee;

  const macroKcal = MACROS.map((m) => calc.macros[m.key] * m.kcalPerG);
  const totalKcal = macroKcal.reduce((a, b) => a + b, 0) || 1;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[theme.accentDim, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>CALORÍAS DIARIAS</Text>
        <View style={styles.goalChip}>
          <Ionicons name={goal.icon} size={14} color={theme.accent} />
          <Text style={styles.goalText}>{goal.label}</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{calc.calories.toLocaleString("es-ES")}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>

      {/* How the number is built: maintenance ± goal adjustment */}
      <Text style={styles.formula}>
        Mantenimiento {calc.tdee.toLocaleString("es-ES")}
        {diff !== 0 && (
          <Text style={styles.formulaStrong}>
            {"  "}
            {diff > 0 ? "+" : "−"}
            {Math.abs(diff)} {diff > 0 ? "superávit" : "déficit"}
          </Text>
        )}
      </Text>

      {/* Macro split, proportional to kcal */}
      <View style={styles.bar}>
        {MACROS.map((m, i) => (
          <View
            key={m.key}
            style={{ flex: macroKcal[i] / totalKcal, backgroundColor: m.color }}
          />
        ))}
      </View>

      <View style={styles.macros}>
        {MACROS.map((m, i) => (
          <View key={m.key} style={styles.macro}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.dot, { backgroundColor: m.color }]} />
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
            <Text style={styles.macroValue}>
              {calc.macros[m.key]}
              <Text style={styles.macroUnit}> g</Text>
            </Text>
            <Text style={styles.macroPct}>{Math.round((macroKcal[i] / totalKcal) * 100)}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Ionicons name="person-outline" size={12} color={theme.textMuted} />
        <Text style={styles.footerText}>
          {stats.weight} kg · {stats.height} cm · {stats.age} años ·{" "}
          {stats.gender === "M" ? "Hombre" : "Mujer"}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderRadius: 22,
      padding: 20,
      marginBottom: 12,
      overflow: "hidden",
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.4,
      color: theme.accentLight,
    },
    goalChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    goalText: { fontSize: 12, fontWeight: "700", color: theme.accent },

    valueRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 10 },
    value: {
      fontSize: 52,
      fontWeight: "900",
      letterSpacing: -2,
      color: theme.textPrimary,
      lineHeight: 56,
    },
    unit: { fontSize: 16, fontWeight: "700", color: theme.textSecondary },
    formula: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    formulaStrong: { color: theme.textSecondary, fontWeight: "700" },

    bar: {
      flexDirection: "row",
      height: 10,
      borderRadius: 5,
      overflow: "hidden",
      gap: 2,
      marginTop: 18,
      marginBottom: 14,
    },
    macros: { flexDirection: "row", gap: 8 },
    macro: {
      flex: 1,
      padding: 10,
      borderRadius: 14,
      backgroundColor: theme.surface,
      gap: 2,
    },
    macroLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    macroLabel: { fontSize: 11, fontWeight: "700", color: theme.textSecondary },
    macroValue: { fontSize: 20, fontWeight: "800", color: theme.textPrimary, marginTop: 4 },
    macroUnit: { fontSize: 12, fontWeight: "600", color: theme.textMuted },
    macroPct: { fontSize: 11, color: theme.textMuted },

    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderSubtle,
    },
    footerText: { fontSize: 12, color: theme.textMuted },
  });

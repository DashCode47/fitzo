import { NutritionAPI, UserStats, WeightLog } from "@/api/nutrition";
import { WorkoutsAPI } from "@/api/workouts";
import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { withTimeout } from "@/utils/async";
import { calculateCalories } from "@/utils/nutritionCalc";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Circle, Polyline, Svg } from "react-native-svg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type Goal = "cut" | "bulk" | "maintain";
type Activity = "sedentary" | "moderate" | "active";
type Gender = "M" | "F";

const GOAL_LABELS: Record<Goal, string> = {
  cut: "Perder grasa",
  maintain: "Mantenimiento",
  bulk: "Ganar músculo",
};
const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "Sedentario",
  moderate: "Moderado",
  active: "Activo",
};
const MACRO_ICONS: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  Prot: "barbell-outline",
  Carb: "leaf-outline",
  Fat: "water-outline",
};

// Rough weekly-workout ranges each declared activity level implies. Used only
// to flag an obvious mismatch (e.g. "sedentary" but training 5x/week) — not
// meant to be a precise fitness classification, just a nudge to revisit the
// setting since it directly feeds the calorie calculation.
const ACTIVITY_WEEKLY_RANGE: Record<Activity, [number, number]> = {
  sedentary: [0, 1],
  moderate: [1, 4],
  active: [4, Infinity],
};

// Recent logs are expected newest-first (as returned by WorkoutsAPI.getWorkoutLogs).
// Looks at the last `weeks` calendar weeks of logs (excluding the current, possibly
// partial, week) and suggests a different activity level if the observed weekly
// average clearly falls outside the range the declared level implies.
export function suggestActivityLevel(
  recentLogs: { started_at: string }[],
  declaredLevel: Activity,
  weeks = 2,
): Activity | null {
  if (recentLogs.length === 0) return null;

  const now = new Date();
  const dow = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfThisWeek.setHours(0, 0, 0, 0);

  const windowStart = new Date(startOfThisWeek);
  windowStart.setDate(windowStart.getDate() - weeks * 7);

  const countInWindow = recentLogs.filter((log) => {
    const started = new Date(log.started_at);
    return started >= windowStart && started < startOfThisWeek;
  }).length;

  const weeklyAvg = countInWindow / weeks;
  const [min, max] = ACTIVITY_WEEKLY_RANGE[declaredLevel];
  if (weeklyAvg >= min && weeklyAvg <= max) return null;

  const suggested = (Object.entries(ACTIVITY_WEEKLY_RANGE) as [Activity, [number, number]][])
    .find(([, [lo, hi]]) => weeklyAvg >= lo && weeklyAvg <= hi);
  return suggested && suggested[0] !== declaredLevel ? suggested[0] : null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 220,
    },
    scroll: {
      padding: 20,
      paddingBottom: 40,
    },
    pageHeader: {
      alignItems: "center",
      paddingVertical: 20,
      gap: 8,
      marginBottom: 8,
    },
    pageIconWrap: {
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 10,
      marginBottom: 4,
    },
    pageIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    pageSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
    },
    dashHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 16,
      paddingTop: 12,
    },
    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    editBtnText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      padding: 16,
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textMuted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    metricsRow: {
      flexDirection: "row",
      gap: 10,
    },
    metricInput: {
      flex: 1,
    },
    metricLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "600",
      marginBottom: 6,
    },
    metricBox: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    metricField: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    metricUnit: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },
    chipRow: {
      flexDirection: "row",
      gap: 8,
    },
    selectChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      backgroundColor: theme.surface,
      alignItems: "center",
      overflow: "hidden",
    },
    selectChipActive: {
      borderColor: theme.accent,
    },
    selectChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "500",
    },
    selectChipTextActive: {
      color: "#fff",
      fontWeight: "700",
    },
    primaryBtn: {
      borderRadius: 14,
      overflow: "hidden",
      marginTop: 8,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    primaryBtnGradient: {
      height: 52,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    caloriesCard: {
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 12,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 10,
    },
    caloriesGradient: {
      padding: 22,
    },
    caloriesTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    caloriesLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.65)",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    caloriesValue: {
      fontSize: 48,
      fontWeight: "900",
      color: "#fff",
      letterSpacing: -2,
      lineHeight: 52,
    },
    caloriesUnit: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontWeight: "600",
      marginTop: 2,
    },
    goalBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    goalBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    caloriesDesc: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 12,
    },
    warningCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: "rgba(251,191,36,0.08)",
      borderWidth: 1,
      borderColor: "rgba(251,191,36,0.25)",
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    warningText: {
      flex: 1,
      color: theme.warning || "#FBBF24",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
    },
    suggestionActions: {
      flexDirection: "row",
      gap: 16,
      marginTop: 8,
    },
    suggestionDismissText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    suggestionApplyText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 10,
      marginTop: 4,
    },
    sectionHeader: {
      marginTop: 4,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logWeightBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      marginBottom: 10,
    },
    logWeightBtnText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    weightEmptyCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      borderStyle: "dashed",
      padding: 20,
      alignItems: "center",
      marginBottom: 12,
    },
    logWeightOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    logWeightCard: {
      width: "100%",
      backgroundColor: theme.bgBase,
      borderRadius: 20,
      padding: 20,
      gap: 16,
    },
    logWeightTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    logWeightInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    logWeightInput: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 22,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    logWeightUnit: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textMuted,
    },
    logWeightActions: {
      flexDirection: "row",
      gap: 10,
    },
    logWeightCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
    },
    logWeightCancelText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    logWeightSaveBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.accent,
    },
    logWeightSaveText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#fff",
    },
    dietName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.accent,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 14,
    },
    macrosRow: {
      flexDirection: "row",
      gap: 8,
    },
    macroBadge: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      padding: 10,
      alignItems: "center",
      gap: 4,
    },
    macroValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    macroLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    mealCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      padding: 16,
      marginBottom: 10,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    mealTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    mealDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
    mealTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    mealMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    timePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: theme.surface,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
    },
    timeText: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: "600",
    },
    optionsBadge: {
      backgroundColor: theme.accentDim,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    optionsBadgeText: {
      color: theme.accent,
      fontSize: 10,
      fontWeight: "700",
    },
    optionChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      backgroundColor: theme.surface,
    },
    optionChipActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accentDim,
    },
    optionChipText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    optionChipTextActive: {
      color: theme.accent,
      fontWeight: "700",
    },
    foodsBox: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      gap: 2,
    },
    optionName: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    foodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 2,
    },
    foodBullet: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.accent,
      opacity: 0.6,
    },
    foodItem: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    emptyCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      borderStyle: "dashed",
      padding: 36,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 4,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
    errorState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 40,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    retryBtnText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "800",
    },
    weightChartCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      padding: 16,
      marginBottom: 12,
    },
    weightChartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    weightChartValue: {
      fontSize: 24,
      fontWeight: "900",
      color: theme.textPrimary,
    },
    weightChartSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    weightDeltaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    weightDeltaText: {
      fontSize: 12,
      fontWeight: "800",
    },
    weightChartFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    weightChartFooterText: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: "600",
    },
  });

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const {
    profile,
    activeDiet: diet,
    setActiveDiet: setDiet,
    userStats: stats,
    setUserStats: setStats,
    isHydrated,
  } = useAppStore();

  const [loading, setLoading] = useState(!isHydrated || (!stats && !diet));
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [activitySuggestion, setActivitySuggestion] = useState<Activity | null>(null);
  const [logWeightModalVisible, setLogWeightModalVisible] = useState(false);
  const [logWeightValue, setLogWeightValue] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  const [weight, setWeight] = useState(stats?.weight?.toString() || "");
  const [height, setHeight] = useState(stats?.height?.toString() || "");
  const [age, setAge] = useState(stats?.age?.toString() || "");
  const [gender, setGender] = useState<Gender>(stats?.gender || "M");
  const [activityLevel, setActivityLevel] = useState<Activity>(
    stats?.activity_level || "moderate",
  );
  const [goal, setGoal] = useState<Goal>(stats?.goal || "maintain");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: number;
  }>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      if (!isHydrated) setLoading(true);
      setLoadError(false);
      const userId = profile?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [newStats, newDiet, newWeightHistory, recentWorkouts] = await Promise.all([
        NutritionAPI.getUserStats(userId).catch(() => stats),
        NutritionAPI.getActiveDiet(userId).catch(() => diet),
        NutritionAPI.getWeightHistory(userId).catch(() => []),
        WorkoutsAPI.getWorkoutLogs(userId, 30, 0).catch(() => []),
      ]);
      setWeightHistory(newWeightHistory);
      if (newStats) {
        setActivitySuggestion(suggestActivityLevel(recentWorkouts, newStats.activity_level));
      }

      let finalDiet = newDiet;
      if (newStats && !newDiet) {
        const calc = calculateCalories(
          newStats.weight,
          newStats.height,
          newStats.age,
          newStats.gender,
          newStats.activity_level,
          newStats.goal,
        );
        await withTimeout(
          NutritionAPI.assignBestDietPlan(userId, calc.calories),
        );
        finalDiet = await withTimeout(NutritionAPI.getActiveDiet(userId));
      }

      if (newStats) {
        setStats(newStats);
        setWeight(newStats.weight.toString());
        setHeight(newStats.height.toString());
        setAge(newStats.age.toString());
        setGender(newStats.gender);
        setActivityLevel(newStats.activity_level);
        setGoal(newStats.goal);
      }
      if (finalDiet) setDiet(finalDiet);
    } catch (error) {
      console.error("[NutritionScreen]", error);
      if (!stats && !diet) setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async (overrideActivityLevel?: Activity) => {
    if (!weight || !height || !age) {
      setModalConfig({
        title: "Campos incompletos",
        message: "Por favor completa todos los campos para calcular tu plan.",
        type: "error",
      });
      setModalVisible(true);
      return;
    }
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    if (w < 20 || w > 400 || h < 50 || h > 250 || a < 10 || a > 120) {
      setModalConfig({
        title: "Revisa tus datos",
        message: "Alguno de los valores ingresados parece fuera de rango. Verifica tu peso, altura y edad.",
        type: "error",
      });
      setModalVisible(true);
      return;
    }
    try {
      setSubmitting(true);
      const {
        data: { session },
      } = (await withTimeout(supabase.auth.getSession(), 15000)) as any;
      if (!session?.user) return;

      const effectiveActivityLevel = overrideActivityLevel || activityLevel;
      const calc = calculateCalories(
        parseFloat(weight),
        parseFloat(height),
        parseInt(age),
        gender,
        effectiveActivityLevel,
        goal,
      );
      const newStats: UserStats = {
        user_id: session.user.id,
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age),
        gender,
        activity_level: effectiveActivityLevel,
        goal: calc.finalGoal,
        allergies: stats?.allergies || [],
      };
      const saved = await withTimeout(NutritionAPI.saveUserStats(newStats));
      setStats(saved);
      setActivityLevel(effectiveActivityLevel);
      setActivitySuggestion(null);

      // Only log a new weight entry when it actually changed — saving the
      // form without touching weight (e.g. just updating activity level)
      // shouldn't create a duplicate point on the history chart.
      const lastLoggedWeight = weightHistory[weightHistory.length - 1]?.weight;
      if (lastLoggedWeight !== newStats.weight) {
        try {
          await NutritionAPI.logWeight(session.user.id, newStats.weight);
          const updatedHistory = await NutritionAPI.getWeightHistory(session.user.id);
          setWeightHistory(updatedHistory);
        } catch (e) {
          console.warn("[NutritionScreen] Failed to log weight history:", e);
        }
      }

      await withTimeout(
        NutritionAPI.assignBestDietPlan(session.user.id, calc.calories),
      );
      const activeDiet = await withTimeout(
        NutritionAPI.getActiveDiet(session.user.id),
      );
      setDiet(activeDiet);

      setModalConfig({
        title: calc.isOverridden ? "Sugerencia de salud" : "¡Plan actualizado!",
        message: calc.isOverridden
          ? "Basado en tu IMC, recomendamos priorizar pérdida de grasa. Hemos ajustado tu plan para mejorar tu salud."
          : "Tus datos se guardaron y asignamos el mejor plan para tu meta.",
        type: "success",
      });
      setModalVisible(true);
    } catch (error: any) {
      setModalConfig({
        title: "Error al guardar",
        message:
          error.message || "No pudimos guardar tus datos. Inténtalo de nuevo.",
        type: "error",
      });
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick check-in: updates just the weight, without walking through the full
  // stats form. Keeps user_stats.weight (used everywhere else in the app,
  // e.g. the calories card) in sync with the new entry in weight_logs.
  const handleLogWeightCheckIn = async () => {
    const w = parseFloat(logWeightValue);
    if (!logWeightValue || isNaN(w) || w < 20 || w > 400) {
      setModalConfig({
        title: "Revisa el valor",
        message: "Ingresa un peso válido en kg.",
        type: "error",
      });
      setModalVisible(true);
      return;
    }
    if (!stats) return;
    try {
      setLoggingWeight(true);
      const {
        data: { session },
      } = (await withTimeout(supabase.auth.getSession(), 15000)) as any;
      if (!session?.user) return;

      const updatedStats: UserStats = { ...stats, weight: w };
      const saved = await withTimeout(NutritionAPI.saveUserStats(updatedStats));
      setStats(saved);
      setWeight(w.toString());

      await NutritionAPI.logWeight(session.user.id, w);
      const updatedHistory = await NutritionAPI.getWeightHistory(session.user.id);
      setWeightHistory(updatedHistory);

      setLogWeightModalVisible(false);
      setLogWeightValue("");
    } catch (error: any) {
      setModalConfig({
        title: "Error al guardar",
        message: error.message || "No pudimos registrar tu peso. Inténtalo de nuevo.",
        type: "error",
      });
      setModalVisible(true);
    } finally {
      setLoggingWeight(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <CustomModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalVisible(false)}
        />

        <Modal visible={logWeightModalVisible} transparent animationType="fade">
          <View style={styles.logWeightOverlay}>
            <View style={styles.logWeightCard}>
              <Text style={styles.logWeightTitle}>Actualizar peso</Text>
              <View style={styles.logWeightInputRow}>
                <TextInput
                  style={styles.logWeightInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  value={logWeightValue}
                  onChangeText={setLogWeightValue}
                  autoFocus
                />
                <Text style={styles.logWeightUnit}>kg</Text>
              </View>
              <View style={styles.logWeightActions}>
                <TouchableOpacity
                  style={styles.logWeightCancelBtn}
                  onPress={() => setLogWeightModalVisible(false)}
                  disabled={loggingWeight}
                >
                  <Text style={styles.logWeightCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logWeightSaveBtn}
                  onPress={handleLogWeightCheckIn}
                  disabled={loggingWeight}
                >
                  {loggingWeight ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.logWeightSaveText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {loadError && !stats ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No pudimos cargar tu información</Text>
            <Text style={styles.emptyText}>Revisa tu conexión e intenta de nuevo.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Ionicons name="refresh" size={14} color={theme.accent} />
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : !stats ? (
          <Onboarding
            weight={weight}
            setWeight={setWeight}
            height={height}
            setHeight={setHeight}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            activityLevel={activityLevel}
            setActivityLevel={setActivityLevel}
            goal={goal}
            setGoal={setGoal}
            onSave={handleSaveStats}
            submitting={submitting}
          />
        ) : (
          <Dashboard
            stats={stats}
            diet={diet}
            weightHistory={weightHistory}
            activitySuggestion={activitySuggestion}
            onApplyActivitySuggestion={() =>
              activitySuggestion && handleSaveStats(activitySuggestion)
            }
            onDismissActivitySuggestion={() => setActivitySuggestion(null)}
            onLogWeight={() => {
              setLogWeightValue(stats?.weight?.toString() || "");
              setLogWeightModalVisible(true);
            }}
            onEdit={() => setStats(null)}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function Onboarding({
  weight,
  setWeight,
  height,
  setHeight,
  age,
  setAge,
  gender,
  setGender,
  activityLevel,
  setActivityLevel,
  goal,
  setGoal,
  onSave,
  submitting,
}: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageIconWrap}>
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pageIcon}
          >
            <Ionicons name="nutrition-outline" size={24} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.pageTitle}>Perfil Nutricional</Text>
        <Text style={styles.pageSubtitle}>
          Cuéntanos sobre ti para calcular tu plan ideal
        </Text>
      </View>

      {/* Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Medidas corporales</Text>
        <View style={styles.metricsRow}>
          <MetricInput
            label="Peso"
            unit="kg"
            value={weight}
            onChange={setWeight}
            placeholder="75"
          />
          <MetricInput
            label="Altura"
            unit="cm"
            value={height}
            onChange={setHeight}
            placeholder="175"
          />
          <MetricInput
            label="Edad"
            unit="años"
            value={age}
            onChange={setAge}
            placeholder="25"
          />
        </View>
      </View>

      {/* Gender */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Género</Text>
        <View style={styles.chipRow}>
          {(["M", "F"] as Gender[]).map((g) => (
            <SelectChip
              key={g}
              label={g === "M" ? "Hombre" : "Mujer"}
              active={gender === g}
              onPress={() => setGender(g)}
              flex
            />
          ))}
        </View>
      </View>

      {/* Activity */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Nivel de actividad</Text>
        <View style={styles.chipRow}>
          {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((l) => (
            <SelectChip
              key={l}
              label={ACTIVITY_LABELS[l]}
              active={activityLevel === l}
              onPress={() => setActivityLevel(l)}
              flex
            />
          ))}
        </View>
      </View>

      {/* Goal */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Objetivo</Text>
        <View style={styles.chipRow}>
          {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
            <SelectChip
              key={g}
              label={GOAL_LABELS[g]}
              active={goal === g}
              onPress={() => setGoal(g)}
              flex
            />
          ))}
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onSave}
        disabled={submitting}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtnGradient}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Calcular mi plan</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({
  stats,
  diet,
  weightHistory,
  activitySuggestion,
  onApplyActivitySuggestion,
  onDismissActivitySuggestion,
  onLogWeight,
  onEdit,
  selectedOptions,
  setSelectedOptions,
}: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const calc = calculateCalories(
    stats.weight,
    stats.height,
    stats.age,
    stats.gender,
    stats.activity_level,
    stats.goal,
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.pageTitle}>Tu plan</Text>
          <Text style={styles.pageSubtitle}>Nutricional personalizado</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={theme.accent} />
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Calories card */}
      <View style={styles.caloriesCard}>
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.caloriesGradient}
        >
          <View style={styles.caloriesTop}>
            <View>
              <Text style={styles.caloriesLabel}>Calorías diarias</Text>
              <Text style={styles.caloriesValue}>{calc.calories}</Text>
              <Text style={styles.caloriesUnit}>kcal / día</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                {GOAL_LABELS[stats.goal as Goal] || stats.goal}
              </Text>
            </View>
          </View>
          <Text style={styles.caloriesDesc}>
            {stats.weight} kg · {stats.height} cm · {stats.age} años ·{" "}
            {stats.gender === "M" ? "Hombre" : "Mujer"}
          </Text>
        </LinearGradient>
      </View>

      {/* Override warning */}
      {calc.isOverridden && !warningDismissed && (
        <View style={styles.warningCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={theme.warning}
          />
          <Text style={styles.warningText}>
            Hemos ajustado tu objetivo a pérdida de grasa para priorizar tu
            salud según tu IMC.
          </Text>
          <TouchableOpacity onPress={() => setWarningDismissed(true)} hitSlop={8}>
            <Ionicons name="close" size={16} color={theme.warning} />
          </TouchableOpacity>
        </View>
      )}

      {/* Activity level mismatch suggestion */}
      {activitySuggestion && (
        <View style={styles.warningCard}>
          <Ionicons name="pulse-outline" size={20} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningText}>
              Tu ritmo de entrenamiento reciente sugiere un nivel de actividad "
              {ACTIVITY_LABELS[activitySuggestion as Activity]}", distinto al que tienes
              configurado. Actualízalo para un cálculo de calorías más preciso.
            </Text>
            <View style={styles.suggestionActions}>
              <TouchableOpacity onPress={onDismissActivitySuggestion}>
                <Text style={styles.suggestionDismissText}>Ignorar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onApplyActivitySuggestion}>
                <Text style={styles.suggestionApplyText}>
                  Usar "{ACTIVITY_LABELS[activitySuggestion as Activity]}"
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Weight history */}
      <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
        <Text style={styles.sectionTitle}>Evolución de peso</Text>
        <TouchableOpacity style={styles.logWeightBtn} onPress={onLogWeight}>
          <Ionicons name="add-circle-outline" size={16} color={theme.accent} />
          <Text style={styles.logWeightBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
      {weightHistory.length > 1 ? (
        <WeightChart history={weightHistory} theme={theme} styles={styles} />
      ) : (
        <View style={styles.weightEmptyCard}>
          <Text style={styles.emptyText}>
            Registra tu peso periódicamente para ver tu evolución aquí.
          </Text>
        </View>
      )}

      {/* Diet section */}
      <Text style={styles.sectionTitle}>Dieta asignada</Text>

      {diet ? (
        <>
          {/* Macros */}
          <View style={styles.card}>
            <Text style={styles.dietName}>{diet.name}</Text>
            <View style={styles.macrosRow}>
              {[
                { key: "Prot", value: diet.macros?.protein },
                { key: "Carb", value: diet.macros?.carbs },
                { key: "Fat", value: diet.macros?.fats },
              ].map((m) => (
                <View key={m.key} style={styles.macroBadge}>
                  <Ionicons
                    name={MACRO_ICONS[m.key]}
                    size={16}
                    color={theme.accent}
                  />
                  <Text style={styles.macroValue}>{m.value || "–"}</Text>
                  <Text style={styles.macroLabel}>{m.key}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Meals */}
          {!diet.meals || diet.meals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Esta dieta no tiene comidas definidas aún.
              </Text>
            </View>
          ) : (
            diet.meals.map((meal: any, idx: number) => {
              const selIdx = selectedOptions[idx] || 0;
              const current = meal.options?.[selIdx];
              return (
                <View key={idx} style={styles.mealCard}>
                  {/* Meal header */}
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleRow}>
                      <View style={styles.mealDot} />
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                    </View>
                    <View style={styles.mealMeta}>
                      {meal.time && (
                        <View style={styles.timePill}>
                          <Ionicons
                            name="time-outline"
                            size={11}
                            color={theme.textMuted}
                          />
                          <Text style={styles.timeText}>{meal.time}</Text>
                        </View>
                      )}
                      {meal.options?.length > 1 && (
                        <View style={styles.optionsBadge}>
                          <Text style={styles.optionsBadgeText}>
                            {meal.options.length} opciones
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Option selector */}
                  {meal.options?.length > 1 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 12 }}
                    >
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {meal.options.map((opt: any, optIdx: number) => (
                          <TouchableOpacity
                            key={optIdx}
                            style={[
                              styles.optionChip,
                              selIdx === optIdx && styles.optionChipActive,
                            ]}
                            onPress={() =>
                              setSelectedOptions((prev: any) => ({
                                ...prev,
                                [idx]: optIdx,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                selIdx === optIdx &&
                                  styles.optionChipTextActive,
                              ]}
                            >
                              {opt.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}

                  {/* Foods */}
                  {current ? (
                    <View style={styles.foodsBox}>
                      <Text style={styles.optionName}>{current.name}</Text>
                      {current.foods?.map((food: string, fi: number) => (
                        <View key={fi} style={styles.foodRow}>
                          <View style={styles.foodBullet} />
                          <Text style={styles.foodItem}>{food}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>
                      No hay ingredientes en esta opción.
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons
            name="nutrition-outline"
            size={40}
            color={theme.textMuted}
          />
          <Text style={styles.emptyTitle}>Sin plan asignado</Text>
          <Text style={styles.emptyText}>
            Tu entrenador aún no ha asignado un plan específico.
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Weight history chart ──────────────────────────────────────────────────────
const WEIGHT_CHART_WIDTH = Dimensions.get("window").width - 20 * 2 - 32; // screen - scroll padding - card padding
const WEIGHT_CHART_HEIGHT = 140;

function WeightChart({
  history,
  theme,
  styles,
}: {
  history: WeightLog[];
  theme: AppTheme;
  styles: any;
}) {
  const weights = history.map((h) => h.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const points = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * WEIGHT_CHART_WIDTH;
      const y = WEIGHT_CHART_HEIGHT - 20 - ((h.weight - minW) / range) * (WEIGHT_CHART_HEIGHT - 40);
      return `${x},${y}`;
    })
    .join(" ");

  const first = history[0];
  const last = history[history.length - 1];
  const delta = Math.round((last.weight - first.weight) * 10) / 10;

  return (
    <View style={styles.weightChartCard}>
      <View style={styles.weightChartHeader}>
        <View>
          <Text style={styles.weightChartValue}>{last.weight} kg</Text>
          <Text style={styles.weightChartSub}>
            {new Date(last.logged_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </Text>
        </View>
        {delta !== 0 && (
          <View
            style={[
              styles.weightDeltaBadge,
              { backgroundColor: delta < 0 ? theme.success + "20" : theme.warning + "20" },
            ]}
          >
            <Ionicons
              name={delta < 0 ? "arrow-down" : "arrow-up"}
              size={12}
              color={delta < 0 ? theme.success : theme.warning}
            />
            <Text
              style={[
                styles.weightDeltaText,
                { color: delta < 0 ? theme.success : theme.warning },
              ]}
            >
              {Math.abs(delta)} kg
            </Text>
          </View>
        )}
      </View>

      <Svg width={WEIGHT_CHART_WIDTH} height={WEIGHT_CHART_HEIGHT}>
        <Polyline points={points} fill="none" stroke={theme.accent} strokeWidth="2.5" />
        {history.map((h, i) => {
          const x = (i / (history.length - 1)) * WEIGHT_CHART_WIDTH;
          const y = WEIGHT_CHART_HEIGHT - 20 - ((h.weight - minW) / range) * (WEIGHT_CHART_HEIGHT - 40);
          return <Circle key={i} cx={x} cy={y} r="3" fill={theme.accentLight} />;
        })}
      </Svg>

      <View style={styles.weightChartFooter}>
        <Text style={styles.weightChartFooterText}>
          {new Date(first.logged_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
        </Text>
        <Text style={styles.weightChartFooterText}>
          {new Date(last.logged_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
        </Text>
      </View>
    </View>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function MetricInput({ label, unit, value, onChange, placeholder }: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.metricInput}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBox}>
        <TextInput
          style={styles.metricField}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
        />
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function SelectChip({
  label,
  active,
  onPress,
  flex,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  flex?: boolean;
}) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={[
        styles.selectChip,
        active && styles.selectChipActive,
        flex && { flex: 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {active && (
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text
        style={[styles.selectChipText, active && styles.selectChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

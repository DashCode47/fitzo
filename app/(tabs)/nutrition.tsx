import { NutritionAPI, UserStats } from "@/api/nutrition";
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 10,
      marginTop: 4,
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
      let userId = profile?.id;
      try {
        const {
          data: { session },
        } = (await withTimeout(supabase.auth.getSession(), 15000)) as any;
        if (session?.user) userId = session.user.id;
      } catch (err) {
        console.warn("[NutritionScreen] Session fetch error", err);
      }
      if (!userId) {
        setLoading(false);
        return;
      }

      const [newStats, newDiet] = await Promise.all([
        NutritionAPI.getUserStats(userId).catch(() => stats),
        NutritionAPI.getActiveDiet(userId).catch(() => diet),
      ]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async () => {
    const {
      data: { session },
    } = (await withTimeout(supabase.auth.getSession(), 15000)) as any;
    if (!session?.user) return;
    if (!weight || !height || !age) {
      setModalConfig({
        title: "Campos incompletos",
        message: "Por favor completa todos los campos para calcular tu plan.",
        type: "error",
      });
      setModalVisible(true);
      return;
    }
    try {
      setSubmitting(true);
      const calc = calculateCalories(
        parseFloat(weight),
        parseFloat(height),
        parseInt(age),
        gender,
        activityLevel,
        goal,
      );
      const newStats: UserStats = {
        user_id: session.user.id,
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age),
        gender,
        activity_level: activityLevel,
        goal: calc.finalGoal,
        allergies: [],
      };
      const saved = await withTimeout(NutritionAPI.saveUserStats(newStats));
      setStats(saved);
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
        {!stats ? (
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
  onEdit,
  selectedOptions,
  setSelectedOptions,
}: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
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
      {calc.isOverridden && (
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

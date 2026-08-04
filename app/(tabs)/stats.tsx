import { RanksAPI } from "@/api/ranks";
import { RoutinesAPI } from "@/api/routines";
import { WorkoutsAPI } from "@/api/workouts";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

const RECENT_LIMIT = 30; // logs pulled to derive weekly/monthly aggregates
const PR_PREVIEW_COUNT = 5;

const MUSCLE_MAP: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Piernas",
  shoulders: "Hombros",
  arms: "Brazos",
  abs: "Abdomen",
  cardio: "Cardio",
  glutes: "Glúteos",
  "full body": "Cuerpo Completo",
  forearms: "Antebrazos",
};

const translateMuscle = (muscle: string) => MUSCLE_MAP[muscle?.toLowerCase()] || muscle;

interface ExercisePR {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  maxWeight: number;
}

interface Aggregates {
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMin: number;
  thisWeekCount: number;
  lastWeekVolume: number;
  prevWeekVolume: number;
  lastWorkoutAt: string | null;
}

function computeAggregates(logs: any[]): Aggregates {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dow = now.getDay();
  startOfWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfWeek.getDate() - 7);

  let totalVolume = 0;
  let totalDuration = 0;
  let thisWeekCount = 0;
  let lastWeekVolume = 0;
  let prevWeekVolume = 0;

  for (const log of logs) {
    const started = new Date(log.started_at);
    totalVolume += log.total_volume || 0;
    totalDuration += log.duration_seconds || 0;
    if (started >= startOfWeek) {
      thisWeekCount++;
      lastWeekVolume += log.total_volume || 0;
    } else if (started >= startOfPrevWeek) {
      prevWeekVolume += log.total_volume || 0;
    }
  }

  return {
    totalWorkouts: logs.length,
    totalVolume,
    avgDurationMin: logs.length ? Math.round(totalDuration / logs.length / 60) : 0,
    thisWeekCount,
    lastWeekVolume,
    prevWeekVolume,
    lastWorkoutAt: logs[0]?.started_at ?? null,
  };
}

const WEEKS_SHOWN = 6;

interface WeekBucket {
  label: string;
  count: number;
}

function computeWeeklyCounts(logs: any[]): WeekBucket[] {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  const dow = now.getDay();
  startOfThisWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfThisWeek.setHours(0, 0, 0, 0);

  const buckets: WeekBucket[] = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(startOfThisWeek.getDate() - (WEEKS_SHOWN - 1 - i) * 7);
    return { label: weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), count: 0 };
  });

  const oldestBucketStart = new Date(startOfThisWeek);
  oldestBucketStart.setDate(startOfThisWeek.getDate() - (WEEKS_SHOWN - 1) * 7);

  for (const log of logs) {
    const started = new Date(log.started_at);
    if (started < oldestBucketStart) continue;
    const weeksAgo = Math.floor((startOfThisWeek.getTime() - started.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const idx = WEEKS_SHOWN - 1 - weeksAgo;
    if (idx >= 0 && idx < WEEKS_SHOWN) buckets[idx].count++;
  }

  return buckets;
}

export default function StatsScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [aggregates, setAggregates] = useState<Aggregates>({
    totalWorkouts: 0,
    totalVolume: 0,
    avgDurationMin: 0,
    thisWeekCount: 0,
    lastWeekVolume: 0,
    prevWeekVolume: 0,
    lastWorkoutAt: null,
  });
  const [weeklyCounts, setWeeklyCounts] = useState<WeekBucket[]>([]);
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const [search, setSearch] = useState("");
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const muscleGroups = useMemo(
    () => Array.from(new Set(exercisePRs.map((pr) => pr.muscleGroup).filter(Boolean))),
    [exercisePRs],
  );

  const filteredPRs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercisePRs.filter((pr) => {
      const matchesGroup = !selectedGroup || pr.muscleGroup === selectedGroup;
      const matchesSearch = !q || pr.name.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [exercisePRs, search, selectedGroup]);

  const visiblePRs = showAllPRs || search ? filteredPRs : filteredPRs.slice(0, PR_PREVIEW_COUNT);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoadError(false);
      const results = await Promise.allSettled([
        WorkoutsAPI.getWorkoutLogs(profile.id, RECENT_LIMIT, 0),
        RanksAPI.getUserMaxWeights(profile.id),
        RoutinesAPI.getExercises(),
      ]);
      const [logsResult, maxWeightsResult, catalogResult] = results;
      const logs = logsResult.status === "fulfilled" ? logsResult.value : [];
      const maxWeights = maxWeightsResult.status === "fulfilled" ? maxWeightsResult.value : [];
      const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : [];
      setLoadError(results.some((r) => r.status === "rejected"));

      setAggregates(computeAggregates(logs));
      setWeeklyCounts(computeWeeklyCounts(logs));

      const prs = maxWeights
        .map((row: any) => {
          const exerciseName = row.name || row.exercise_name;
          const exercise = catalog.find((e) => e.name === exerciseName);
          if (!exercise) return null;
          return {
            exerciseId: exercise.id,
            name: exerciseName,
            muscleGroup: row.muscle_group,
            maxWeight: row.max_weight,
          } as ExercisePR;
        })
        .filter((pr): pr is ExercisePR => pr !== null)
        .sort((a, b) => b.maxWeight - a.maxWeight);
      setExercisePRs(prs);
    } catch (e) {
      console.error("[StatsScreen] Failed to load stats:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Mis Estadísticas</Text>
              <Text style={styles.headerSubtitle}>Tu progreso de entrenamiento</Text>
            </View>
          </View>

          {/* ── Load Error Banner ── */}
          {loadError && (
            <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
              <Ionicons name="cloud-offline-outline" size={18} color={theme.error} />
              <Text style={styles.errorBannerText}>
                No pudimos cargar todas tus estadísticas. Toca para reintentar.
              </Text>
              <Ionicons name="refresh" size={16} color={theme.error} />
            </TouchableOpacity>
          )}

          {/* ── Stat grid ── */}
          <View style={styles.statGrid}>
            <StatTile
              icon="barbell-outline"
              value={aggregates.totalWorkouts.toString()}
              label={`ÚLTIMOS ${RECENT_LIMIT} ENTRENOS`}
              theme={theme}
              styles={styles}
            />
            <StatTile
              icon="trending-up-outline"
              value={`${aggregates.lastWeekVolume.toLocaleString()}kg`}
              label="VOLUMEN ESTA SEMANA"
              trend={volumeTrend(aggregates.lastWeekVolume, aggregates.prevWeekVolume)}
              theme={theme}
              styles={styles}
            />
            <StatTile
              icon="time-outline"
              value={`${aggregates.avgDurationMin}m`}
              label="DURACIÓN PROMEDIO"
              theme={theme}
              styles={styles}
            />
            <StatTile
              icon="calendar-outline"
              value={aggregates.thisWeekCount.toString()}
              label="ESTA SEMANA"
              theme={theme}
              styles={styles}
            />
          </View>

          {/* ── Weekly frequency chart ── */}
          {weeklyCounts.some((w) => w.count > 0) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Entrenamientos por Semana</Text>
              </View>
              <WeeklyBarChart data={weeklyCounts} theme={theme} styles={styles} />
            </>
          )}

          {/* ── PRs by exercise ── */}
          {exercisePRs.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Peso Máximo por Ejercicio</Text>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar ejercicio..."
                  placeholderTextColor={theme.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {muscleGroups.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipsScroll}
                  contentContainerStyle={styles.chipsRow}
                >
                  <TouchableOpacity
                    style={[styles.chip, !selectedGroup && styles.chipActive]}
                    onPress={() => setSelectedGroup(null)}
                  >
                    <Text style={[styles.chipText, !selectedGroup && styles.chipTextActive]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {muscleGroups.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, selectedGroup === g && styles.chipActive]}
                      onPress={() => setSelectedGroup(selectedGroup === g ? null : g)}
                    >
                      <Text style={[styles.chipText, selectedGroup === g && styles.chipTextActive]}>
                        {translateMuscle(g)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.prList}>
                {visiblePRs.map((pr) => (
                  <TouchableOpacity
                    key={pr.exerciseId}
                    style={styles.prRow}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: "/exercise-progress", params: { id: pr.exerciseId } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                      <Text style={styles.prMuscle}>{translateMuscle(pr.muscleGroup)}</Text>
                    </View>
                    <Text style={styles.prValue}>{pr.maxWeight}kg</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                ))}
                {filteredPRs.length === 0 && (
                  <Text style={styles.noResultsText}>
                    {search ? `Sin resultados para "${search}"` : "Sin ejercicios en este grupo"}
                  </Text>
                )}
              </View>

              {!search && !selectedGroup && filteredPRs.length > PR_PREVIEW_COUNT && (
                <TouchableOpacity onPress={() => setShowAllPRs((v) => !v)} style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>
                    {showAllPRs ? "Ver menos" : `Ver los ${filteredPRs.length} ejercicios`}
                  </Text>
                  <Ionicons
                    name={showAllPRs ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={theme.accent}
                  />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── Quick actions ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detalle</Text>
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.85}
            onPress={() => router.push("/history")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="list-outline" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Historial de sesiones</Text>
              <Text style={styles.actionSubtitle}>
                {aggregates.lastWorkoutAt
                  ? `Última: ${new Date(aggregates.lastWorkoutAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
                  : "Aún no hay sesiones registradas"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {aggregates.totalWorkouts === 0 && (
            <View style={styles.empty}>
              <Ionicons name="stats-chart-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyText}>
                Completa tu primer entrenamiento para ver tus estadísticas.
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  theme,
  styles,
  trend,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
  theme: AppTheme;
  styles: any;
  trend?: { direction: "up" | "down"; pct: number } | null;
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIconBox}>
        <Ionicons name={icon} size={16} color={theme.accent} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={styles.statValue}>{value}</Text>
        {trend && (
          <View style={styles.trendBadge}>
            <Ionicons
              name={trend.direction === "up" ? "arrow-up" : "arrow-down"}
              size={10}
              color={trend.direction === "up" ? theme.success : theme.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend.direction === "up" ? theme.success : theme.error },
              ]}
            >
              {trend.pct}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function volumeTrend(current: number, previous: number): { direction: "up" | "down"; pct: number } | null {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return { direction: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

const CHART_HEIGHT = 90;
const BAR_WIDTH = 24;
const BAR_GAP = 14;

function WeeklyBarChart({ data, theme, styles }: { data: WeekBucket[]; theme: AppTheme; styles: any }) {
  const maxCount = Math.max(1, ...data.map((w) => w.count));
  const chartWidth = data.length * (BAR_WIDTH + BAR_GAP);

  return (
    <View style={styles.chartCard}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 34} style={{ alignSelf: "center" }}>
        {data.map((week, i) => {
          const barHeight = Math.max(4, (week.count / maxCount) * CHART_HEIGHT);
          const x = i * (BAR_WIDTH + BAR_GAP);
          const isCurrentWeek = i === data.length - 1;
          return (
            <React.Fragment key={i}>
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - barHeight - 6}
                fontSize={11}
                fontWeight="800"
                fill={theme.textPrimary}
                textAnchor="middle"
              >
                {week.count > 0 ? week.count : ""}
              </SvgText>
              <Rect
                x={x}
                y={CHART_HEIGHT - barHeight}
                width={BAR_WIDTH}
                height={barHeight}
                rx={6}
                fill={isCurrentWeek ? theme.accent : theme.accentDim}
              />
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 18}
                fontSize={9}
                fontWeight="700"
                fill={theme.textMuted}
                textAnchor="middle"
              >
                {week.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgDeep },
    loadingRoot: {
      flex: 1,
      backgroundColor: theme.bgDeep,
      justifyContent: "center",
      alignItems: "center",
    },
    topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },
    scroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

    // ── Load error banner ──
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.error + "15",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.error + "40",
      gap: 10,
    },
    errorBannerText: {
      flex: 1,
      color: theme.error,
      fontSize: 12,
      fontWeight: "600",
    },

    // ── Stat grid ──
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    chartCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    statTile: {
      width: "47%",
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 14,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    statIconBox: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
    },
    statValue: { fontSize: 18, fontWeight: "900", color: theme.textPrimary },
    statLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: theme.textMuted,
      letterSpacing: 0.5,
    },
    trendBadge: { flexDirection: "row", alignItems: "center", gap: 1 },
    trendText: { fontSize: 11, fontWeight: "800" },

    // ── PR by exercise ──
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      marginBottom: 4,
    },
    chipsScroll: {
      flexShrink: 0,
      flexGrow: 0,
      height: 36,
      marginBottom: 4,
    },
    chipsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    chipActive: {
      backgroundColor: theme.accentDim,
      borderColor: theme.accentBorder,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    chipTextActive: {
      color: theme.accent,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.textPrimary,
      padding: 0,
    },
    noResultsText: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 13,
      paddingVertical: 20,
    },
    prList: { gap: 10 },
    showMoreBtn: {
      flexDirection: "row",
      alignSelf: "center",
      alignItems: "center",
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    showMoreText: { fontSize: 13, fontWeight: "700", color: theme.accent },
    prRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    prName: { fontSize: 13, fontWeight: "700", color: theme.textPrimary },
    prMuscle: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 1,
      textTransform: "capitalize",
    },
    prValue: { fontSize: 14, fontWeight: "800", color: theme.accent },

    // ── Section / action rows ──
    sectionHeader: { marginTop: 4 },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
    },
    actionTitle: { fontSize: 14, fontWeight: "700", color: theme.textPrimary },
    actionSubtitle: { fontSize: 12, color: theme.textMuted, marginTop: 1 },

    // ── Empty ──
    empty: { alignItems: "center", paddingTop: 40, gap: 12 },
    emptyText: { color: theme.textMuted, fontSize: 14, textAlign: "center" },
  });

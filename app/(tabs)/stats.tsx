import { RanksAPI } from "@/api/ranks";
import { RoutinesAPI } from "@/api/routines";
import { WorkoutsAPI } from "@/api/workouts";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Bone } from "@/components/ui/Bone";
import { WeekDots } from "@/components/ui/WeekDots";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Modal,
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
  equipment?: string;
  description?: string;
  imageUrl?: string;
}

export interface Aggregates {
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMin: number;
  thisWeekCount: number;
  lastWeekVolume: number;
  prevWeekVolume: number;
  lastWorkoutAt: string | null;
}

export function computeAggregates(logs: any[]): Aggregates {
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

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export interface DayBucket {
  label: string;
  count: number;
  minutes: number;
  volume: number;
}

type ChartMetric = "minutes" | "volume";

export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const dow = date.getDay();
  start.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

// weekOffset: 0 = current week, -1 = previous week, etc.
export function computeDailyCounts(logs: any[], weekOffset: number): DayBucket[] {
  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const buckets: DayBucket[] = DAY_LABELS.map((label) => ({ label, count: 0, minutes: 0, volume: 0 }));

  const msPerDay = 24 * 60 * 60 * 1000;
  for (const log of logs) {
    const started = new Date(log.started_at);
    const startedDay = new Date(started.getFullYear(), started.getMonth(), started.getDate());
    const dayIndex = Math.round((startedDay.getTime() - weekStart.getTime()) / msPerDay);
    if (dayIndex >= 0 && dayIndex < 7) {
      buckets[dayIndex].count++;
      buckets[dayIndex].minutes += Math.round((log.duration_seconds || 0) / 60);
      buckets[dayIndex].volume += log.total_volume || 0;
    }
  }

  return buckets;
}

export function weekRangeLabel(weekOffset: number): string {
  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDay = weekStart.toLocaleDateString("es-ES", { day: "numeric" });
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const endLabel = weekEnd.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  return sameMonth ? `${startDay} – ${endLabel}` : `${weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "long" })} – ${endLabel}`;
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
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("minutes");
  const [exercisePRs, setExercisePRs] = useState<ExercisePR[]>([]);
  const [search, setSearch] = useState("");
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<ExercisePR | null>(null);

  const dailyCounts = useMemo(() => computeDailyCounts(workoutLogs, weekOffset), [workoutLogs, weekOffset]);
  const thisWeekDays = useMemo(() => computeDailyCounts(workoutLogs, 0).map((d) => d.count > 0), [workoutLogs]);
  const canGoNextWeek = weekOffset < 0;
  // workoutLogs is capped at RECENT_LIMIT — if we hit that cap, there may be
  // older sessions we never fetched, so we can't know the true oldest week.
  // Only use it to bound "back" navigation when we know we have the full history.
  const hitRecentLimit = workoutLogs.length === RECENT_LIMIT;
  const oldestLogWeekOffset = useMemo(() => {
    if (workoutLogs.length === 0) return 0;
    const oldest = new Date(workoutLogs[workoutLogs.length - 1].started_at);
    const weeks = Math.floor(
      (startOfWeek(oldest).getTime() - startOfWeek(new Date()).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    return weeks;
  }, [workoutLogs]);
  const canGoPrevWeek = hitRecentLimit || weekOffset > oldestLogWeekOffset;

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

  const visiblePRs =
    showAllPRs || search || selectedGroup ? filteredPRs : filteredPRs.slice(0, PR_PREVIEW_COUNT);

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
      setWorkoutLogs(logs);
      setWeekOffset(0);

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
            equipment: exercise.equipment,
            description: exercise.description,
            imageUrl: exercise.image_url,
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
      <View style={styles.root}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.scroll}>
            <View style={[styles.header, { justifyContent: "flex-start" }]}>
              <View style={{ gap: 6 }}>
                <Bone w={190} h={24} radius={6} />
                <Bone w={170} h={12} radius={4} />
              </View>
            </View>
            <Bone w="100%" h={150} radius={22} />
            <View style={styles.miniRow}>
              {[0, 1, 2].map((i) => (
                <Bone key={i} w="31%" h={78} radius={16} />
              ))}
            </View>
            <Bone w={200} h={14} radius={4} style={{ marginTop: 4 }} />
            <Bone w="100%" h={200} radius={18} />
            <Bone w={220} h={14} radius={4} style={{ marginTop: 4 }} />
            <View style={styles.prList}>
              {[0, 1, 2].map((i) => (
                <Bone key={i} w="100%" h={58} radius={14} />
              ))}
            </View>
          </View>
        </SafeAreaView>
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

          {/* ── This week ── */}
          <WeekSummary
            days={thisWeekDays}
            volume={aggregates.lastWeekVolume}
            trend={volumeTrend(aggregates.lastWeekVolume, aggregates.prevWeekVolume)}
            theme={theme}
            styles={styles}
          />

          {/* ── All-time mini stats ── */}
          <View style={styles.miniRow}>
            <MiniStat
              icon="barbell-outline"
              value={aggregates.totalWorkouts.toString()}
              label={hitRecentLimit ? `Últimos ${RECENT_LIMIT}` : "Entrenos"}
              theme={theme}
              styles={styles}
            />
            <MiniStat
              icon="timer-outline"
              value={`${aggregates.avgDurationMin} min`}
              label="Promedio"
              theme={theme}
              styles={styles}
            />
            <MiniStat
              icon="calendar-clear-outline"
              value={daysAgoLabel(aggregates.lastWorkoutAt)}
              label="Último entreno"
              theme={theme}
              styles={styles}
            />
          </View>

          {/* ── Weekly frequency chart ── */}
          {workoutLogs.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionHeaderWrap]}>
                <Text style={styles.sectionTitle}>Entrenamientos por Semana</Text>
                <View style={styles.metricSegmented}>
                  <TouchableOpacity
                    style={[styles.metricSegment, chartMetric === "minutes" && styles.metricSegmentActive]}
                    onPress={() => setChartMetric("minutes")}
                  >
                    <Text
                      style={[
                        styles.metricSegmentText,
                        chartMetric === "minutes" && styles.metricSegmentTextActive,
                      ]}
                    >
                      Tiempo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.metricSegment, chartMetric === "volume" && styles.metricSegmentActive]}
                    onPress={() => setChartMetric("volume")}
                  >
                    <Text
                      style={[
                        styles.metricSegmentText,
                        chartMetric === "volume" && styles.metricSegmentTextActive,
                      ]}
                    >
                      Volumen
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.weekNav}>
                <TouchableOpacity
                  onPress={() => canGoPrevWeek && setWeekOffset((w) => w - 1)}
                  disabled={!canGoPrevWeek}
                  hitSlop={8}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={canGoPrevWeek ? theme.textPrimary : theme.textMuted}
                  />
                </TouchableOpacity>
                <Text style={styles.weekNavLabel}>{weekRangeLabel(weekOffset)}</Text>
                <TouchableOpacity
                  onPress={() => canGoNextWeek && setWeekOffset((w) => w + 1)}
                  disabled={!canGoNextWeek}
                  hitSlop={8}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={canGoNextWeek ? theme.textPrimary : theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <WeeklyBarChart
                data={dailyCounts}
                metric={chartMetric}
                todayIndex={weekOffset === 0 ? (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) : -1}
                theme={theme}
                styles={styles}
              />
            </>
          )}

          {/* ── PRs by exercise ── */}
          {exercisePRs.length === 0 && workoutLogs.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Peso Máximo por Ejercicio</Text>
              </View>
              <View style={styles.emptyCard}>
                <Ionicons name="trending-up-outline" size={28} color={theme.textMuted} />
                <Text style={styles.emptyCardText}>
                  Registra el peso en tus series para ver aquí tus récords por ejercicio.
                </Text>
              </View>
            </>
          )}

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
                    <TouchableOpacity
                      onPress={() => setPreviewExercise(pr)}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 4 }}
                      style={styles.prPreviewBtn}
                    >
                      <Ionicons name="eye-outline" size={18} color={theme.accent} />
                    </TouchableOpacity>
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

      <Modal visible={!!previewExercise} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles</Text>
              <TouchableOpacity onPress={() => setPreviewExercise(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {previewExercise && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalImageContainer}>
                  {previewExercise.imageUrl ? (
                    <Image
                      source={{ uri: previewExercise.imageUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalIconPlaceholder}>
                      <Ionicons name="barbell" size={60} color={theme.accentDim} />
                    </View>
                  )}
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.exerciseTitle}>{previewExercise.name}</Text>
                  <View style={styles.modalBadges}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>
                        {translateMuscle(previewExercise.muscleGroup)}
                      </Text>
                    </View>
                    {previewExercise.equipment && (
                      <View style={styles.modalBadge}>
                        <Text style={styles.modalBadgeText}>{previewExercise.equipment}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                  <Text style={styles.modalDesc}>
                    {previewExercise.description ||
                      "No hay una descripción detallada para este ejercicio aún. Consulta a tu entrenador para la técnica correcta."}
                  </Text>

                  <TouchableOpacity
                    style={styles.viewProgressBtn}
                    onPress={() => {
                      const exerciseId = previewExercise.exerciseId;
                      setPreviewExercise(null);
                      router.push({ pathname: "/exercise-progress", params: { id: exerciseId } });
                    }}
                  >
                    <Ionicons name="stats-chart" size={16} color={theme.accent} />
                    <Text style={styles.viewProgressText}>Ver progresión histórica</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const WEEKLY_GOAL = 4; // same rule as the streak: 4 training days per week

// "Hoy", "Ayer", "Hace 3 días", "—"
export function daysAgoLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `Hace ${diff} días`;
}

function WeekSummary({
  days,
  volume,
  trend,
  theme,
  styles,
}: {
  days: boolean[]; // Mon..Sun, trained or not
  volume: number;
  trend: { direction: "up" | "down"; pct: number } | null;
  theme: AppTheme;
  styles: any;
}) {
  const trained = days.filter(Boolean).length;
  const goalMet = trained >= WEEKLY_GOAL;

  return (
    <View style={styles.weekCard}>
      <LinearGradient
        colors={[theme.accentDim, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.weekHeader}>
        <Text style={styles.weekEyebrow}>ESTA SEMANA</Text>
        <View style={[styles.goalChip, goalMet && { backgroundColor: theme.success + "22", borderColor: theme.success + "55" }]}>
          <Ionicons
            name={goalMet ? "checkmark-circle" : "flag-outline"}
            size={13}
            color={goalMet ? theme.success : theme.accent}
          />
          <Text style={[styles.goalChipText, goalMet && { color: theme.success }]}>
            {Math.min(trained, 7)}/{WEEKLY_GOAL} días
          </Text>
        </View>
      </View>

      <WeekDots days={days} />

      <View style={styles.weekFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekFooterLabel}>Volumen</Text>
          <Text style={styles.weekFooterValue}>
            {volume.toLocaleString("es-ES")}
            <Text style={styles.weekFooterUnit}> kg</Text>
          </Text>
        </View>
        {trend && (
          <View
            style={[
              styles.trendPill,
              { backgroundColor: (trend.direction === "up" ? theme.success : theme.error) + "1F" },
            ]}
          >
            <Ionicons
              name={trend.direction === "up" ? "trending-up" : "trending-down"}
              size={14}
              color={trend.direction === "up" ? theme.success : theme.error}
            />
            <Text style={[styles.trendText, { color: trend.direction === "up" ? theme.success : theme.error }]}>
              {trend.pct}% vs semana pasada
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function MiniStat({
  icon,
  value,
  label,
  theme,
  styles,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
  theme: AppTheme;
  styles: any;
}) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={18} color={theme.accent} />
      <Text style={styles.miniValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.miniLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function volumeTrend(current: number, previous: number): { direction: "up" | "down"; pct: number } | null {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return { direction: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

const CHART_HEIGHT = 90;
const BAR_WIDTH = 24;
const BAR_GAP = 14;
const LABEL_MARGIN = 16;

function WeeklyBarChart({
  data,
  metric,
  todayIndex,
  theme,
  styles,
}: {
  data: DayBucket[];
  metric: ChartMetric;
  todayIndex: number;
  theme: AppTheme;
  styles: any;
}) {
  const chartWidth = data.length * (BAR_WIDTH + BAR_GAP);
  const values = data.map((d) => (metric === "minutes" ? d.minutes : d.volume));
  const maxValue = Math.max(1, ...values);

  return (
    <View style={styles.chartCard}>
      <Svg width={chartWidth} height={CHART_HEIGHT + 34} style={{ alignSelf: "center" }}>
        {data.map((day, i) => {
          const value = values[i];
          const barHeight = value > 0 ? Math.max(6, (value / maxValue) * (CHART_HEIGHT - LABEL_MARGIN)) : 4;
          const x = i * (BAR_WIDTH + BAR_GAP);
          const isToday = i === todayIndex;
          return (
            <React.Fragment key={i}>
              {value > 0 && (
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT - barHeight - 6}
                  fontSize={11}
                  fontWeight="800"
                  fill={theme.textPrimary}
                  textAnchor="middle"
                >
                  {metric === "minutes" ? `${value}m` : `${value}kg`}
                </SvgText>
              )}
              <Rect
                x={x}
                y={CHART_HEIGHT - barHeight}
                width={BAR_WIDTH}
                height={barHeight}
                rx={6}
                fill={isToday ? theme.accent : theme.accentDim}
              />
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 18}
                fontSize={9}
                fontWeight="700"
                fill={theme.textMuted}
                textAnchor="middle"
              >
                {day.label}
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
    chartCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    weekNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 2,
    },
    weekNavLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
      textTransform: "capitalize",
      minWidth: 160,
      textAlign: "center",
    },
    // ── This week card ──
    weekCard: {
      borderRadius: 22,
      padding: 18,
      gap: 16,
      overflow: "hidden",
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    weekHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    weekEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, color: theme.accentLight },
    goalChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    goalChipText: { fontSize: 12, fontWeight: "800", color: theme.accent },
    weekFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.borderSubtle,
    },
    weekFooterLabel: { fontSize: 12, color: theme.textMuted, fontWeight: "600" },
    weekFooterValue: { fontSize: 22, fontWeight: "900", color: theme.textPrimary, letterSpacing: -0.5 },
    weekFooterUnit: { fontSize: 13, fontWeight: "700", color: theme.textSecondary },
    trendPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    trendText: { fontSize: 11, fontWeight: "800" },

    // ── Mini stats ──
    miniRow: { flexDirection: "row", gap: 10 },
    miniStat: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 12,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    miniValue: { fontSize: 16, fontWeight: "900", color: theme.textPrimary, marginTop: 4 },
    miniLabel: { fontSize: 11, color: theme.textMuted, fontWeight: "600" },

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
    prPreviewBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
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
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionHeaderWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    metricSegmented: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      borderRadius: 20,
      padding: 3,
      gap: 2,
    },
    metricSegment: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    metricSegmentActive: {
      backgroundColor: theme.accentDim,
    },
    metricSegmentText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    metricSegmentTextActive: {
      color: theme.accent,
    },
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
    emptyCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 24,
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    emptyCardText: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },

    // ── Exercise preview modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.bgBase,
      height: "80%",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: theme.textPrimary },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    modalImageContainer: {
      width: "100%",
      height: 250,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
    },
    modalImage: { width: "100%", height: "100%" },
    modalIconPlaceholder: {
      flex: 1,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    modalInfo: { gap: 16 },
    exerciseTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: theme.textPrimary,
      textTransform: "uppercase",
    },
    modalBadges: { flexDirection: "row", gap: 8 },
    modalBadge: {
      backgroundColor: theme.accentDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    modalBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.accent,
      textTransform: "capitalize",
    },
    descLabel: { fontSize: 11, fontWeight: "800", color: theme.textMuted, letterSpacing: 1 },
    modalDesc: { fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
    viewProgressBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    viewProgressText: { fontSize: 14, fontWeight: "800", color: theme.accent },
  });

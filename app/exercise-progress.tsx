import { Exercise, RoutinesAPI } from "@/api/routines";
import { WorkoutsAPI } from "@/api/workouts";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DumbbellLoader } from "@/components/ui/DumbbellLoader";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Circle, Polyline, Svg } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 180;

export default function ExerciseProgressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useAppStore();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (id && profile?.id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.id]);

  const loadData = async () => {
    try {
      if (!profile?.id) return;
      const userId = profile.id;
      setLoadError(false);

      // Find exercise in catalog (could be cached in store, but fetching for freshness)
      const catalog = await RoutinesAPI.getExercises();
      const ex = catalog.find((e) => e.id === Number(id));
      if (ex) setExercise(ex);

      const { items, truncated: wasTruncated } = await WorkoutsAPI.getExerciseProgress(
        userId,
        Number(id),
      );
      setHistory(items);
      setTruncated(wasTruncated);
    } catch (e) {
      console.error("[ExerciseProgress] Loading failed:", e);
      // Keep any previously loaded history visible — only surface the error
      // banner when we have nothing to show, so a transient refresh failure
      // doesn't make correctly-loaded data disappear or look like "no data".
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const chartablePoints = history.filter((h) => h.hasData !== false);

  const getChartPoints = () => {
    if (chartablePoints.length < 2) return "";
    const maxVal = Math.max(...chartablePoints.map((h) => h.maxWeight), 1);

    return chartablePoints
      .map((h, i) => {
        const x = (i / (chartablePoints.length - 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (h.maxWeight / maxVal) * (CHART_HEIGHT - 20);
        return `${x},${y}`;
      })
      .join(" ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <DumbbellLoader />
      </View>
    );
  }

  const maxPR =
    chartablePoints.length > 0
      ? Math.max(...chartablePoints.map((h) => h.maxWeight))
      : null;
  const lastPR =
    chartablePoints.length > 0
      ? chartablePoints[chartablePoints.length - 1].maxWeight
      : null;

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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progresión</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {exercise && (
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.muscle_group} · {exercise.equipment}
              </Text>
            </View>
          )}

          {/* PR Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>RÉCORD PERSONAL</Text>
              <Text style={styles.statValue}>
                {maxPR !== null ? `${maxPR} kg` : "—"}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ÚLTIMO PESO</Text>
              <Text style={styles.statValue}>
                {lastPR !== null ? `${lastPR} kg` : "—"}
              </Text>
            </View>
          </View>

          {/* Chart Section */}
          <Text style={styles.sectionTitle}>HISTORIAL DE CARGA (KGs)</Text>
          {loadError && chartablePoints.length > 0 && (
            <TouchableOpacity style={styles.staleBanner} onPress={loadData}>
              <Ionicons name="alert-circle-outline" size={14} color={theme.textMuted} />
              <Text style={styles.staleBannerText}>
                No se pudo actualizar. Mostrando el último dato disponible — toca para reintentar.
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.chartContainer}>
            {loadError && chartablePoints.length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={40}
                  color={theme.textMuted}
                />
                <Text style={styles.emptyText}>
                  No pudimos cargar tu progreso. Revisa tu conexión.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                  <Ionicons name="refresh" size={14} color={theme.accent} />
                  <Text style={styles.retryBtnText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : chartablePoints.length > 1 ? (
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Polyline
                  points={getChartPoints()}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth="3"
                />
                {chartablePoints.map((h, i) => {
                  const maxVal = Math.max(
                    ...chartablePoints.map((hx) => hx.maxWeight),
                    1,
                  );
                  const x = (i / (chartablePoints.length - 1)) * CHART_WIDTH;
                  const y =
                    CHART_HEIGHT - (h.maxWeight / maxVal) * (CHART_HEIGHT - 20);
                  return (
                    <Circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={theme.accentLight}
                    />
                  );
                })}
              </Svg>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons
                  name="stats-chart-outline"
                  size={40}
                  color={theme.textMuted}
                />
                <Text style={styles.emptyText}>
                  Necesitas al menos 2 sesiones para graficar tu progreso.
                </Text>
              </View>
            )}
          </View>

          {/* History List */}
          <Text style={styles.sectionTitle}>DETALLE DE SESIONES</Text>
          {[...history].reverse().map((log, idx) => (
            <View key={idx} style={styles.logItem}>
              <View>
                <Text style={styles.logDate}>
                  {new Date(log.date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.logVol}>
                  {log.hasData === false
                    ? "Sin series registradas para este ejercicio"
                    : `${log.totalVol} kg volumen total`}
                </Text>
              </View>
              <Text style={styles.logMax}>
                {log.hasData === false ? "—" : `${log.maxWeight} kg`}
              </Text>
            </View>
          ))}
          {truncated && (
            <Text style={styles.truncatedNote}>
              Mostrando tus {history.length} sesiones más recientes. El
              historial completo es más largo.
            </Text>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    scroll: {
      padding: 20,
    },
    exerciseHeader: {
      marginBottom: 32,
      alignItems: "center",
    },
    exerciseName: {
      fontSize: 24,
      fontWeight: "900",
      color: theme.textPrimary,
      textTransform: "uppercase",
      letterSpacing: -1,
    },
    exerciseMeta: {
      fontSize: 14,
      color: theme.accent,
      fontWeight: "600",
      marginTop: 4,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 32,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: theme.textMuted,
      marginBottom: 6,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.textMuted,
      letterSpacing: 2,
      marginBottom: 16,
    },
    chartContainer: {
      backgroundColor: theme.bgCard,
      borderRadius: 24,
      padding: 20,
      marginBottom: 40,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      height: 220,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyChart: {
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 18,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
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
    staleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    staleBannerText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 11,
      lineHeight: 15,
    },
    logItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: theme.borderSubtle,
    },
    logDate: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    logVol: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    logMax: {
      color: theme.accent,
      fontSize: 18,
      fontWeight: "900",
    },
    truncatedNote: {
      color: theme.textMuted,
      fontSize: 11,
      textAlign: "center",
      marginTop: 14,
      lineHeight: 16,
    },
  });

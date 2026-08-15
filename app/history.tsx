import { WorkoutsAPI } from "@/api/workouts";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

export default function WorkoutsHistoryScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile } = useAppStore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Modal states
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Set editor state
  const [editingSet, setEditingSet] = useState<{
    exLogId: number;
    exIdx: number;
    setIdx: number;
    weight: string;
    reps: string;
  } | null>(null);
  const [savingSet, setSavingSet] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    if (profile?.id) loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await WorkoutsAPI.getWorkoutLogs(profile!.id!, PAGE_SIZE, 0);
      setLogs(data);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(data.length);
    } catch (e) {
      console.error("[HistoryScreen] Failed to load initial:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !profile?.id) return;
    try {
      setLoadingMore(true);
      const data = await WorkoutsAPI.getWorkoutLogs(
        profile.id,
        PAGE_SIZE,
        offset,
      );
      setLogs((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setOffset((prev) => prev + data.length);
    } catch (e) {
      console.error("[HistoryScreen] Failed to load more:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleWorkoutPress = async (log: any) => {
    setSelectedWorkout(log);
    setDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const data = await WorkoutsAPI.getWorkoutDetails(log.id);
      setWorkoutExercises(data);
    } catch (e) {
      console.error("[HistoryScreen] Error loading details:", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExercisePress = (exerciseId: number) => {
    setDetailsModalVisible(false);
    router.push({
      pathname: "/exercise-progress",
      params: { id: exerciseId },
    });
  };

  const openSetEditor = (exIdx: number, setIdx: number) => {
    const exLog = workoutExercises[exIdx];
    const set = exLog.sets_completed[setIdx];
    setEditError(null);
    setEditingSet({
      exLogId: exLog.id,
      exIdx,
      setIdx,
      weight: set.weight?.toString() || "",
      reps: set.reps?.toString() || "",
    });
  };

  const applyVolumeUpdate = (updatedExercises: any[]) => {
    const totalVolume = updatedExercises.reduce((sum, ex) => {
      const exVolume = (ex.sets_completed || []).reduce(
        (acc: number, s: any) => acc + (s.weight || 0) * (s.reps || 0),
        0,
      );
      return sum + exVolume;
    }, 0);
    setSelectedWorkout((prev: any) => (prev ? { ...prev, total_volume: totalVolume } : prev));
    setLogs((prev) =>
      prev.map((log) => (log.id === selectedWorkout.id ? { ...log, total_volume: totalVolume } : log)),
    );
  };

  const saveEditedSet = async () => {
    if (!editingSet || !selectedWorkout || !profile?.id) return;
    const w = parseFloat(editingSet.weight) || 0;
    const r = parseInt(editingSet.reps, 10) || 0;
    if (w < 0 || w > 1000 || r < 0 || r > 999) {
      setEditError("Revisa los valores: parecen fuera de rango.");
      return;
    }
    setEditError(null);
    setSavingSet(true);
    try {
      await WorkoutsAPI.updateSet(
        editingSet.exLogId,
        selectedWorkout.id,
        editingSet.setIdx,
        {
          weight: parseFloat(editingSet.weight) || 0,
          reps: parseInt(editingSet.reps, 10) || 0,
        },
        profile.id,
      );
      setWorkoutExercises((prev) => {
        const next = [...prev];
        const sets = [...next[editingSet.exIdx].sets_completed];
        sets[editingSet.setIdx] = {
          ...sets[editingSet.setIdx],
          weight: parseFloat(editingSet.weight) || 0,
          reps: parseInt(editingSet.reps, 10) || 0,
        };
        next[editingSet.exIdx] = { ...next[editingSet.exIdx], sets_completed: sets };
        applyVolumeUpdate(next);
        return next;
      });
      setEditingSet(null);
    } catch (e) {
      console.error("[HistoryScreen] Failed to update set:", e);
    } finally {
      setSavingSet(false);
    }
  };

  const confirmDeleteEditedSet = async () => {
    if (!editingSet || !selectedWorkout || !profile?.id) return;
    setConfirmDeleteVisible(false);
    setSavingSet(true);
    try {
      await WorkoutsAPI.updateSet(
        editingSet.exLogId,
        selectedWorkout.id,
        editingSet.setIdx,
        null,
        profile.id,
      );
      setWorkoutExercises((prev) => {
        const next = [...prev];
        const sets = [...next[editingSet.exIdx].sets_completed];
        sets.splice(editingSet.setIdx, 1);
        next[editingSet.exIdx] = { ...next[editingSet.exIdx], sets_completed: sets };
        applyVolumeUpdate(next);
        return next;
      });
      setEditingSet(null);
    } catch (e) {
      console.error("[HistoryScreen] Failed to delete set:", e);
    } finally {
      setSavingSet(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.logCard}
      onPress={() => handleWorkoutPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.logDateContainer}>
        <Text style={styles.logDay}>{new Date(item.started_at).getDate()}</Text>
        <Text style={styles.logMonth}>
          {new Date(item.started_at)
            .toLocaleDateString("es-ES", { month: "short" })
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.logTitle}>
          {item.routine?.name || "Sesión Personalizada"}
        </Text>
        <Text style={styles.logTime}>
          <Ionicons name="time-outline" size={12} color={theme.textMuted} />{" "}
          {Math.round(item.duration_seconds / 60)} min
        </Text>
      </View>
      <View style={styles.logVolume}>
        <Text style={styles.volVal}>{item.total_volume}</Text>
        <Text style={styles.volLabel}>KG</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.borderMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu Historial</Text>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? null : loadError ? (
              <View style={styles.empty}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={48}
                  color={theme.textMuted}
                />
                <Text style={styles.emptyText}>
                  No pudimos cargar tu historial.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadInitial}>
                  <Ionicons name="refresh" size={14} color={theme.accent} />
                  <Text style={styles.retryBtnText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="barbell-outline"
                  size={48}
                  color={theme.textMuted}
                />
                <Text style={styles.emptyText}>
                  No hay entrenamientos registrados.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.accent} style={{ padding: 20 }} />
            ) : (
              <View style={{ height: 40 }} />
            )
          }
          refreshing={loading}
          onRefresh={loadInitial}
        />
      </SafeAreaView>

      {/* Detail Modal Reused from Profile */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.detailsModalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <View>
                <Text style={styles.detailsModalTitle}>
                  {selectedWorkout?.routine?.name || "Sesión Personalizada"}
                </Text>
                <Text style={styles.detailsModalSubtitle}>
                  {selectedWorkout &&
                    new Date(selectedWorkout.started_at).toLocaleDateString(
                      "es-ES",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.detailsCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.detailsLoading}>
                <ActivityIndicator color={theme.accent} size="large" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsStatsRow}>
                  <View style={styles.detailsStat}>
                    <Text style={styles.detailsStatVal}>
                      {Math.round(
                        (selectedWorkout?.duration_seconds || 0) / 60,
                      )}
                      m
                    </Text>
                    <Text style={styles.detailsStatLabel}>TIEMPO</Text>
                  </View>
                  <View style={styles.detailsStat}>
                    <Text style={styles.detailsStatVal}>
                      {selectedWorkout?.total_volume}kg
                    </Text>
                    <Text style={styles.detailsStatLabel}>VOLUMEN</Text>
                  </View>
                </View>

                <Text style={styles.detailsSectionTitle}>
                  EJERCICIOS REALIZADOS
                </Text>
                {workoutExercises.map((exLog, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.detailsExItem}
                    onPress={() => handleExercisePress(exLog.exercise_id)}
                  >
                    <View style={styles.detailsExHeader}>
                      <Text style={styles.detailsExName}>
                        {exLog.exercise?.name}
                      </Text>
                      <Ionicons
                        name="stats-chart"
                        size={14}
                        color={theme.accent}
                      />
                    </View>
                    <View style={styles.detailsSetsRow}>
                      {(exLog.sets_completed || []).map(
                        (s: any, sIdx: number) => (
                          <TouchableOpacity
                            key={sIdx}
                            style={styles.detailsSetBadge}
                            onPress={() => openSetEditor(idx, sIdx)}
                            hitSlop={4}
                          >
                            <Text style={styles.detailsSetText}>
                              {s.weight}kg x {s.reps}
                            </Text>
                            <Ionicons name="create-outline" size={12} color={theme.accent} />
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingSet}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSet(null)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Editar Serie</Text>
            <Text style={styles.editHint}>
              Cambiar el peso puede actualizar tu récord personal y tu posición en el ranking.
            </Text>

            <View style={styles.editRow}>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>PESO (KG)</Text>
                <TextInput
                  style={styles.editInput}
                  keyboardType="numeric"
                  value={editingSet?.weight ?? ""}
                  onChangeText={(val) => {
                    setEditError(null);
                    setEditingSet((prev) => (prev ? { ...prev, weight: val } : prev));
                  }}
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>REPS</Text>
                <TextInput
                  style={styles.editInput}
                  keyboardType="numeric"
                  value={editingSet?.reps ?? ""}
                  onChangeText={(val) => {
                    setEditError(null);
                    setEditingSet((prev) => (prev ? { ...prev, reps: val } : prev));
                  }}
                />
              </View>
            </View>

            {editError && <Text style={styles.editErrorText}>{editError}</Text>}

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editDeleteBtn}
                onPress={() => setConfirmDeleteVisible(true)}
                disabled={savingSet}
              >
                <Text style={styles.editDeleteText}>Eliminar serie</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditingSet(null)}
                  disabled={savingSet}
                >
                  <Text style={styles.editCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveBtn}
                  onPress={saveEditedSet}
                  disabled={savingSet}
                >
                  {savingSet ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.editSaveText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmDeleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>¿Eliminar esta serie?</Text>
            <Text style={styles.editHint}>
              Esta acción no se puede deshacer. El volumen total y tu récord
              personal para este ejercicio se recalcularán.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.editCancelBtn, { flex: 1 }]}
                onPress={() => setConfirmDeleteVisible(false)}
                disabled={savingSet}
              >
                <Text style={styles.editCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editDeleteConfirmBtn, { flex: 1 }]}
                onPress={confirmDeleteEditedSet}
                disabled={savingSet}
              >
                {savingSet ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editSaveText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
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
    list: {
      padding: 20,
    },
    logCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    logDateContainer: {
      alignItems: "center",
      marginRight: 16,
      backgroundColor: theme.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      minWidth: 45,
    },
    logDay: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.accent,
    },
    logMonth: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textMuted,
    },
    logInfo: {
      flex: 1,
      gap: 2,
    },
    logTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    logTime: {
      fontSize: 12,
      color: theme.textMuted,
    },
    logVolume: {
      alignItems: "center",
      marginHorizontal: 12,
    },
    volVal: {
      fontSize: 16,
      fontWeight: "900",
      color: theme.textPrimary,
    },
    volLabel: {
      fontSize: 8,
      fontWeight: "800",
      color: theme.textMuted,
    },
    empty: {
      alignItems: "center",
      paddingTop: 100,
      gap: 16,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 16,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
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

    // Modal Styles
    detailsModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "flex-end",
    },
    detailsModalContent: {
      backgroundColor: theme.bgBase,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      height: "85%",
    },
    detailsModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    detailsModalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme.textPrimary,
      textTransform: "uppercase",
    },
    detailsModalSubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    detailsCloseBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    detailsLoading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    detailsStatsRow: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      gap: 12,
    },
    detailsStat: {
      flex: 1,
      alignItems: "center",
    },
    detailsStatVal: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.accent,
    },
    detailsStatLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: theme.textMuted,
      marginTop: 4,
    },
    detailsSectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.textMuted,
      letterSpacing: 2,
      marginBottom: 16,
      marginTop: 8,
    },
    detailsExItem: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    detailsExHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    detailsExName: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    detailsSetsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    detailsSetBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    detailsSetText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: "700",
    },

    // ── Set editor modal ──
    editOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    editCard: {
      width: "100%",
      backgroundColor: theme.bgBase,
      borderRadius: 20,
      padding: 20,
      gap: 16,
    },
    editTitle: { fontSize: 17, fontWeight: "800", color: theme.textPrimary },
    editHint: {
      fontSize: 12,
      color: theme.textMuted,
      lineHeight: 17,
      marginTop: -8,
    },
    editErrorText: {
      fontSize: 12,
      color: theme.error,
      fontWeight: "600",
      marginTop: -8,
    },
    editRow: { flexDirection: "row", gap: 12 },
    editField: { flex: 1, gap: 6 },
    editLabel: { fontSize: 10, fontWeight: "800", color: theme.textMuted, letterSpacing: 0.5 },
    editInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    editActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    editDeleteBtn: { paddingVertical: 8, paddingHorizontal: 4 },
    editDeleteText: { fontSize: 13, fontWeight: "700", color: theme.error },
    editCancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: theme.surface,
    },
    editCancelText: { fontSize: 13, fontWeight: "700", color: theme.textSecondary },
    editSaveBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: theme.accent,
      minWidth: 80,
      alignItems: "center",
    },
    editSaveText: { fontSize: 13, fontWeight: "700", color: "#fff" },
    editDeleteConfirmBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: theme.error,
      alignItems: "center",
    },
  });

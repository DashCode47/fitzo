import { Routine, RoutinesAPI } from "@/api/routines";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Bone } from "@/components/ui/Bone";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_CARD_WIDTH = 70;
const DAY_CARD_GAP = 10;

export default function RoutinesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const {
    profile,
    routines,
    setRoutines,
    userSchedule,
    setUserSchedule,
    isHydrated,
  } = useAppStore();
  const { startWorkout, replaceModalProps } = useStartWorkout();

  const [loading, setLoading] = useState(!isHydrated);
  const [refreshing, setRefreshing] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const scheduleScrollRef = useRef<ScrollView>(null);
  const [scheduleRowWidth, setScheduleRowWidth] = useState(0);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "error" | "success">(
    "confirm",
  );
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  useEffect(() => {
    if (isHydrated && profile?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      const [newRoutines, newSchedule] = await Promise.all([
        RoutinesAPI.getUserRoutines(profile.id),
        RoutinesAPI.getUserSchedule(profile.id),
      ]);
      setRoutines(newRoutines);
      setUserSchedule(newSchedule);
    } catch (e) {
      console.error("[RoutinesScreen] loadData failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!scheduleRowWidth) return;
    const todayIdx = new Date().getDay();
    const x = todayIdx * (DAY_CARD_WIDTH + DAY_CARD_GAP);
    scheduleScrollRef.current?.scrollTo({ x, animated: true });
  }, [scheduleRowWidth]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const confirmDeleteRoutine = (routine: any) => {
    setModalTitle("Eliminar Rutina");
    setModalMessage(
      `¿Estás seguro que deseas eliminar "${routine.name}"? Esta acción no se puede deshacer.`,
    );
    setModalType("confirm");
    setOnConfirmAction(() => () => handleDeleteRoutine(routine.id));
    setModalVisible(true);
  };

  const handleDeleteRoutine = async (id: number) => {
    setModalVisible(false);
    // Add small delay to ensure the modal can reopen correctly in Android/iOS
    setTimeout(async () => {
      try {
        await RoutinesAPI.deleteRoutine(id);
        loadData();
      } catch (e) {
        console.error("[RoutinesScreen] Delete failed:", e);
        setModalTitle("Error");
        setModalMessage(
          "No se pudo eliminar la rutina. (Probablemente tiene entrenamientos asociados en tu historial)",
        );
        setModalType("error");
        setModalVisible(true);
      }
    }, 400);
  };

  const getRoutineForDay = (dayIdx: number) => {
    return userSchedule?.find((s) => s.day_of_week === dayIdx)?.routine;
  };

  const handleStartTodayWorkout = async () => {
    const todayRoutine = getRoutineForDay(new Date().getDay());
    if (!todayRoutine || !profile) return;

    try {
      setStartingWorkout(true);
      const routine = await RoutinesAPI.getRoutineDetail(todayRoutine.id);
      if (!routine) return;
      startWorkout(routine);
    } catch (e) {
      console.error("[RoutinesScreen] Failed to start workout:", e);
      setModalTitle("Error");
      setModalMessage("No pudimos cargar tu rutina de hoy. Revisa tu conexión e intenta de nuevo.");
      setModalType("error");
      setModalVisible(true);
    } finally {
      setStartingWorkout(false);
    }
  };

  const todayIdx = new Date().getDay();
  const todayRoutine = getRoutineForDay(todayIdx);
  const myRoutines = routines?.filter((r) => !r.is_template) ?? [];
  const gymRoutines = routines?.filter((r) => r.is_template) ?? [];

  const renderRoutine = (routine: Routine) => {
    const isOwner = !routine.is_template && routine.created_by === profile?.id;
    return (
      <TouchableOpacity
        key={routine.id}
        style={styles.routineCard}
        onPress={() => router.push(`/routine-detail?id=${routine.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.routineInfo}>
          <Text style={styles.routineName} numberOfLines={1}>{routine.name}</Text>
          <View style={styles.routineMeta}>
            {!!routine.estimated_duration && (
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                <Text style={styles.metaText}>{routine.estimated_duration} min</Text>
              </View>
            )}
            {!!routine.difficulty && (
              <View style={styles.metaBadge}>
                <Ionicons name="speedometer-outline" size={12} color={theme.textMuted} />
                <Text style={styles.metaText}>
                  {RoutinesAPI.translateDifficulty(routine.difficulty)}
                </Text>
              </View>
            )}
          </View>
        </View>
        {isOwner ? (
          <View style={styles.routineActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/routine-edit?id=${routine.id}`)}
              accessibilityLabel="Editar rutina"
            >
              <Ionicons name="create-outline" size={17} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => confirmDeleteRoutine(routine)}
              accessibilityLabel="Eliminar rutina"
            >
              <Ionicons name="trash-outline" size={17} color={theme.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.scroll}>
            <View style={styles.header}>
              <View style={{ gap: 6 }}>
                <Bone w={150} h={24} radius={6} />
                <Bone w={210} h={12} radius={4} />
              </View>
              <Bone w={48} h={48} radius={14} />
            </View>
            <Bone w="100%" h={150} radius={24} style={{ marginBottom: 28 }} />
            <Bone w={110} h={12} radius={4} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24, overflow: "hidden" }}>
              {DAYS.map((day) => (
                <Bone key={day} w={DAY_CARD_WIDTH} h={96} radius={16} />
              ))}
            </View>
            <View style={styles.routineSection}>
              <Bone w={140} h={16} radius={5} />
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} w="100%" h={84} radius={18} />
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mis Rutinas</Text>
              <Text style={styles.subtitle}>
                Organiza tu semana de entrenamiento
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/routine-create")}
            >
              <LinearGradient
                colors={theme.gradients.accent}
                style={styles.addBtnGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Today */}
          {todayRoutine ? (
            <View style={{ marginBottom: 28 }}>
              <TodayWorkoutCard
                routine={todayRoutine}
                loading={startingWorkout}
                onPress={handleStartTodayWorkout}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.restCard}
              onPress={() => router.push(`/schedule-edit?day=${todayIdx}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="moon-outline" size={18} color={theme.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restTitle}>Hoy es día libre</Text>
                <Text style={styles.restSubtitle}>Toca para asignar una rutina</Text>
              </View>
              <Ionicons name="add" size={18} color={theme.accent} />
            </TouchableOpacity>
          )}

          {/* Weekly Schedule */}
          <Text style={styles.sectionTitle}>Plan semanal</Text>
          <ScrollView
            ref={scheduleScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scheduleRow}
            contentContainerStyle={{
              paddingHorizontal: Math.max(0, scheduleRowWidth / 2 - DAY_CARD_WIDTH / 2),
            }}
            onLayout={(e) => setScheduleRowWidth(e.nativeEvent.layout.width)}
          >
            {DAYS.map((day, idx) => {
              const routine = getRoutineForDay(idx);
              const isToday = todayIdx === idx;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCard, isToday && styles.dayCardToday]}
                  onPress={() => router.push(`/schedule-edit?day=${idx}`)}
                >
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {day.toUpperCase()}
                  </Text>
                  <View style={[styles.dayDot, routine && styles.dayDotActive]} />
                  <Text
                    style={[styles.dayRoutineName, !routine && { color: theme.textMuted }]}
                    numberOfLines={2}
                  >
                    {routine?.name ?? "Libre"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Routine lists */}
          {myRoutines.length > 0 && (
            <View style={[styles.routineSection, { marginBottom: 28 }]}>
              <Text style={styles.sectionTitle}>Tus rutinas</Text>
              {myRoutines.map(renderRoutine)}
            </View>
          )}
          {gymRoutines.length > 0 && (
            <View style={styles.routineSection}>
              <Text style={styles.sectionTitle}>Del gimnasio</Text>
              {gymRoutines.map(renderRoutine)}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
        onConfirm={onConfirmAction}
        buttonText={modalType === "confirm" ? "Eliminar" : "Entendido"}
      />

      <CustomModal {...replaceModalProps} />
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
      height: 250,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    addBtn: {
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    addBtnGradient: {
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textSecondary,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    scheduleRow: {
      flexDirection: "row",
      marginBottom: 24,
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    dayCard: {
      width: DAY_CARD_WIDTH,
      minHeight: 96,
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      marginRight: DAY_CARD_GAP,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    dayCardToday: {
      borderColor: theme.accentBorder,
      backgroundColor: theme.accentDim,
    },
    dayName: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      color: theme.textMuted,
    },
    dayNameToday: {
      color: theme.accentLight,
    },
    dayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginVertical: 10,
      backgroundColor: theme.borderMuted,
    },
    dayDotActive: {
      backgroundColor: theme.accent,
    },
    dayRoutineName: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.textSecondary,
      textAlign: "center",
      width: "100%",
    },
    restCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      marginBottom: 28,
      borderRadius: 18,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.borderMuted,
    },
    restTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    restSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    routineSection: {
      gap: 12,
    },
    routineCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    routineActions: {
      flexDirection: "row",
      gap: 6,
    },
    actionBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    routineInfo: {
      flex: 1,
    },
    routineName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    routineMeta: {
      flexDirection: "row",
      gap: 8,
    },
    metaBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    metaText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: "600",
    },
  });

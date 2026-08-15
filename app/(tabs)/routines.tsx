import { RoutinesAPI } from "@/api/routines";
import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
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
        setLoading(true);
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
      } finally {
        setLoading(false);
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
      setLoading(true);
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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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

          {/* Weekly Schedule */}
          <Text style={styles.sectionTitle}>Plan Semanal</Text>
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
              const isToday = new Date().getDay() === idx;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCard, isToday && styles.dayCardToday]}
                  onPress={() => router.push(`/schedule-edit?day=${idx}`)}
                >
                  <Text
                    style={[styles.dayName, isToday && styles.dayNameToday]}
                  >
                    {day}
                  </Text>
                  <Ionicons
                    name={routine ? "barbell" : "remove"}
                    size={18}
                    color={routine ? theme.accent : theme.textMuted}
                    style={styles.dayIcon}
                  />
                  {routine && (
                    <Text style={styles.dayRoutineName} numberOfLines={1}>
                      {routine.name}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Current Workout Call to Action (if any) */}
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={handleStartTodayWorkout}
          >
            <LinearGradient
              colors={[theme.accentDim, theme.surface]}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaIcon}>
                <Ionicons name="play" size={20} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Entrenamiento de hoy</Text>
                <Text style={styles.ctaSubtitle}>
                  {getRoutineForDay(new Date().getDay())?.name ||
                    "No hay rutina asignada para hoy"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textMuted}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Routine List */}
          <View style={styles.routineSection}>
            <Text style={styles.sectionTitle}>Explorar Rutinas</Text>
            {routines?.map((routine) => (
              <View key={routine.id} style={styles.routineCardWrapper}>
                <TouchableOpacity
                  style={styles.routineCard}
                  onPress={() =>
                    router.push(`/routine-detail?id=${routine.id}`)
                  }
                >
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <View style={styles.routineMeta}>
                      <View style={styles.metaBadge}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={theme.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {routine.estimated_duration} min
                        </Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons
                          name="flash-outline"
                          size={12}
                          color={theme.textMuted}
                        />
                        <Text style={styles.metaText}>
                          {RoutinesAPI.translateDifficulty(routine.difficulty)}
                        </Text>
                      </View>
                      {routine.is_template && (
                        <View
                          style={[
                            styles.metaBadge,
                            { backgroundColor: theme.accentDim },
                          ]}
                        >
                          <Text
                            style={[
                              styles.metaText,
                              {
                                color: theme.accent,
                                fontSize: 10,
                                fontWeight: "800",
                              },
                            ]}
                          >
                            GYM
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>

                {/* Edit/Delete options for non-templates (user creations) */}
                {!routine.is_template && routine.created_by === profile?.id && (
                  <View style={styles.routineActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() =>
                        router.push(`/routine-edit?id=${routine.id}`)
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={theme.accent}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => confirmDeleteRoutine(routine)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
      fontSize: 18,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 14,
    },
    scheduleRow: {
      flexDirection: "row",
      marginBottom: 24,
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    dayCard: {
      width: 70,
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    dayCardToday: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: theme.accentDim,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    dayName: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textMuted,
      marginBottom: 8,
    },
    dayNameToday: {
      color: theme.accent,
      fontWeight: "800",
    },
    dayIcon: {
      marginBottom: 8,
    },
    dayRoutineName: {
      fontSize: 10,
      color: theme.textSecondary,
      textAlign: "center",
      width: "100%",
    },
    ctaCard: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.accentBorder,
      marginBottom: 32,
    },
    ctaGradient: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    ctaIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
    },
    ctaTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    ctaSubtitle: {
      fontSize: 12,
      color: theme.accent,
      marginTop: 1,
    },
    routineSection: {
      gap: 12,
    },
    routineCardWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    routineCard: {
      flex: 1,
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
      gap: 8,
    },
    actionBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.bgCard,
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

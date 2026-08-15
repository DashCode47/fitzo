import { RoutinesAPI, UserSchedule } from "@/api/routines";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { getErrorMessage } from "@/utils/errors";
import { CustomModal } from "@/components/ui/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function ScheduleEditScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const navigation = useNavigation();
  const { day } = useLocalSearchParams();
  const { profile, routines, userSchedule, setUserSchedule } = useAppStore();

  const [selectedDay, setSelectedDay] = useState(Number(day) || 0);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: "" });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const pendingLeaveAction = useRef<any>(null);
  const leaving = useRef(false);

  const originalRoutineId =
    userSchedule?.find((s) => s.day_of_week === selectedDay)?.routine_id ??
    null;
  const hasChanges = !saved && selectedRoutineId !== originalRoutineId;

  useEffect(() => {
    const current = userSchedule?.find((s) => s.day_of_week === selectedDay);
    if (current) setSelectedRoutineId(current.routine_id);
    else setSelectedRoutineId(null);
  }, [selectedDay, userSchedule]);

  useEffect(() => {
    const onBackPress = () => {
      if (hasChanges) {
        setShowDiscardModal(true);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [hasChanges]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!hasChanges || leaving.current) return;
      e.preventDefault();
      pendingLeaveAction.current = e.data.action;
      setShowDiscardModal(true);
    });
    return unsubscribe;
  }, [navigation, hasChanges]);

  const discardAndLeave = () => {
    setShowDiscardModal(false);
    leaving.current = true;
    const action = pendingLeaveAction.current;
    pendingLeaveAction.current = null;
    if (action) navigation.dispatch(action);
    else router.back();
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const scheduleData: Partial<UserSchedule> = {
        user_id: profile.id,
        day_of_week: selectedDay,
        routine_id: selectedRoutineId as number,
        active: !!selectedRoutineId,
      };

      await RoutinesAPI.upsertSchedule(scheduleData);

      const refreshed = await RoutinesAPI.getUserSchedule(profile.id);
      setUserSchedule(refreshed);

      setSaved(true);
      router.back();
    } catch (e) {
      console.error("[ScheduleEdit] Failed to save:", e);
      setErrorModal({
        visible: true,
        message: getErrorMessage(e, "No pudimos guardar tu horario. Revisa tu conexión."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      <CustomModal
        visible={errorModal.visible}
        title="Error"
        message={errorModal.message}
        type="error"
        onClose={() => setErrorModal({ visible: false, message: "" })}
      />

      <CustomModal
        visible={showDiscardModal}
        title="¿Descartar Cambios?"
        message="Perderás la selección que hiciste para este día si sales ahora."
        type="confirm"
        buttonText="DESCARTAR"
        cancelText="SEGUIR EDITANDO"
        onClose={() => setShowDiscardModal(false)}
        onConfirm={discardAndLeave}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (hasChanges ? setShowDiscardModal(true) : router.back())}
            style={styles.backBtn}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planificar Día</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveBtn, loading && { opacity: 0.5 }]}>
              LISTO
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Day Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DÍA DE LA SEMANA</Text>
            <View style={styles.chipRow}>
              {DAYS_FULL.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, selectedDay === i && styles.chipActive]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedDay === i && styles.chipTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Routine List */}
          <Text style={styles.label}>SELECCIONA UNA RUTINA</Text>
          <TouchableOpacity
            style={[
              styles.routineItem,
              selectedRoutineId === null && styles.routineItemActive,
            ]}
            onPress={() => setSelectedRoutineId(null)}
          >
            <View style={styles.restIcon}>
              <Ionicons name="moon-outline" size={20} color={theme.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineName}>Día de Descanso</Text>
              <Text style={styles.routineMeta}>Sin actividad planificada</Text>
            </View>
            {selectedRoutineId === null && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.accent}
              />
            )}
          </TouchableOpacity>

          {routines?.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={[
                styles.routineItem,
                selectedRoutineId === routine.id && styles.routineItemActive,
              ]}
              onPress={() => setSelectedRoutineId(routine.id)}
            >
              <View style={styles.routineIcon}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={theme.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineMeta}>
                  {routine.difficulty} · {routine.estimated_duration} min
                </Text>
              </View>
              {selectedRoutineId === routine.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.accent}
                />
              )}
            </TouchableOpacity>
          ))}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  saveBtn: {
    color: theme.accent,
    fontWeight: "900",
    fontSize: 14,
  },
  scroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  chipActive: {
    backgroundColor: theme.accentDim,
    borderColor: theme.accentBorder,
  },
  chipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: theme.accent,
    fontWeight: "800",
  },
  routineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 14,
  },
  routineItemActive: {
    borderColor: theme.accentBorder,
    backgroundColor: theme.bgSubtle,
  },
  routineIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.accentDim,
    justifyContent: "center",
    alignItems: "center",
  },
  restIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  routineName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
  },
  routineMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  });

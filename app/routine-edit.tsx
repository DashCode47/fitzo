import {
  Exercise,
  ROUTINE_DIFFICULTIES,
  ROUTINE_GOALS,
  RoutinesAPI,
} from "@/api/routines";
import { ExerciseCatalogModal, ExercisePreviewModal } from "@/components/exercise-catalog-modal";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoutineEditScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { profile } = useAppStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [goal, setGoal] = useState("hypertrophy");
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const initialSnapshot = useRef<string | null>(null);
  const pendingLeaveAction = useRef<any>(null);
  const leaving = useRef(false);

  const hasChanges =
    !saved &&
    initialSnapshot.current !== null &&
    JSON.stringify({ name, description, difficulty, goal, selectedExercises }) !==
      initialSnapshot.current;

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const loadAll = async () => {
    try {
      setLoading(true);
      const [catalog, routine] = await Promise.all([
        RoutinesAPI.getExercises(),
        RoutinesAPI.getRoutineDetail(Number(id)),
      ]);

      setExercisesCatalog(catalog);

      if (routine) {
        const mappedEx = (routine.exercises || []).map((re) => ({
          exercise_id: re.exercise_id,
          exercise: re.exercise,
          sets: re.sets,
          reps: re.reps,
          rest_seconds: re.rest_seconds,
        }));

        setName(routine.name);
        setDescription(routine.description || "");
        setDifficulty(routine.difficulty);
        setGoal(routine.goal);
        setSelectedExercises(mappedEx);

        initialSnapshot.current = JSON.stringify({
          name: routine.name,
          description: routine.description || "",
          difficulty: routine.difficulty,
          goal: routine.goal,
          selectedExercises: mappedEx,
        });
      }
    } catch (e) {
      console.error("[RoutineEdit] Failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      {
        exercise_id: exercise.id,
        exercise: exercise,
        sets: 3,
        reps: "10",
        rest_seconds: 90,
      },
    ]);
    setShowCatalog(false);
  };

  const removeExercise = (idx: number) => {
    const newList = [...selectedExercises];
    newList.splice(idx, 1);
    setSelectedExercises(newList);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Falta el nombre", "Ponle un nombre a tu rutina para poder guardarla.");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Sin ejercicios", "Añade al menos un ejercicio para poder guardar la rutina.");
      return;
    }
    if (!profile) return;

    try {
      setSaving(true);
      const routineData = {
        name,
        description,
        difficulty,
        goal,
        created_by: profile.id,
        is_template: false,
      };

      const cleanedExercises = selectedExercises.map(
        ({ exercise, ...rest }) => rest,
      );

      await RoutinesAPI.updateRoutine(
        Number(id),
        routineData,
        cleanedExercises,
      );
      setSaved(true);
      router.replace("/(tabs)/routines");
    } catch (e) {
      console.error("[RoutineEdit] Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              hasChanges ? setShowDiscardModal(true) : router.back()
            }
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Rutina</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text
                style={[
                  styles.saveBtn,
                  (!name || selectedExercises.length === 0) && { opacity: 0.4 },
                ]}
              >
                GUARDAR
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <DraggableFlatList
          data={selectedExercises}
          keyExtractor={(item, idx) => `${item.exercise_id}-${idx}`}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onDragEnd={({ data }) => setSelectedExercises(data)}
          ListHeaderComponent={
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE DE LA RUTINA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Empuje, Día de Pierna..."
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESCRIPCIÓN (OPCIONAL)</Text>
                <TextInput
                  style={[styles.input, { height: 80, paddingVertical: 12 }]}
                  placeholder="Enfocada en hombros y pecho superior..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={styles.label}>DIFICULTAD</Text>
                <View style={styles.chipRow}>
                  {Object.entries(ROUTINE_DIFFICULTIES).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.selectChip,
                        difficulty === key && styles.selectChipActive,
                      ]}
                      onPress={() => setDifficulty(key)}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          difficulty === key && styles.selectChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={styles.label}>OBJETIVO PRINCIPAL</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {Object.entries(ROUTINE_GOALS).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.selectChip,
                        goal === key && styles.selectChipActive,
                      ]}
                      onPress={() => setGoal(key)}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          goal === key && styles.selectChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  EJERCICIOS ({selectedExercises.length})
                </Text>
                <TouchableOpacity style={styles.addExBtn} onPress={() => setShowCatalog(true)}>
                  <Ionicons name="add-circle" size={20} color={theme.accent} />
                  <Text style={styles.addExText}>AÑADIR</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({
            item,
            getIndex,
            drag,
            isActive,
          }: RenderItemParams<(typeof selectedExercises)[number]>) => {
            const idx = getIndex() ?? 0;
            return (
              <ScaleDecorator>
                <View
                  style={[
                    styles.exerciseItem,
                    isActive && styles.exerciseItemDragging,
                  ]}
                >
                  <View style={styles.exerciseMain}>
                    <TouchableOpacity
                      onLongPress={drag}
                      delayLongPress={150}
                      style={styles.dragHandle}
                    >
                      <Ionicons
                        name="reorder-three"
                        size={22}
                        color={theme.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exerciseAvatar}
                      disabled={!item.exercise}
                      onPress={() => {
                        if (!item.exercise) return;
                        setPreviewExercise(item.exercise);
                      }}
                    >
                      {item.exercise?.image_url ? (
                        <Image
                          source={{ uri: item.exercise.image_url }}
                          style={styles.avatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons name="barbell" size={20} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>
                        {item.exercise?.name || "Cargando..."}
                      </Text>
                      <Text style={styles.exerciseMeta}>
                        {item.sets} series · {item.reps} reps
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeExercise(idx)}>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScaleDecorator>
            );
          }}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>

      <ExerciseCatalogModal
        visible={showCatalog}
        onClose={() => setShowCatalog(false)}
        catalog={exercisesCatalog}
        onSelect={addExercise}
        theme={theme}
      />

      <ExercisePreviewModal
        visible={!!previewExercise}
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
        theme={theme}
      />

      {/* Discard Changes Confirmation Modal */}
      <Modal visible={showDiscardModal} transparent animationType="fade">
        <View style={styles.discardOverlay}>
          <View style={styles.discardContainer}>
            <View style={styles.discardIconBox}>
              <Ionicons name="warning-outline" size={32} color={theme.error} />
            </View>
            <Text style={styles.discardTitle}>¿Descartar Cambios?</Text>
            <Text style={styles.discardSub}>
              Perderás los cambios que hiciste en esta rutina si sales ahora.
            </Text>

            <View style={styles.discardFooter}>
              <TouchableOpacity
                style={styles.discardCancelBtn}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.discardCancelText}>SEGUIR EDITANDO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardConfirmBtn}
                onPress={discardAndLeave}
              >
                <Text style={styles.discardConfirmText}>DESCARTAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </GestureHandlerRootView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgDeep },
    loadingRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
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
    headerTitle: { fontSize: 18, fontWeight: "800", color: theme.textPrimary },
    saveBtn: { color: theme.accent, fontWeight: "900", fontSize: 14 },
    scroll: { padding: 20 },
    inputGroup: { marginBottom: 24 },
    label: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.textMuted,
      letterSpacing: 1,
      marginBottom: 10,
    },
    input: {
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      height: 54,
      paddingHorizontal: 16,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingTop: 12,
    },
    sectionTitle: { fontSize: 14, fontWeight: "800", color: theme.textPrimary },
    addExBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.accentDim,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    addExText: { fontSize: 12, color: theme.accent, fontWeight: "800" },
    exerciseItem: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    exerciseItemDragging: {
      opacity: 0.85,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    exerciseMain: { flexDirection: "row", alignItems: "center", gap: 12 },
    dragHandle: { paddingRight: 2 },
    exerciseAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatarImage: { width: "100%", height: "100%" },
    exerciseName: { fontSize: 15, fontWeight: "700", color: theme.textPrimary },
    exerciseMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    chipRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    selectChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    selectChipActive: {
      backgroundColor: theme.accentDim,
      borderColor: theme.accentBorder,
    },
    selectChipText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    selectChipTextActive: {
      color: theme.accent,
    },
    discardOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    discardContainer: {
      width: "100%",
      backgroundColor: theme.bgCard,
      borderRadius: 30,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    discardIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    discardTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    discardSub: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    discardFooter: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    discardCancelBtn: {
      flex: 1,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    discardCancelText: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.textSecondary,
    },
    discardConfirmBtn: {
      flex: 2,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.error,
    },
    discardConfirmText: {
      fontSize: 14,
      fontWeight: "900",
      color: "#fff",
    },
  });

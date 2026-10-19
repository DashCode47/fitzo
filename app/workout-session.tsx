import { Exercise, RoutinesAPI } from "@/api/routines";
import { RanksAPI } from "@/api/ranks";
import { AppTheme } from "@/constants/theme";
import { saveActiveWorkout } from "@/services/workoutAutoFinish";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore, ActiveWorkout } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  GestureResponderEvent,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type WorkoutExercise = ActiveWorkout["exercises"][number];

const MUSCLE_MAP: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Piernas",
  shoulders: "Hombros",
  arms: "Brazos",
  core: "Core",
  abs: "Abdomen",
  cardio: "Cardio",
  glutes: "Glúteos",
  forearms: "Antebrazo",
  "full body": "Cuerpo Completo",
};

function GlowCheckBtn({
  completed,
  isActive,
  onPress,
  accentColor,
  successColor,
  mutedColor,
  surfaceColor,
  borderColor,
}: {
  completed: boolean;
  isActive: boolean;
  onPress: (e: GestureResponderEvent) => void;
  accentColor: string;
  successColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive && !completed) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulse, {
              toValue: 1.55,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulse, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(400),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulse.setValue(1);
      glowOpacity.setValue(0);
    }
    return () => loopRef.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, completed]);

  return (
    <View style={{ width: 40, height: 40 }}>
      {isActive && !completed && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: pulse }],
          }}
        />
      )}
      <TouchableOpacity
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: completed ? successColor : surfaceColor,
          borderWidth: 1,
          borderColor: completed ? successColor : borderColor,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onPress}
      >
        <Ionicons
          name="checkmark"
          size={18}
          color={completed ? "#fff" : mutedColor}
        />
      </TouchableOpacity>
    </View>
  );
}

function GlowInputWrap({
  isEmpty,
  accentColor,
  children,
  style,
}: {
  isEmpty: boolean;
  accentColor: string;
  children: React.ReactNode;
  style: object;
}) {
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isEmpty) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.delay(200),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      glowOpacity.setValue(0);
    }
    return () => loopRef.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty]);

  return (
    <View style={[style, { position: "relative" }]}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: accentColor,
          opacity: glowOpacity,
        }}
      />
      {children}
    </View>
  );
}

type Flyer = { key: number; label: string; from: { x: number; y: number }; to: { x: number; y: number } };

// Chip that pops out of the check button and arcs into the completion tracker.
function FlyingChip({
  flyer,
  successColor,
  onArrive,
}: {
  flyer: Flyer;
  successColor: string;
  onArrive: () => void;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const dx = flyer.to.x - flyer.from.x;
    const dy = flyer.to.y - flyer.from.y;
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.delay(120),
      // Different easings on X and Y produce a curved path.
      Animated.parallel([
        Animated.timing(tx, {
          toValue: dx,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: dy,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 650,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 650,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onArrive());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: flyer.from.x,
        top: flyer.from.y,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    >
      {/* Centered on the origin point */}
      <View
        style={{
          transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: successColor,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          maxWidth: 220,
          shadowColor: successColor,
          shadowOpacity: 0.6,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      >
        <Ionicons name="checkmark-circle" size={16} color="#fff" />
        <Text
          numberOfLines={1}
          style={{ color: "#fff", fontWeight: "900", fontSize: 12, flexShrink: 1 }}
        >
          {flyer.label}
        </Text>
      </View>
    </Animated.View>
  );
}

// Fixed bar at the bottom that tracks how many exercises are fully completed.
function CompletionTracker({
  done,
  total,
  setsDone,
  setsTotal,
  pulseKey,
  badgeRef,
  onPress,
  theme,
  bottomInset,
}: {
  done: number;
  total: number;
  setsDone: number;
  setsTotal: number;
  pulseKey: number;
  badgeRef: React.RefObject<View | null>;
  onPress: () => void;
  theme: AppTheme;
  bottomInset: number;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(total ? done / total : 0)).current;
  const allDone = total > 0 && done === total;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: total ? done / total : 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, total]);

  useEffect(() => {
    if (pulseKey === 0) return;
    pulse.setValue(1.25);
    ring.setValue(1);
    Animated.parallel([
      Animated.spring(pulse, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(ring, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseKey]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(bottomInset, 12) + 4,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: theme.bgCard,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: allDone ? theme.success : theme.borderSubtle,
          paddingHorizontal: 14,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <View ref={badgeRef} collapsable={false} style={{ width: 40, height: 40 }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: theme.success,
              opacity: ring,
              transform: [{ scale: ringScale }],
            }}
          />
          <Animated.View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: done > 0 ? theme.success : theme.surface,
              borderWidth: 1,
              borderColor: done > 0 ? theme.success : theme.borderMuted,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: pulse }],
            }}
          >
            <Ionicons
              name={allDone ? "trophy" : "checkmark-done"}
              size={18}
              color={done > 0 ? "#fff" : theme.textMuted}
            />
          </Animated.View>
        </View>

        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>
              {allDone ? "¡RUTINA COMPLETA!" : `${done}/${total} EJERCICIOS`}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
              {setsDone}/{setsTotal} series
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.surface, overflow: "hidden" }}>
            <Animated.View
              style={{
                height: "100%",
                borderRadius: 3,
                backgroundColor: theme.success,
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              }}
            />
          </View>
        </View>

        {allDone && <Ionicons name="chevron-forward" size={18} color={theme.success} />}
      </TouchableOpacity>
    </View>
  );
}

export default function WorkoutSessionScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const {
    profile,
    activeWorkout,
    updateWorkoutSet,
    addWorkoutSet,
    removeWorkoutSet,
    reorderWorkoutExercises,
    setActiveWorkout,
  } = useAppStore();

  const [, forceTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [infoAlert, setInfoAlert] = useState<{ title: string; message: string; isError?: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  // Completion tracker + "fly to tracker" animation state.
  const rootRef = useRef<View>(null);
  const trackerBadgeRef = useRef<View>(null);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [pendingArrivals, setPendingArrivals] = useState(0);
  const [trackerPulse, setTrackerPulse] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Exercise cards can be collapsed individually and reordered via drag & drop.
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  const [muscleGroups, setMuscleGroups] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!profile?.id) return;
    RanksAPI.getUserMaxWeights(profile.id)
      .then((rows) => {
        const map: Record<string, number> = {};
        rows.forEach((r: any) => {
          const exerciseName = r.name || r.exercise_name;
          if (exerciseName) map[exerciseName] = r.max_weight;
        });
        setPersonalRecords(map);
      })
      .catch((e) => console.error("[WorkoutSession] Failed to fetch PRs:", e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    RoutinesAPI.getExercises()
      .then((data) => {
        const map: Record<number, string> = {};
        data.forEach((e) => {
          map[e.id] = e.muscle_group;
        });
        setMuscleGroups(map);
      })
      .catch((e) => console.error("[WorkoutSession] Failed to fetch muscle groups:", e));
  }, []);

  // Info Modal states
  const [selectedExDetails, setSelectedExDetails] = useState<Exercise | null>(
    null,
  );
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    if (!activeWorkout) {
      router.replace("/(tabs)/routines");
      return;
    }

    // Re-render every second; actual elapsed time is derived from startTime so it
    // stays correct even if the screen was off or the JS thread was suspended.
    timerRef.current = setInterval(() => {
      forceTick((n) => n + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkout]);

  useEffect(() => {
    const onBackPress = () => {
      setShowCancelModal(true);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, []);

  const elapsed = activeWorkout
    ? Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000))
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const translateMuscle = (muscle: string) =>
    MUSCLE_MAP[muscle.toLowerCase()] || muscle;

  const showInfo = async (exerciseId: number) => {
    try {
      const data = await RoutinesAPI.getExercises();
      const found = data.find((e: any) => e.id === exerciseId);
      if (found) {
        setSelectedExDetails(found);
        setInfoModalVisible(true);
      }
    } catch (e) {
      console.error("[WorkoutSession] Failed to fetch exercise details:", e);
    }
  };

  const handleFinish = () => {
    if (!activeWorkout || !profile) return;
    const hasCompletedSet = activeWorkout.exercises.some((ex) =>
      ex.sets.some((s) => s.completed),
    );
    if (!hasCompletedSet) {
      setInfoAlert({
        title: "Sin series completadas",
        message: "Marca al menos una serie antes de finalizar el entrenamiento.",
      });
      return;
    }
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    if (!activeWorkout || !profile) return;
    setShowFinishModal(false);

    try {
      setSubmitting(true);
      await saveActiveWorkout(activeWorkout);
      setShowSuccessModal(true);
    } catch (e) {
      console.error("[WorkoutSession] Failed to save:", e);
      setInfoAlert({
        title: "Error",
        message: "No pudimos guardar tu sesión. Revisa tu conexión.",
        isError: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    setActiveWorkout(null);
    setShowSuccessModal(false);
    router.replace("/(tabs)/routines");
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    setActiveWorkout(null);
    router.replace("/(tabs)/routines");
  };

  if (!activeWorkout) return null;

  const isDone = (ex: WorkoutExercise) =>
    ex.sets.length > 0 && ex.sets.every((s) => s.completed);
  const doneExercises = activeWorkout.exercises.filter(isDone).length;
  const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets = activeWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );
  // The counter only ticks up once the flying chip lands on the tracker.
  const displayedDone = Math.max(0, doneExercises - pendingArrivals);

  const launchFlyer = (label: string, pageX: number, pageY: number) => {
    const root = rootRef.current;
    const badge = trackerBadgeRef.current;
    if (!root || !badge || keyboardVisible) {
      setTrackerPulse((n) => n + 1);
      return;
    }
    setPendingArrivals((n) => n + 1);
    root.measureInWindow((rx, ry) => {
      badge.measureInWindow((bx, by, bw, bh) => {
        setFlyers((prev) => [
          ...prev,
          {
            key: Date.now() + Math.random(),
            label,
            from: { x: pageX - rx, y: pageY - ry },
            to: { x: bx - rx + bw / 2, y: by - ry + bh / 2 },
          },
        ]);
      });
    });
  };

  const handleFlyerArrive = (key: number) => {
    setFlyers((prev) => prev.filter((f) => f.key !== key));
    setPendingArrivals((n) => Math.max(0, n - 1));
    setTrackerPulse((n) => n + 1);
  };

  const toggleSet = (exIdx: number, setIdx: number, e: GestureResponderEvent) => {
    const ex = activeWorkout.exercises[exIdx];
    const set = ex?.sets[setIdx];
    if (!set) return;
    const completesExercise =
      !set.completed && ex.sets.every((s, i) => i === setIdx || s.completed);
    const { pageX, pageY } = e.nativeEvent;
    updateWorkoutSet(exIdx, setIdx, { completed: !set.completed });
    if (completesExercise) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      launchFlyer(ex.name, pageX, pageY);
    } else if (!set.completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  let activeGlowEx = -1;
  let activeGlowSet = -1;
  outer: for (let ei = 0; ei < activeWorkout.exercises.length; ei++) {
    for (let si = 0; si < activeWorkout.exercises[ei].sets.length; si++) {
      if (!activeWorkout.exercises[ei].sets[si].completed) {
        activeGlowEx = ei;
        activeGlowSet = si;
        break outer;
      }
    }
  }

  const sortByMuscleGroup = () => {
    const sorted = [...activeWorkout.exercises].sort((a, b) => {
      const groupA = muscleGroups[a.exerciseId] || "";
      const groupB = muscleGroups[b.exerciseId] || "";
      return groupA.localeCompare(groupB) || a.name.localeCompare(b.name);
    });
    reorderWorkoutExercises(sorted);
  };

  const toggleCollapsed = (exerciseId: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const renderExerciseCard = (ex: WorkoutExercise, exIdx: number, dragHandle?: () => void) => {
    const isCollapsed = collapsedIds.has(ex.exerciseId);
    const completedCount = ex.sets.filter((s) => s.completed).length;
    const isExerciseDone = ex.sets.length > 0 && completedCount === ex.sets.length;
    const pr = personalRecords[ex.name];
    const muscleGroup = muscleGroups[ex.exerciseId];

    return (
      <View style={[styles.exerciseBlock, isExerciseDone && styles.exerciseBlockDone]}>
        <View style={styles.exerciseHeader}>
          <TouchableOpacity
            onLongPress={dragHandle}
            delayLongPress={150}
            style={styles.dragHandle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="reorder-three" size={26} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => toggleCollapsed(ex.exerciseId)}
          >
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <View style={styles.exerciseMetaRow}>
              {muscleGroup && (
                <View style={styles.muscleBadge}>
                  <Text style={styles.muscleBadgeText}>
                    {translateMuscle(muscleGroup)}
                  </Text>
                </View>
              )}
              {pr != null && (
                <Text style={styles.exercisePr}>PR: {pr} KG</Text>
              )}
            </View>
          </TouchableOpacity>
          {isExerciseDone && (
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
          )}
          <Text
            style={[
              styles.exerciseSummary,
              isExerciseDone && { color: theme.success },
            ]}
          >
            {completedCount}/{ex.sets.length} series
          </Text>
          <TouchableOpacity onPress={() => showInfo(ex.exerciseId)}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleCollapsed(ex.exerciseId)}>
            <Ionicons
              name={isCollapsed ? "chevron-down" : "chevron-up"}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        </View>

        {!isCollapsed && (
          <>
            {/* Sets List */}
            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableLabel, { width: 40 }]}>SET</Text>
                <Text style={[styles.tableLabel, { flex: 1 }]}>
                  PESO (KG)
                </Text>
                <Text style={[styles.tableLabel, { flex: 1 }]}>REPS</Text>
                <View style={{ width: 40 }} />
              </View>

              {ex.sets.map((set, setIdx) => {
                const prevSet = ex.sets[setIdx - 1];
                return (
                <View
                  key={setIdx}
                  style={[
                    styles.setRow,
                    set.completed && styles.setRowCompleted,
                  ]}
                >
                  <Text style={styles.setNumber}>{set.set}</Text>

                  <GlowInputWrap
                    isEmpty={set.weight === 0}
                    accentColor="#FBBF24"
                    style={styles.inputWrap}
                  >
                    <TextInput
                      style={styles.setInput}
                      keyboardType="numeric"
                      placeholder={prevSet?.weight ? prevSet.weight.toString() : "0"}
                      placeholderTextColor={theme.textMuted}
                      value={set.weight > 0 ? set.weight.toString() : ""}
                      onFocus={() => {
                        if (set.weight === 0 && prevSet?.weight) {
                          updateWorkoutSet(exIdx, setIdx, { weight: prevSet.weight });
                        }
                      }}
                      onChangeText={(val) =>
                        updateWorkoutSet(exIdx, setIdx, {
                          weight: parseFloat(val) || 0,
                        })
                      }
                    />
                  </GlowInputWrap>

                  <GlowInputWrap
                    isEmpty={set.reps === 0}
                    accentColor="#FBBF24"
                    style={styles.inputWrap}
                  >
                    <TextInput
                      style={styles.setInput}
                      keyboardType="numeric"
                      placeholder={prevSet?.reps ? prevSet.reps.toString() : "0"}
                      placeholderTextColor={theme.textMuted}
                      value={set.reps > 0 ? set.reps.toString() : ""}
                      onFocus={() => {
                        if (set.reps === 0 && prevSet?.reps) {
                          updateWorkoutSet(exIdx, setIdx, { reps: prevSet.reps });
                        }
                      }}
                      onChangeText={(val) =>
                        updateWorkoutSet(exIdx, setIdx, {
                          reps: parseInt(val) || 0,
                        })
                      }
                    />
                  </GlowInputWrap>

                  <GlowCheckBtn
                    completed={set.completed}
                    isActive={
                      exIdx === activeGlowEx &&
                      setIdx === activeGlowSet &&
                      set.weight > 0
                    }
                    onPress={(e) => toggleSet(exIdx, setIdx, e)}
                    accentColor={theme.accent}
                    successColor={theme.success}
                    mutedColor={theme.textMuted}
                    surfaceColor={theme.surface}
                    borderColor={theme.borderMuted}
                  />

                  {ex.sets.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSetBtn}
                      onPress={() => removeWorkoutSet(exIdx, setIdx)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.addSetBtn}
              onPress={() => addWorkoutSet(exIdx)}
            >
              <Ionicons name="add" size={14} color={theme.accent} />
              <Text style={styles.addSetText}>AÑADIR SERIE</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View ref={rootRef} collapsable={false} style={styles.root}>
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
          {/* Header Dashboard */}
          <View style={styles.sessionHeader}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-down" size={24} color={theme.textMuted} />
              </TouchableOpacity>
              <View style={styles.timerBox}>
                <Ionicons name="time" size={16} color={theme.accent} />
                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={theme.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                <Text style={styles.finishBtnText}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.routineTitle}>{activeWorkout.routineName}</Text>
              <TouchableOpacity style={styles.sortBtn} onPress={sortByMuscleGroup}>
                <Ionicons name="body-outline" size={14} color={theme.accent} />
                <Text style={styles.sortBtnText} numberOfLines={1}>
                  ORDENAR POR MÚSCULO
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <DraggableFlatList
            data={activeWorkout.exercises}
            keyExtractor={(ex, idx) => `${ex.exerciseId}-${idx}`}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            onDragEnd={({ data }) => reorderWorkoutExercises(data)}
            renderItem={({
              item,
              getIndex,
              drag,
              isActive,
            }: RenderItemParams<WorkoutExercise>) => (
              <ScaleDecorator>
                <View style={isActive && styles.exerciseBlockDragging}>
                  {renderExerciseCard(item, getIndex() ?? 0, drag)}
                </View>
              </ScaleDecorator>
            )}
            ListFooterComponent={<View style={{ height: 120 + insets.bottom }} />}
          />

          {!keyboardVisible && (
            <CompletionTracker
              done={displayedDone}
              total={activeWorkout.exercises.length}
              setsDone={doneSets}
              setsTotal={totalSets}
              pulseKey={trackerPulse}
              badgeRef={trackerBadgeRef}
              onPress={() => {
                if (doneExercises === activeWorkout.exercises.length) handleFinish();
              }}
              theme={theme}
              bottomInset={insets.bottom}
            />
          )}

          {/* Info / Error Modal */}
          <Modal visible={!!infoAlert} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons
                    name={infoAlert?.isError ? "alert-circle-outline" : "information-circle-outline"}
                    size={32}
                    color={infoAlert?.isError ? theme.error : theme.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>{infoAlert?.title}</Text>
                <Text style={styles.modalSub}>{infoAlert?.message}</Text>

                <TouchableOpacity
                  style={styles.exitBtn}
                  onPress={() => setInfoAlert(null)}
                >
                  <Text style={styles.exitBtnText}>ENTENDIDO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Cancel Session Confirmation Modal */}
          <Modal visible={showCancelModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="warning-outline" size={32} color={theme.error} />
                </View>
                <Text style={styles.modalTitle}>¿Cancelar Sesión?</Text>
                <Text style={styles.modalSub}>
                  Perderás el progreso de este entrenamiento, incluyendo{" "}
                  {formatTime(elapsed)} y las series registradas.
                </Text>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowCancelModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>SEGUIR ENTRENANDO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.discardBtn}
                    onPress={confirmCancel}
                  >
                    <Text style={styles.discardBtnText}>DESCARTAR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Finish Confirmation Modal */}
          <Modal visible={showFinishModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons
                    name="flag-outline"
                    size={32}
                    color={theme.accent}
                  />
                </View>
                <Text style={styles.modalTitle}>¿Terminar Entrenamiento?</Text>
                <Text style={styles.modalSub}>
                  Confirma que has completado tu rutina para registrar tus
                  puntos y progreso.
                </Text>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {formatTime(elapsed)}
                    </Text>
                    <Text style={styles.summaryLabel}>TIEMPO</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {activeWorkout.exercises.reduce(
                        (acc, ex) =>
                          acc +
                          ex.sets.reduce((sx, s) => sx + s.weight * s.reps, 0),
                        0,
                      )}
                    </Text>
                    <Text style={styles.summaryLabel}>VOLUME (KG)</Text>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowFinishModal(false)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelBtnText}>CONTINUAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={confirmFinish}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={theme.gradients.accent}
                      style={styles.confirmGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.confirmBtnText}>SÍ, FINALIZAR</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Success Workout Modal */}
          <Modal visible={showSuccessModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.successCard}>
                <LinearGradient
                  colors={theme.gradients.accent}
                  style={styles.successGlow}
                />
                <View style={styles.successIconBox}>
                  <Ionicons name="trophy" size={50} color="#fff" />
                </View>
                <Text style={styles.successTitle}>¡Día Superado!</Text>
                <Text style={styles.successMsg}>
                  Tu esfuerzo ha sido registrado.{"\n"}Revisa tu historial en el
                  perfil.
                </Text>

                <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
                  <Text style={styles.exitBtnText}>CERRAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Exercise Info Modal */}
          <Modal visible={infoModalVisible} animationType="slide" transparent>
            <View style={styles.detailOverlay}>
              <View style={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Detalles del Ejercicio</Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                {selectedExDetails && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.detailImageContainer}>
                      {selectedExDetails.image_url ? (
                        <Image
                          source={{ uri: selectedExDetails.image_url }}
                          style={styles.detailImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.modalIconPlaceholder}>
                          <Ionicons
                            name="barbell"
                            size={60}
                            color={theme.accentDim}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.detailBody}>
                      <Text style={styles.detailExTitle}>
                        {selectedExDetails.name}
                      </Text>
                      <View style={styles.modalBadges}>
                        <View style={styles.modalBadge}>
                          <Text style={styles.modalBadgeText}>
                            {translateMuscle(selectedExDetails.muscle_group)}
                          </Text>
                        </View>
                        <View style={styles.modalBadge}>
                          <Text style={styles.modalBadgeText}>
                            {selectedExDetails.equipment}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                      <Text style={styles.detailDesc}>
                        {selectedExDetails.description ||
                          "No hay una descripción detallada para este ejercicio aún."}
                      </Text>

                      <TouchableOpacity
                        style={styles.viewProgressBtn}
                        onPress={() => {
                          setInfoModalVisible(false);
                          router.push({
                            pathname: "/exercise-progress",
                            params: { id: selectedExDetails.id },
                          });
                        }}
                      >
                        <LinearGradient
                          colors={theme.gradients.accent}
                          style={styles.progressGradient}
                        >
                          <Ionicons name="stats-chart" size={18} color="#fff" />
                          <Text style={styles.viewProgressText}>
                            VER PROGRESIÓN HISTÓRICA
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>

        {flyers.map((f) => (
          <FlyingChip
            key={f.key}
            flyer={f}
            successColor={theme.success}
            onArrive={() => handleFlyerArrive(f.key)}
          />
        ))}
      </View>
    </KeyboardAvoidingView>
    </GestureHandlerRootView>
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
    sessionHeader: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderColor: theme.borderSubtle,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    timerBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    timerText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    finishBtn: {
      backgroundColor: theme.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    finishBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    routineTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
      marginTop: 8,
      textTransform: "uppercase",
      flexShrink: 1,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.accentDim,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      flexShrink: 0,
    },
    sortBtnText: {
      fontSize: 10,
      fontWeight: "800",
      color: theme.accent,
      letterSpacing: 0.3,
    },
    scroll: {
      padding: 20,
    },
    exerciseBlock: {
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    exerciseBlockDone: {
      backgroundColor: theme.success + "10",
      borderColor: theme.success,
    },
    exerciseBlockDragging: {
      opacity: 0.85,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      gap: 10,
    },
    dragHandle: {
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginRight: 2,
      borderRadius: 8,
      backgroundColor: theme.surface,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.accent,
      textTransform: "uppercase",
    },
    exerciseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    muscleBadge: {
      backgroundColor: theme.accentDim,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    muscleBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.accent,
      textTransform: "capitalize",
    },
    exercisePr: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textMuted,
    },
    exerciseSummary: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textMuted,
    },
    setsTable: {
      gap: 4,
    },
    tableHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    tableLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.textMuted,
      textAlign: "center",
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: 12,
      gap: 10,
    },
    setRowCompleted: {
      backgroundColor: theme.success + "10",
    },
    setNumber: {
      width: 40,
      textAlign: "center",
      color: theme.textSecondary,
      fontWeight: "700",
      fontSize: 13,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: theme.surface,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    setInput: {
      flex: 1,
      color: theme.textPrimary,
      textAlign: "center",
      fontWeight: "700",
      fontSize: 15,
    },
    checkBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    checkBtnActive: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    addSetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      borderStyle: "dashed",
      gap: 6,
    },
    addSetText: {
      fontSize: 12,
      color: theme.accent,
      fontWeight: "800",
    },
    removeSetBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.error + "15",
      justifyContent: "center",
      alignItems: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContainer: {
      width: "100%",
      backgroundColor: theme.bgCard,
      borderRadius: 30,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    modalHeaderIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    modalSub: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    summaryBox: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      width: "100%",
      gap: 12,
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.accent,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.textMuted,
      marginTop: 4,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    cancelBtn: {
      flex: 1,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.textSecondary,
    },
    discardBtn: {
      flex: 2,
      height: 54,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.error,
    },
    discardBtnText: {
      fontSize: 14,
      fontWeight: "900",
      color: "#fff",
    },
    confirmBtn: {
      flex: 2,
      height: 54,
      borderRadius: 16,
      overflow: "hidden",
    },
    confirmGradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    confirmBtnText: {
      fontSize: 14,
      fontWeight: "900",
      color: "#fff",
    },
    successCard: {
      width: "100%",
      backgroundColor: theme.bgCard,
      borderRadius: 32,
      padding: 32,
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    successGlow: {
      position: "absolute",
      top: -100,
      width: 300,
      height: 300,
      opacity: 0.15,
      borderRadius: 150,
    },
    successIconBox: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
    },
    successTitle: {
      fontSize: 26,
      fontWeight: "900",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    successMsg: {
      fontSize: 15,
      color: theme.textSecondary,
      marginBottom: 24,
      textAlign: "center",
    },
    exitBtn: {
      width: "100%",
      height: 54,
      borderRadius: 16,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    exitBtnText: {
      fontSize: 14,
      fontWeight: "900",
      color: theme.textPrimary,
    },
    // ── Detail Info Modal Styles ──────────────────────────────────────────
    detailOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      justifyContent: "flex-end",
    },
    detailContent: {
      backgroundColor: theme.bgBase,
      height: "75%",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
    },
    detailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    detailImageContainer: {
      width: "100%",
      height: 220,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
    },
    detailImage: {
      width: "100%",
      height: "100%",
    },
    modalIconPlaceholder: {
      flex: 1,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    detailBody: {
      gap: 16,
    },
    detailExTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
      textTransform: "uppercase",
    },
    modalBadges: {
      flexDirection: "row",
      gap: 8,
    },
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
    descLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.textMuted,
      letterSpacing: 1,
    },
    detailDesc: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    viewProgressBtn: {
      marginTop: 24,
      height: 54,
      borderRadius: 16,
      overflow: "hidden",
    },
    progressGradient: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    viewProgressText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
  });

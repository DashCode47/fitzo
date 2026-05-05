
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import { WorkoutsAPI } from '@/api/workouts';
import { RoutinesAPI, Exercise } from '@/api/routines';

const MUSCLE_MAP: Record<string, string> = {
  'chest': 'Pecho',
  'back': 'Espalda',
  'legs': 'Piernas',
  'shoulders': 'Hombros',
  'arms': 'Brazos',
  'core': 'Core',
  'abs': 'Abdomen',
  'cardio': 'Cardio',
  'glutes': 'Glúteos',
  'forearms': 'Antebrazo',
  'full body': 'Cuerpo Completo'
};
import { StatusBar } from 'expo-status-bar';

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
  onPress: () => void;
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
            Animated.timing(pulse, { toValue: 1.55, duration: 900, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
          Animated.delay(400),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      pulse.setValue(1);
      glowOpacity.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [isActive, completed]);

  return (
    <View style={{ width: 40, height: 40 }}>
      {isActive && !completed && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: 40, height: 40,
            borderRadius: 10,
            backgroundColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: pulse }],
          }}
        />
      )}
      <TouchableOpacity
        style={{
          width: 40, height: 40,
          borderRadius: 10,
          backgroundColor: completed ? successColor : surfaceColor,
          borderWidth: 1,
          borderColor: completed ? successColor : borderColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onPress}
      >
        <Ionicons name="checkmark" size={18} color={completed ? '#fff' : mutedColor} />
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
          Animated.timing(glowOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.delay(200),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      glowOpacity.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [isEmpty]);

  return (
    <View style={[style, { position: 'relative' }]}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -1, left: -1, right: -1, bottom: -1,
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

export default function WorkoutSessionScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile, activeWorkout, updateWorkoutSet, addWorkoutSet, removeWorkoutSet, setActiveWorkout } = useAppStore();
  
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Info Modal states
  const [selectedExDetails, setSelectedExDetails] = useState<Exercise | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    if (!activeWorkout) {
      router.replace('/(tabs)/routines');
      return;
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, [activeWorkout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const translateMuscle = (muscle: string) => MUSCLE_MAP[muscle.toLowerCase()] || muscle;

  const showInfo = async (exerciseId: number) => {
    try {
        const data = await RoutinesAPI.getExercises();
        const found = data.find((e: any) => e.id === exerciseId);
        if (found) {
            setSelectedExDetails(found);
            setInfoModalVisible(true);
        }
    } catch (e) {
        console.error('[WorkoutSession] Failed to fetch exercise details:', e);
    }
  };

  const handleFinish = () => {
    if (!activeWorkout || !profile) return;
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    if (!activeWorkout || !profile) return;
    setShowFinishModal(false);
    
    try {
      setSubmitting(true);
      const totalVol = activeWorkout.exercises.reduce((acc, ex) => {
        return acc + ex.sets.reduce((sx, s) => sx + (s.weight * s.reps), 0);
      }, 0);

      const logData = {
        user_id: profile.id,
        routine_id: activeWorkout.routineId,
        started_at: activeWorkout.startTime,
        finished_at: new Date().toISOString(),
        duration_seconds: elapsed,
        total_volume: totalVol
      };

      const exerciseLogs = activeWorkout.exercises.map((ex, idx) => ({
        exercise_id: ex.exerciseId,
        sets_completed: ex.sets.filter(s => s.completed),
        order_index: idx
      }));

      await WorkoutsAPI.saveWorkoutSession(logData, exerciseLogs);
      setShowSuccessModal(true);
    } catch (e) {
        console.error('[WorkoutSession] Failed to save:', e);
        Alert.alert("Error", "No pudimos guardar tu sesión. Revisa tu conexión.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleExit = () => {
    setActiveWorkout(null);
    setShowSuccessModal(false);
    router.replace('/(tabs)/routines');
  };

  if (!activeWorkout) return null;

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

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
    >
      <View style={styles.root}>
        <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header Dashboard */}
          <View style={styles.sessionHeader}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
              <View style={styles.timerBox}>
                <Ionicons name="time" size={16} color={theme.accent} />
                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
              </View>
              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                <Text style={styles.finishBtnText}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.routineTitle}>{activeWorkout.routineName}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {activeWorkout.exercises.map((ex, exIdx) => (
              <View key={`${ex.exerciseId}-${exIdx}`} style={styles.exerciseBlock}>
                <View style={styles.exerciseHeader}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => showInfo(ex.exerciseId)}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => showInfo(ex.exerciseId)}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Sets List */}
                <View style={styles.setsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableLabel, { width: 40 }]}>SET</Text>
                    <Text style={[styles.tableLabel, { flex: 1 }]}>PESO (KG)</Text>
                    <Text style={[styles.tableLabel, { flex: 1 }]}>REPS</Text>
                    <View style={{ width: 40 }} />
                  </View>

                  {ex.sets.map((set, setIdx) => (
                    <View key={setIdx} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                      <Text style={styles.setNumber}>{set.set}</Text>

                      <GlowInputWrap
                        isEmpty={set.weight === 0}
                        accentColor="#FBBF24"
                        style={styles.inputWrap}
                      >
                        <TextInput
                          style={styles.setInput}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.textMuted}
                          value={set.weight > 0 ? set.weight.toString() : ''}
                          onChangeText={(val) => updateWorkoutSet(exIdx, setIdx, { weight: parseFloat(val) || 0 })}
                        />
                      </GlowInputWrap>

                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.setInput}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.textMuted}
                          value={set.reps > 0 ? set.reps.toString() : ''}
                          onChangeText={(val) => updateWorkoutSet(exIdx, setIdx, { reps: parseInt(val) || 0 })}
                        />
                      </View>

                      <GlowCheckBtn
                        completed={set.completed}
                        isActive={exIdx === activeGlowEx && setIdx === activeGlowSet && set.weight > 0}
                        onPress={() => updateWorkoutSet(exIdx, setIdx, { completed: !set.completed })}
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
                          <Ionicons name="close" size={14} color={theme.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.addSetBtn} onPress={() => addWorkoutSet(exIdx)}>
                    <Ionicons name="add" size={14} color={theme.accent} />
                    <Text style={styles.addSetText}>AÑADIR SERIE</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Finish Confirmation Modal */}
          <Modal visible={showFinishModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="flag-outline" size={32} color={theme.accent} />
                </View>
                <Text style={styles.modalTitle}>¿Terminar Entrenamiento?</Text>
                <Text style={styles.modalSub}>Confirma que has completado tu rutina para registrar tus puntos y progreso.</Text>
                
                <View style={styles.summaryBox}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{formatTime(elapsed)}</Text>
                        <Text style={styles.summaryLabel}>TIEMPO</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                            {activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sx, s) => sx + (s.weight * s.reps), 0), 0)}
                        </Text>
                        <Text style={styles.summaryLabel}>VOLUME (KG)</Text>
                    </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFinishModal(false)}>
                    <Text style={styles.cancelBtnText}>CONTINUAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={confirmFinish} disabled={submitting}>
                    <LinearGradient colors={theme.gradients.accent} style={styles.confirmGradient}>
                        <Text style={styles.confirmBtnText}>{submitting ? 'GUARDANDO...' : 'SÍ, FINALIZAR'}</Text>
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
                <LinearGradient colors={theme.gradients.accent} style={styles.successGlow} />
                <View style={styles.successIconBox}>
                    <Ionicons name="trophy" size={50} color="#fff" />
                </View>
                <Text style={styles.successTitle}>¡Día Superado!</Text>
                <Text style={styles.successMsg}>Tu esfuerzo ha sido registrado.{'\n'}Revisa tu historial en el perfil.</Text>

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
                        <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    
                    {selectedExDetails && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailImageContainer}>
                                {selectedExDetails.image_url ? (
                                    <Image source={{ uri: selectedExDetails.image_url }} style={styles.detailImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.modalIconPlaceholder}>
                                        <Ionicons name="barbell" size={60} color={theme.accentDim} />
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.detailBody}>
                                <Text style={styles.detailExTitle}>{selectedExDetails.name}</Text>
                                <View style={styles.modalBadges}>
                                    <View style={styles.modalBadge}>
                                        <Text style={styles.modalBadgeText}>{translateMuscle(selectedExDetails.muscle_group)}</Text>
                                    </View>
                                    <View style={styles.modalBadge}>
                                        <Text style={styles.modalBadgeText}>{selectedExDetails.equipment}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                                <Text style={styles.detailDesc}>
                                    {selectedExDetails.description || "No hay una descripción detallada para este ejercicio aún."}
                                </Text>

                                <TouchableOpacity 
                                    style={styles.viewProgressBtn}
                                    onPress={() => {
                                        setInfoModalVisible(false);
                                        router.push({
                                            pathname: '/exercise-progress',
                                            params: { id: selectedExDetails.id }
                                        });
                                    }}
                                >
                                    <LinearGradient colors={theme.gradients.accent} style={styles.progressGradient}>
                                        <Ionicons name="stats-chart" size={18} color="#fff" />
                                        <Text style={styles.viewProgressText}>VER PROGRESIÓN HISTÓRICA</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
          </Modal>

        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
  },
  sessionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: theme.borderSubtle,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  finishBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    marginTop: 8,
    textTransform: 'uppercase',
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.accent,
    textTransform: 'uppercase',
  },
  setsTable: {
    gap: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textMuted,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 10,
  },
  setRowCompleted: {
    backgroundColor: theme.success + '10',
  },
  setNumber: {
    width: 40,
    textAlign: 'center',
    color: theme.textSecondary,
    fontWeight: '700',
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
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderMuted,
  },
  checkBtnActive: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderMuted,
    borderStyle: 'dashed',
    gap: 6,
  },
  addSetText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '800',
  },
  removeSetBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.bgCard,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  modalHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.accent,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.textMuted,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  successCard: {
    width: '100%',
    backgroundColor: theme.bgCard,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  successGlow: {
    position: 'absolute',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  exitBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  // ── Detail Info Modal Styles ──────────────────────────────────────────
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  detailContent: {
    backgroundColor: theme.bgBase,
    height: '75%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  modalIconPlaceholder: {
    flex: 1,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    gap: 16,
  },
  detailExTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    textTransform: 'uppercase',
  },
  modalBadges: {
    flexDirection: 'row',
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
    fontWeight: '700',
    color: theme.accent,
    textTransform: 'capitalize',
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '800',
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
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  viewProgressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

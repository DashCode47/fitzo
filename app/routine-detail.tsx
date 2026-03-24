
import { Exercise, Routine, RoutinesAPI } from '@/api/routines';
import { theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { REPRESENTATIVE_EXERCISES } from '@/constants/ranks';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MUSCLE_MAP: Record<string, string> = {
  'chest': 'Pecho',
  'back': 'Espalda',
  'legs': 'Piernas',
  'shoulders': 'Hombros',
  'arms': 'Brazos',
  'abs': 'Abdomen',
  'cardio': 'Cardio',
  'glutes': 'Glúteos',
  'full body': 'Cuerpo Completo'
};

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { setActiveWorkout } = useAppStore();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const translateMuscle = (muscle: string) => MUSCLE_MAP[muscle.toLowerCase()] || muscle;

  useEffect(() => {
    if (id) loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    try {
      const data = await RoutinesAPI.getRoutineDetail(Number(id));
      setRoutine(data);
    } catch (e) {
      console.error('[RoutineDetailScreen] Failed to load routine:', e);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    if (!routine) return;

    // Transform routine into ActiveWorkout format for the store
    const activeWorkout = {
      routineId: routine.id,
      routineName: routine.name,
      startTime: new Date().toISOString(),
      exercises: routine.exercises?.map(re => ({
        exerciseId: re.exercise_id,
        name: re.exercise?.name || 'Ejercicio',
        sets: Array.from({ length: re.sets }).map((_, i) => ({
          set: i + 1,
          reps: parseInt(re.reps) || 10,
          weight: 0,
          completed: false,
        }))
      })) || []
    };

    setActiveWorkout(activeWorkout);
    router.push('/workout-session');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!routine) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      {/* Visual Header */}
      <View style={styles.visualHeader}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200' }}
          style={styles.headerImage}
        />
        <LinearGradient colors={['transparent', theme.bgDeep]} style={styles.headerGradient} />
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{routine.name}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{routine.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.description}>{routine.description || "Prepárate para superar tus límites hoy."}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={16} color={theme.accent} />
              <Text style={styles.metricLabel}>{routine.estimated_duration} min</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="fitness-outline" size={16} color={theme.accent} />
              <Text style={styles.metricLabel}>{routine.exercises?.length || 0} Ejercicios</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="flash-outline" size={16} color={theme.accent} />
              <Text style={styles.metricLabel}>{routine.goal}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>LISTA DE EJERCICIOS</Text>
          <Text style={styles.sectionSubtitle}>¡Supera tus récords en ejercicios con el tag RANKING para subir de rango!</Text>
        </View>
        {routine.exercises?.map((item, idx) => (
          <View key={item.id} style={styles.exerciseCard}>
            <View style={styles.exerciseDot} />
            <View style={styles.exerciseInfo}>
              {item.exercise?.name && Object.values(REPRESENTATIVE_EXERCISES).includes(item.exercise.name) && (
                <View style={[styles.rankBadge, { marginBottom: 4 }]}>
                  <Ionicons name="trophy" size={10} color={theme.accent} />
                  <Text style={styles.rankBadgeText}>RANKING</Text>
                </View>
              )}
              <Text style={styles.exerciseName}>{item.exercise?.name}</Text>
              <Text style={styles.exerciseMeta}>
                {item.sets} series × {item.reps} reps {item.suggested_weight ? `· ${item.suggested_weight}` : ''}
              </Text>
              {item.notes && <Text style={styles.exerciseNotes}>{item.notes}</Text>}
            </View>
            <TouchableOpacity
              style={styles.infoIcon}
              onPress={() => {
                setSelectedExercise(item.exercise || null);
                setDetailModalVisible(true);
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
          <LinearGradient colors={theme.gradients.accent} style={styles.startBtnGradient}>
            <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnText}>EMPEZAR ENTRENAMIENTO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Exercise Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedExercise && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalImageContainer}>
                  {selectedExercise.image_url ? (
                    <Image source={{ uri: selectedExercise.image_url }} style={styles.modalImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.modalIconPlaceholder}>
                      <Ionicons name="barbell" size={60} color={theme.accentDim} />
                    </View>
                  )}
                </View>

                <View style={styles.modalInfo}>
                  <Text style={styles.exerciseTitle}>{selectedExercise.name}</Text>
                  <View style={styles.modalBadges}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>{translateMuscle(selectedExercise.muscle_group)}</Text>
                    </View>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>{selectedExercise.equipment}</Text>
                    </View>
                  </View>

                  <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                  <Text style={styles.modalDesc}>
                    {selectedExercise.description || "No hay una descripción detallada para este ejercicio aún. Consulta a tu entrenador para la técnica correcta."}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualHeader: {
    height: 240,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 200, // Offset to sit 40px over the header image
  },
  infoBox: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  difficultyBadge: {
    backgroundColor: theme.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  difficultyText: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.borderSubtle,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: theme.textPrimary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 2,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: theme.accent, // More visible color
    marginTop: 4,
    fontWeight: '600',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginBottom: 12,
    gap: 14,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignSelf: 'flex-start',
  },
  rankBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: theme.accent,
  },
  exerciseMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  exerciseNotes: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoIcon: {
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(7, 7, 15, 0.9)',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  startBtnGradient: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── Modal Styles ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.bgBase,
    height: '80%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
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
  modalImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalIconPlaceholder: {
    flex: 1,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    gap: 16,
  },
  exerciseTitle: {
    fontSize: 24,
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
  modalDesc: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
});

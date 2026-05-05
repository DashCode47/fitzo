
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import { RoutinesAPI, Exercise, RoutineExercise, ROUTINE_DIFFICULTIES, ROUTINE_GOALS } from '@/api/routines';
import { StatusBar } from 'expo-status-bar';
import { REPRESENTATIVE_EXERCISES } from '@/constants/ranks';

const MUSCLE_MAP: Record<string, string> = {
  'chest': 'Pecho',
  'back': 'Espalda',
  'legs': 'Piernas',
  'shoulders': 'Hombros',
  'arms': 'Brazos',
  'abs': 'Abdomen',
  'cardio': 'Cardio',
  'glutes': 'Glúteos',
  'full body': 'Cuerpo Completo',
  'forearms': 'Antebrazos'
};

export default function RoutineCreateScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile } = useAppStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [goal, setGoal] = useState('hypertrophy');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  
  const [exercisesCatalog, setExercisesCatalog] = useState<Exercise[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogGroup, setCatalogGroup] = useState<string | null>(null);
  
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const data = await RoutinesAPI.getExercises();
      setExercisesCatalog(data);
    } catch (e) {
      console.error('[RoutineCreate] Failed to load catalog:', e);
    }
  };

  const muscleGroups = Array.from(new Set(exercisesCatalog.map(e => e.muscle_group).filter(Boolean)));

  const translateMuscle = (muscle: string) => MUSCLE_MAP[muscle.toLowerCase()] || muscle;

  const filteredCatalog = exercisesCatalog.filter(e => {
    const matchesGroup = !catalogGroup || e.muscle_group === catalogGroup;
    const matchesSearch = !catalogSearch || e.name.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const openCatalog = () => {
    setCatalogSearch('');
    setCatalogGroup(null);
    setShowCatalog(true);
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, {
      exercise_id: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: '10',
      rest_seconds: 90
    }]);
    setShowCatalog(false);
  };

  const removeExercise = (idx: number) => {
    const newList = [...selectedExercises];
    newList.splice(idx, 1);
    setSelectedExercises(newList);
  };

  const handleSave = async () => {
    if (!name || selectedExercises.length === 0 || !profile) return;
    
    try {
      setLoading(true);
      const routineData = {
        name,
        description,
        difficulty,
        goal,
        created_by: profile.id,
        is_template: false
      };
      
      // Clean data: remove the 'exercise' object that was used for UI display
      const cleanedExercises = selectedExercises.map(({ exercise, ...rest }) => rest);
      
      await RoutinesAPI.createRoutine(routineData, cleanedExercises);
      router.replace('/(tabs)/routines');
    } catch (e) {
      console.error('[RoutineCreate] Failed to save:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Rutina</Text>
            <TouchableOpacity 
                onPress={handleSave} 
                disabled={loading || !name || selectedExercises.length === 0}
            >
                <Text style={[
                    styles.saveBtn, 
                    (loading || !name || selectedExercises.length === 0) && { opacity: 0.4 }
                ]}>GUARDAR</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
                  style={[styles.selectChip, difficulty === key && styles.selectChipActive]}
                  onPress={() => setDifficulty(key)}
                >
                  <Text style={[styles.selectChipText, difficulty === key && styles.selectChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={styles.label}>OBJETIVO PRINCIPAL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {Object.entries(ROUTINE_GOALS).map(([key, label]) => (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.selectChip, goal === key && styles.selectChipActive]}
                  onPress={() => setGoal(key)}
                >
                  <Text style={[styles.selectChipText, goal === key && styles.selectChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EJERCICIOS ({selectedExercises.length})</Text>
            <TouchableOpacity
                style={styles.addExBtn}
                onPress={openCatalog}
            >
              <Ionicons name="add-circle" size={20} color={theme.accent} />
              <Text style={styles.addExText}>AÑADIR</Text>
            </TouchableOpacity>
          </View>

          {selectedExercises.map((item, idx) => (
            <View key={idx} style={styles.exerciseItem}>
              <View style={styles.exerciseMain}>
                <View style={styles.exerciseAvatar}>
                  {item.exercise.image_url ? (
                    <Image source={{ uri: item.exercise.image_url }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Ionicons name="fitness" size={20} color={theme.accent} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.sets} series · {item.reps} reps</Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(idx)}>
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Exercises Catalog Modal */}
      <Modal visible={showCatalog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>Ejercicios</Text>
                        <Text style={styles.modalSub}>¡Supera tus récords en ejercicios con el tag RANKING para subir de rango!</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowCatalog(false)}>
                        <Ionicons name="close" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={16} color={theme.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar ejercicio..."
                        placeholderTextColor={theme.textMuted}
                        value={catalogSearch}
                        onChangeText={setCatalogSearch}
                        returnKeyType="search"
                    />
                    {catalogSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setCatalogSearch('')}>
                            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Muscle group chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipsScroll}
                    contentContainerStyle={styles.chipsRow}
                >
                    <TouchableOpacity
                        style={[styles.chip, !catalogGroup && styles.chipActive]}
                        onPress={() => setCatalogGroup(null)}
                    >
                        <Text style={[styles.chipText, !catalogGroup && styles.chipTextActive]}>Todos</Text>
                    </TouchableOpacity>
                    {muscleGroups.map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.chip, catalogGroup === g && styles.chipActive]}
                            onPress={() => setCatalogGroup(catalogGroup === g ? null : g)}
                        >
                            <Text style={[styles.chipText, catalogGroup === g && styles.chipTextActive]}>
                                {translateMuscle(g)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <FlatList
                    style={{ flex: 1 }}
                    data={filteredCatalog}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Ionicons name="search-outline" size={32} color={theme.textMuted} />
                            <Text style={styles.emptyText}>Sin resultados</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.catalogItem}>
                            <View style={styles.catalogLeft}>
                                <View style={styles.catalogAvatar}>
                                  {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.avatarImage} contentFit="cover" />
                                  ) : (
                                    <Ionicons name="fitness" size={18} color={theme.accent} />
                                  )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    {Object.values(REPRESENTATIVE_EXERCISES).includes(item.name) && (
                                      <View style={[styles.rankBadge, { marginBottom: 4 }]}>
                                        <Ionicons name="trophy" size={10} color={theme.accent} />
                                        <Text style={styles.rankBadgeText}>RANKING</Text>
                                      </View>
                                    )}
                                    <Text style={styles.catalogName}>{item.name}</Text>
                                    <Text style={styles.catalogMeta}>{translateMuscle(item.muscle_group)} · {item.equipment}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.catalogActions}>
                                <TouchableOpacity 
                                    style={styles.catalogActionBtn}
                                    onPress={() => {
                                        setPreviewExercise(item);
                                        setShowPreview(true);
                                    }}
                                >
                                    <Ionicons name="information-circle-outline" size={24} color={theme.textMuted} />
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.catalogActionBtn, { backgroundColor: theme.accentDim }]}
                                    onPress={() => addExercise(item)}
                                >
                                    <Ionicons name="add" size={20} color={theme.accent} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />

                {/* Exercise Preview Overlay (Inside Catalog for stability) */}
                {showPreview && previewExercise && (
                    <View style={styles.previewContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Vista Previa</Text>
                            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closePreviewBtn}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.previewImageContainer}>
                                {previewExercise.image_url ? (
                                    <Image source={{ uri: previewExercise.image_url }} style={styles.previewImage} contentFit="cover" />
                                ) : (
                                    <View style={styles.modalIconPlaceholder}>
                                        <Ionicons name="barbell" size={60} color={theme.accentDim} />
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.previewBody}>
                                <Text style={styles.previewExTitle}>{previewExercise.name}</Text>
                                <View style={styles.modalBadges}>
                                    <View style={styles.modalBadge}>
                                        <Text style={styles.modalBadgeText}>{translateMuscle(previewExercise.muscle_group)}</Text>
                                    </View>
                                    <View style={styles.modalBadge}>
                                        <Text style={styles.modalBadgeText}>{previewExercise.equipment}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                                <Text style={styles.previewDesc}>
                                    {previewExercise.description || "No hay una descripción detallada para este ejercicio aún."}
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  saveBtn: {
    color: theme.accent,
    fontWeight: '900',
    fontSize: 14,
  },
  scroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
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
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  addExText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '800',
  },
  exerciseItem: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  exerciseMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  exerciseMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  modalSub: {
    fontSize: 10,
    color: theme.accent,
    marginTop: 4,
    fontWeight: '600',
  },
  catalogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.borderSubtle,
  },
  catalogName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  catalogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catalogAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  catalogMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'capitalize',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.borderMuted,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipsScroll: {
    flexShrink: 0,
    flexGrow: 0,
    height: 36,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    color: theme.textSecondary,
  },
  chipTextActive: {
    color: theme.accent,
  },
  emptyList: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.bgBase,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    zIndex: 10,
  },
  closePreviewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  modalIconPlaceholder: {
    flex: 1,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBody: {
    gap: 16,
  },
  previewExTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
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
  previewDesc: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
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
    fontWeight: '700',
    color: theme.textSecondary,
  },
  selectChipTextActive: {
    color: theme.accent,
  },
});

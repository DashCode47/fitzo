
import { NutritionAPI, UserStats } from '@/api/nutrition';
import { CustomModal } from '@/components/ui/CustomModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';
import { calculateCalories } from '@/utils/nutritionCalc';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';
const DARK_BG = '#000';
const CARD_BG = '#1A1A1A';

import { useAppStore } from '@/store/useAppStore';

export default function NutritionScreen() {
  const { 
    profile, 
    activeDiet: diet, setActiveDiet: setDiet, 
    userStats: stats, setUserStats: setStats,
    isHydrated 
  } = useAppStore();

  const [loading, setLoading] = useState(!isHydrated || (!stats && !diet));
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [weight, setWeight] = useState(stats?.weight?.toString() || '');
  const [height, setHeight] = useState(stats?.height?.toString() || '');
  const [age, setAge] = useState(stats?.age?.toString() || '');
  const [gender, setGender] = useState<'M' | 'F'>(stats?.gender || 'M');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'moderate' | 'active'>(stats?.activity_level || 'moderate');
  const [goal, setGoal] = useState<'cut' | 'bulk' | 'maintain'>(stats?.goal || 'maintain');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });

  // Selected options state: { [mealIndex]: optionIndex }
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!isHydrated) setLoading(true);
      
      const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 5000)) as any;
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const [newStats, newDiet] = await Promise.all([
        NutritionAPI.getUserStats(session.user.id).catch(() => stats),
        NutritionAPI.getActiveDiet(session.user.id).catch(() => diet),
      ]);

      // Auto-assign: If stats exist but no diet is assigned yet, match them now.
      let finalDiet = newDiet;
      if (newStats && !newDiet) {
        const calcResult = calculateCalories(
          newStats.weight,
          newStats.height,
          newStats.age,
          newStats.gender,
          newStats.activity_level,
          newStats.goal
        );
        await withTimeout(NutritionAPI.assignBestDietPlan(session.user.id, calcResult.calories));
        finalDiet = await withTimeout(NutritionAPI.getActiveDiet(session.user.id));
      }

      if (newStats) {
        setStats(newStats);
        setWeight(newStats.weight.toString());
        setHeight(newStats.height.toString());
        setAge(newStats.age.toString());
        setGender(newStats.gender);
        setActivityLevel(newStats.activity_level);
        setGoal(newStats.goal);
      }
      if (finalDiet) setDiet(finalDiet);

    } catch (error) {
      console.error('[NutritionScreen] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async () => {
    const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 5000)) as any;
    if (!session?.user) return;

    if (!weight || !height || !age) {
      setModalConfig({
        title: 'CAMPOS INCOMPLETOS',
        message: 'Por favor completa todos los campos para calcular tu plan.',
        type: 'error'
      });
      setModalVisible(true);
      return;
    }

    try {
      setSubmitting(true);
      const weightNum = parseFloat(weight);
      const heightInCm = parseFloat(height);
      const ageNum = parseInt(age);

      const calcResult = calculateCalories(
        weightNum,
        heightInCm,
        ageNum,
        gender,
        activityLevel,
        goal
      );

      const newStats: UserStats = {
        user_id: session.user.id,
        weight: weightNum,
        height: heightInCm,
        age: ageNum,
        gender,
        activity_level: activityLevel,
        goal: calcResult.finalGoal,
        allergies: []
      };

      const savedStats = await withTimeout(NutritionAPI.saveUserStats(newStats));
      setStats(savedStats);

      // 2. Automated Matching Logic
      await withTimeout(NutritionAPI.assignBestDietPlan(session.user.id, calcResult.calories));
      
      // 3. Reload Diet
      const activeDiet = await withTimeout(NutritionAPI.getActiveDiet(session.user.id));
      setDiet(activeDiet);

      let successMessage = 'Tus datos se han guardado y hemos asignado el mejor plan para tu meta.';
      if (calcResult.isOverridden) {
        successMessage = 'Basado en tu índice de masa corporal actual, recomendamos priorizar la pérdida de grasa antes de iniciar una etapa de volumen muscular. Hemos ajustado tu plan para mejorar tu salud.';
      }

      setModalConfig({
        title: calcResult.isOverridden ? 'Sugerencia de Salud' : '¡PLAN ACTUALIZADO!',
        message: successMessage,
        type: 'success'
      });
      setModalVisible(true);
    } catch (error: any) {
      setModalConfig({
        title: 'ERROR AL GUARDAR',
        message: error.message || 'No pudimos guardar tus datos físicos. Inténtalo de nuevo.',
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD_COLOR} />
      </View>
    );
  }

  const renderOnboarding = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración Nutricional</Text>
      <Text style={styles.subtitle}>Cuéntanos un poco sobre ti para calcular tu plan ideal.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 75"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Altura (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 175"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Edad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 25"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Género</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.chip, gender === 'M' && styles.activeChip]} 
            onPress={() => setGender('M')}
          >
            <Text style={[styles.chipText, gender === 'M' && styles.activeChipText]}>Hombre</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chip, gender === 'F' && styles.activeChip]} 
            onPress={() => setGender('F')}
          >
            <Text style={[styles.chipText, gender === 'F' && styles.activeChipText]}>Mujer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nivel de Actividad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['sedentary', 'moderate', 'active'].map((level) => (
            <TouchableOpacity 
              key={level}
              style={[styles.chip, activityLevel === level && styles.activeChip]} 
              onPress={() => setActivityLevel(level as any)}
            >
              <Text style={[styles.chipText, activityLevel === level && styles.activeChipText]}>
                {level === 'sedentary' ? 'Sedentario' : level === 'moderate' ? 'Moderado' : 'Activo'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Objetivo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['cut', 'maintain', 'bulk'].map((g) => (
            <TouchableOpacity 
              key={g}
              style={[styles.chip, goal === g && styles.activeChip]} 
              onPress={() => setGoal(g as any)}
            >
              <Text style={[styles.chipText, goal === g && styles.activeChipText]}>
                {g === 'cut' ? 'Perder Grasa' : g === 'maintain' ? 'Mantenimiento' : 'Ganar Músculo'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveStats} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={DARK_BG} />
        ) : (
          <Text style={styles.saveButtonText}>Calcular Plan</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDashboard = () => {
    const calcResult = calculateCalories(
      stats!.weight,
      stats!.height,
      stats!.age,
      stats!.gender,
      stats!.activity_level,
      stats!.goal
    );

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu Plan Nutricional</Text>
          <TouchableOpacity onPress={() => setStats(null)}>
            <Text style={styles.editLink}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[GOLD_COLOR, '#8B733D']} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Calorías Diarias Objetivas</Text>
              <Text style={styles.caloriesText}>{calcResult.calories} kcal</Text>
            </View>
            <TouchableOpacity style={styles.miniUpdateButton} onPress={() => setStats(null)}>
              <IconSymbol name="fitness.fill" size={20} color={GOLD_COLOR} />
              <Text style={styles.miniUpdateText}>ACTUALIZAR</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryDesc}>
            Basado en tu objetivo de {stats?.goal === 'cut' ? 'perder grasa' : stats?.goal === 'bulk' ? 'ganar músculo' : 'mantenimiento'}.
          </Text>
        </LinearGradient>

        {calcResult.isOverridden && (
          <View style={styles.warningCard}>
            <IconSymbol name="fitness.fill" size={24} color={GOLD_COLOR} />
            <Text style={styles.warningText}>
              Hemos ajustado tu objetivo a pérdida de grasa para priorizar tu salud debido a tu índice de masa corporal.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Dieta Asignada</Text>
          {diet ? (
            <View>
              <View style={styles.dietInfoCard}>
                <Text style={styles.dietName}>{diet.name}</Text>
                <View style={styles.macrosRow}>
                  <View style={styles.macroBadge}>
                    <Text style={styles.macroValue}>{diet.macros?.protein || '-'}</Text>
                    <Text style={styles.macroLabel}>Prot</Text>
                  </View>
                  <View style={styles.macroBadge}>
                    <Text style={styles.macroValue}>{diet.macros?.carbs || '-'}</Text>
                    <Text style={styles.macroLabel}>Carb</Text>
                  </View>
                  <View style={styles.macroBadge}>
                    <Text style={styles.macroValue}>{diet.macros?.fats || '-'}</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {(!diet.meals || diet.meals.length === 0) ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Esta dieta no tiene comidas definidas aún.</Text>
                </View>
              ) : (
                diet.meals.map((meal, idx) => {
                  const selectedIdx = selectedOptions[idx] || 0;
                  const currentOption = meal.options?.[selectedIdx];

                  return (
                    <View key={idx} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <View>
                          <Text style={styles.mealTitle}>{meal.title}</Text>
                          {meal.time && <Text style={styles.mealTime}>{meal.time}</Text>}
                        </View>
                        
                        {meal.options?.length > 1 && (
                          <View style={styles.optionsBadge}>
                            <Text style={styles.optionsBadgeText}>
                              {meal.options.length} OPCIONES
                            </Text>
                          </View>
                        )}
                      </View>

                      {meal.options?.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                          {meal.options.map((opt, optIdx) => (
                            <TouchableOpacity 
                              key={optIdx}
                              style={[styles.optionChip, selectedIdx === optIdx && styles.activeOptionChip]}
                              onPress={() => setSelectedOptions(prev => ({ ...prev, [idx]: optIdx }))}
                            >
                              <Text style={[styles.optionChipText, selectedIdx === optIdx && styles.activeOptionChipText]}>
                                {opt.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}

                      {currentOption ? (
                        <View style={styles.optionContainer}>
                          <Text style={styles.optionName}>{currentOption.name}</Text>
                          {currentOption.foods?.map((food, foodIdx) => (
                            <Text key={foodIdx} style={styles.foodItem}>• {food}</Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyText}>No hay ingredientes en esta opción.</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol name="fitness.fill" size={48} color="#444" />
              <Text style={styles.emptyText}>Tu entrenador aún no ha asignado un plan específico.</Text>
              <Text style={styles.emptySubtext}>Sigue tus calorías mientras tanto.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomModal 
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
      />
      {!stats ? renderOnboarding() : renderDashboard()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: GOLD_COLOR,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 30,
  },
  editLink: {
    color: GOLD_COLOR,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCC',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 15,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeChip: {
    backgroundColor: GOLD_COLOR,
    borderColor: GOLD_COLOR,
  },
  chipText: {
    color: '#888',
    fontWeight: '600',
  },
  activeChipText: {
    color: DARK_BG,
  },
  saveButton: {
    backgroundColor: GOLD_COLOR,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: DARK_BG,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryCard: {
    padding: 25,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 5,
    shadowColor: GOLD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  miniUpdateButton: {
    backgroundColor: DARK_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniUpdateText: {
    color: GOLD_COLOR,
    fontSize: 10,
    fontWeight: '900',
  },
  summaryLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  caloriesText: {
    fontSize: 42,
    fontWeight: '900',
    color: DARK_BG,
    marginBottom: 10,
  },
  summaryDesc: {
    color: 'rgba(0,0,0,0.8)',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 5,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 15,
  },
  dietName: {
    fontSize: 18,
    color: GOLD_COLOR,
    marginBottom: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mealCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: GOLD_COLOR,
    textTransform: 'uppercase',
  },
  mealTime: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  optionsBadge: {
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 163, 86, 0.3)',
  },
  optionsBadgeText: {
    color: GOLD_COLOR,
    fontSize: 10,
    fontWeight: '900',
  },
  optionsScroll: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  optionChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeOptionChip: {
    borderColor: GOLD_COLOR,
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
  },
  optionChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  activeOptionChipText: {
    color: GOLD_COLOR,
  },
  optionContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    borderRadius: 15,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 10,
  },
  foodItem: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 2,
    paddingLeft: 10,
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#444',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
  },
  dietInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  macroBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  macroValue: {
    color: GOLD_COLOR,
    fontSize: 16,
    fontWeight: '800',
  },
  macroLabel: {
    color: '#666',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  warningCard: {
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(197, 163, 86, 0.3)',
  },
  warningText: {
    color: GOLD_COLOR,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
});


import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { RanksAPI, calculateAllRanks } from '@/api/ranks';
import { GeneralRankBadge } from './GeneralRankBadge';
import { MuscleRankCard } from './MuscleRankCard';

import { theme } from '@/constants/theme';

import { Ionicons } from '@expo/vector-icons';

export const RanksView: React.FC = () => {
  const { profile, userStats, muscleRanks, setMuscleRanks } = useAppStore();
  const [loading, setLoading] = useState(!muscleRanks);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanks = async () => {
    if (!profile?.id || !userStats?.weight) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const maxWeights = await RanksAPI.getUserMaxWeights(profile.id);
      const ranks = calculateAllRanks(
        maxWeights, 
        userStats.weight, 
        (userStats.gender as any) || 'M'
      );
      setMuscleRanks(ranks);
    } catch (e) {
      console.error('[RanksView] fetchRanks failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, [profile?.id, userStats?.weight]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanks();
  };

  if (!userStats?.weight) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="barbell-outline" size={64} color="#333333" />
        <Text style={styles.emptyTitle}>Configura tu peso</Text>
        <Text style={styles.emptySubtitle}>
          Necesitamos conocer tu peso corporal para calcular tus rangos de fuerza relativos.
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Ir a Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !muscleRanks) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Calculando tu nivel de fuerza...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
    >
      {muscleRanks && (
        <>
          <GeneralRankBadge 
            tierIndex={muscleRanks.generalTierIndex} 
            avgIndex={muscleRanks.avgIndex}
            muscleCount={muscleRanks.muscleRanks.length}
          />

          <View style={styles.howToBox}>
            <View style={styles.howToHeader}>
              <Ionicons name="trending-up" size={18} color={theme.accent} />
              <Text style={styles.howToTitle}>¿CÓMO SUBIR DE NIVEL?</Text>
            </View>
            <Text style={styles.howToText}>
              Tu rango se basa en tu <Text style={{fontWeight:'700', color: '#fff'}}>fuerza relativa</Text>: el peso que levantas dividido por tu propio peso corporal (Ratio).
              {'\n\n'}¡Aumenta el peso en los ejercicios con el tag <Text style={{fontWeight:'700', color: theme.accent}}>RANKING</Text> para progresar!
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Grupos Musculares</Text>
          {muscleRanks.muscleRanks.map((rank) => (
            <MuscleRankCard key={rank.muscleGroup} rank={rank} bodyWeight={userStats?.weight || 0} />
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
            <Text style={styles.infoText}>
              Solo los ejercicios marcados con el sello <Text style={{color: theme.accent, fontWeight:'800'}}>RANKING</Text> en el catálogo actualizan estos niveles.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bgDeep,
  },
  loadingText: {
    marginTop: 16,
    color: theme.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000000',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 16,
  },
  howToBox: {
    backgroundColor: theme.bgCard,
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  howToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  howToTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  howToText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.bgCard,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});

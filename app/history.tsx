
import { WorkoutsAPI } from '@/api/workouts';
import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;

export default function WorkoutsHistoryScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile } = useAppStore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Modal states
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    if (profile?.id) loadInitial();
  }, [profile?.id]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const data = await WorkoutsAPI.getWorkoutLogs(profile!.id!, PAGE_SIZE, 0);
      setLogs(data);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(data.length);
    } catch (e) {
      console.error('[HistoryScreen] Failed to load initial:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !profile?.id) return;
    try {
      setLoadingMore(true);
      const data = await WorkoutsAPI.getWorkoutLogs(profile.id, PAGE_SIZE, offset);
      setLogs(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(prev => prev + data.length);
    } catch (e) {
      console.error('[HistoryScreen] Failed to load more:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleWorkoutPress = async (log: any) => {
    setSelectedWorkout(log);
    setDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const data = await WorkoutsAPI.getWorkoutDetails(log.id);
      setWorkoutExercises(data);
    } catch (e) {
      console.error('[HistoryScreen] Error loading details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExercisePress = (exerciseId: number) => {
    setDetailsModalVisible(false);
    router.push({
      pathname: '/exercise-progress',
      params: { id: exerciseId }
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.logCard} 
      onPress={() => handleWorkoutPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.logDateContainer}>
        <Text style={styles.logDay}>{new Date(item.started_at).getDate()}</Text>
        <Text style={styles.logMonth}>
          {new Date(item.started_at).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
        </Text>
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.logTitle}>{item.routine?.name || 'Sesión Personalizada'}</Text>
        <Text style={styles.logTime}>
          <Ionicons name="time-outline" size={12} color={theme.textMuted} /> {Math.round(item.duration_seconds / 60)} min
        </Text>
      </View>
      <View style={styles.logVolume}>
        <Text style={styles.volVal}>{item.total_volume}</Text>
        <Text style={styles.volLabel}>KG</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.borderMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tu Historial</Text>
            <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.empty}>
                <Ionicons name="barbell-outline" size={48} color={theme.textMuted} />
                <Text style={styles.emptyText}>No hay entrenamientos registrados.</Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={theme.accent} style={{ padding: 20 }} /> : <View style={{ height: 40 }} />
          }
          refreshing={loading}
          onRefresh={loadInitial}
        />
      </SafeAreaView>

      {/* Detail Modal Reused from Profile */}
      <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.detailsModalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.detailsModalHeader}>
                <View>
                  <Text style={styles.detailsModalTitle}>
                    {selectedWorkout?.routine?.name || 'Sesión Personalizada'}
                  </Text>
                  <Text style={styles.detailsModalSubtitle}>
                    {selectedWorkout && new Date(selectedWorkout.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.detailsCloseBtn}>
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator color={theme.accent} size="large" />
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailsStatsRow}>
                    <View style={styles.detailsStat}>
                      <Text style={styles.detailsStatVal}>{Math.round((selectedWorkout?.duration_seconds || 0) / 60)}m</Text>
                      <Text style={styles.detailsStatLabel}>TIEMPO</Text>
                    </View>
                    <View style={styles.detailsStat}>
                      <Text style={styles.detailsStatVal}>{selectedWorkout?.total_volume}kg</Text>
                      <Text style={styles.detailsStatLabel}>VOLUMEN</Text>
                    </View>
                  </View>

                  <Text style={styles.detailsSectionTitle}>EJERCICIOS REALIZADOS</Text>
                  {workoutExercises.map((exLog, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.detailsExItem}
                      onPress={() => handleExercisePress(exLog.exercise_id)}
                    >
                      <View style={styles.detailsExHeader}>
                        <Text style={styles.detailsExName}>{exLog.exercise?.name}</Text>
                        <Ionicons name="stats-chart" size={14} color={theme.accent} />
                      </View>
                      <View style={styles.detailsSetsRow}>
                        {(exLog.sets_completed || []).map((s: any, sIdx: number) => (
                          <View key={sIdx} style={styles.detailsSetBadge}>
                            <Text style={styles.detailsSetText}>{s.weight}kg x {s.reps}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 40 }} />
                </ScrollView>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  list: {
    padding: 20,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  logDateContainer: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 45,
  },
  logDay: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.accent,
  },
  logMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
  },
  logInfo: {
    flex: 1,
    gap: 2,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  logTime: {
    fontSize: 12,
    color: theme.textMuted,
  },
  logVolume: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  volVal: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  volLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 16,
  },

  // Modal Styles
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: theme.bgBase,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '85%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.textPrimary,
    textTransform: 'uppercase',
  },
  detailsModalSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  detailsCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsStatsRow: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  detailsStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailsStatVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.accent,
  },
  detailsStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.textMuted,
    marginTop: 4,
  },
  detailsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 8,
  },
  detailsExItem: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  detailsExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsExName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  detailsSetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailsSetBadge: {
    backgroundColor: theme.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  detailsSetText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '700',
  },
});

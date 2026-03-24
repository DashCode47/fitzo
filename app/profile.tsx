
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { WorkoutsAPI } from '@/api/workouts';
import { CustomModal } from '@/components/ui/CustomModal';
import { theme, ThemeMode, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useProfileImage } from '@/hooks/useProfileImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { MUSCLE_GROUPS, RANK_TIERS } from '@/constants/ranks';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'expo-router';


export default function ProfileScreen() {
  const router = useRouter();
  const { goToLogin, goBack } = useAppNavigation();

  const {
    profile,
    setProfile,
    clearAll,
    isHydrated,
    workoutLogs,
    hasMoreLogs,
    logsOffset,
    appendWorkoutLogs,
    resetWorkoutLogs,
    muscleRanks,
    themeMode,
    setThemeMode
  } = useAppStore();

  const theme = useAppTheme();
  const styles = createStyles(theme);
  const detailsModalStyles = createDetailsModalStyles(theme);

  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [loading, setLoading] = useState(!profile);
  const { uploadAvatar, uploading } = useProfileImage();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'confirm',
    onConfirm: () => { },
  });

  const [loadingHistory, setLoadingHistory] = useState(false);
  const LIMIT = 3;

  useEffect(() => {
    if (isHydrated && profile?.id) {
      loadProfile();
      loadHistory(true);
    }
  }, [isHydrated, profile?.id]);

  const loadHistory = async (reset = false) => {
    if (!profile?.id || loadingHistory) return;
    try {
      setLoadingHistory(true);
      const currentOffset = reset ? 0 : logsOffset;
      if (reset) resetWorkoutLogs();

      const data = await WorkoutsAPI.getWorkoutLogs(profile.id, LIMIT, currentOffset);

      appendWorkoutLogs(data, data.length === LIMIT);
    } catch (e) {
      console.error('[ProfileScreen] Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadWorkoutDetails = async (log: any) => {
    try {
      setSelectedWorkout(log);
      setDetailsModalVisible(true);
      setLoadingDetails(true);
      const data = await WorkoutsAPI.getWorkoutDetails(log.id);
      setWorkoutExercises(data);
    } catch (e) {
      console.error('[ProfileScreen] Failed to load details:', e);
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

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await UserAPI.getProfile();
      if (data) setProfile(data);
    } catch (e: any) {
      console.error('[ProfileScreen] Profile load failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setModalConfig({
      title: 'Cerrar sesión',
      message: '¿Estás seguro que deseas salir de tu cuenta?',
      type: 'confirm',
      onConfirm: async () => {
        setModalVisible(false);
        try {
          await AuthAPI.logout();
          clearAll();
          goToLogin();
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    });
    setModalVisible(true);
  };

  const handleUpdateAvatar = async () => {
    const url = await uploadAvatar();
    if (url) setAvatarTimestamp(Date.now());
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const username = profile?.username || 'Atleta';
  const email = profile?.email || '–';
  const phone = profile?.phone || 'No registrado';
  const role = profile?.role || 'CLIENT';
  const points = profile?.total_points || 0;
  const photoUrl = profile?.photo_url ? `${profile.photo_url}?t=${avatarTimestamp}` : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Avatar section ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{username[0]?.toUpperCase()}</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={theme.accent} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handleUpdateAvatar}
                disabled={uploading}
              >
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.username}>{username}</Text>

            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role}</Text>
            </View>

            {/* Points badge */}
            <View style={styles.pointsBadge}>
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.pointsText}>{points.toLocaleString()} pts</Text>
            </View>
          </View>

          {/* ── Info card ── */}
          <View style={styles.card}>
            <InfoRow icon="mail-outline" label="Correo" value={email} theme={theme} styles={styles} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" label="Teléfono" value={phone} theme={theme} styles={styles} />
          </View>

          {/* ── My Ranks Section ── */}
          {muscleRanks && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Rangos</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/rankings', params: { view: 'ranks' } })}>
                  <Text style={styles.viewMoreRanks}>VER TODOS</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ranksScroll}
              >
                {muscleRanks.muscleRanks.map((rank) => {
                  const muscle = MUSCLE_GROUPS.find(m => m.key === rank.muscleGroup);
                  const tier = RANK_TIERS[rank.tierIndex];
                  return (
                    <TouchableOpacity
                      key={rank.muscleGroup}
                      style={styles.miniRankCard}
                      onPress={() => router.push({ pathname: '/(tabs)/rankings', params: { view: 'ranks' } })}
                    >
                      <Ionicons name={muscle?.icon as any} size={16} color={theme.accent} />
                      <Text style={styles.miniRankMuscle} numberOfLines={1}>{muscle?.label}</Text>
                      <View style={[styles.miniTierBadge, { backgroundColor: tier.color + '20' }]}>
                        <Text style={[styles.miniTierText, { color: tier.color }]}>{tier.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── Theme Selection ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Apariencia</Text>
            <Ionicons name="color-palette-outline" size={16} color={theme.textMuted} />
          </View>

          <View style={styles.themeSelector}>
            <ThemeOption 
              label="Original" 
              isActive={themeMode === 'dark'} 
              color="#6C63FF" 
              onPress={() => setThemeMode('dark')} 
              theme={theme}
              styles={styles}
            />
            <ThemeOption 
              label="Claro" 
              isActive={themeMode === 'light'} 
              color="#F4F4F5" 
              onPress={() => setThemeMode('light')} 
              theme={theme}
              styles={styles}
            />
            <ThemeOption 
              label="Cyan" 
              isActive={themeMode === 'cyan'} 
              color="#4CD6C8" 
              onPress={() => setThemeMode('cyan')} 
              theme={theme}
              styles={styles}
            />
          </View>

          {/* ── Workout History ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de Entrenamiento</Text>
            <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
          </View>

          {(!workoutLogs || workoutLogs.length === 0) && !loadingHistory ? (
            <View style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
              <Text style={styles.emptyText}>Aún no has registrado entrenamientos.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {(workoutLogs || []).map((log) => (
                <TouchableOpacity 
                  key={log.id} 
                  style={styles.historyItem}
                  onPress={() => loadWorkoutDetails(log)}
                >
                  <View style={styles.historyIcon}>
                    <Ionicons name="barbell" size={18} color={theme.accent} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyName}>{log.routine?.name || 'Rutina Personalizada'}</Text>
                    <Text style={styles.historyDate}>{new Date(log.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={styles.historyMetrics}>
                    <Text style={styles.metricVal}>{Math.round(log.duration_seconds / 60)}m</Text>
                    <Text style={styles.metricVal}>{log.total_volume}kg</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {hasMoreLogs && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => router.push('/history')}
                >
                  <Text style={styles.loadMoreText}>VER TODO MI HISTORIAL</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.textMuted} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </ScrollView>
        {/* ── Workout Details Modal ── */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={detailsModalStyles.overlay}>
            <View style={detailsModalStyles.content}>
              <View style={detailsModalStyles.header}>
                <View>
                  <Text style={detailsModalStyles.title}>
                    {selectedWorkout?.routine?.name || 'Rutina Personalizada'}
                  </Text>
                  <Text style={detailsModalStyles.subtitle}>
                    {selectedWorkout && new Date(selectedWorkout.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={detailsModalStyles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View style={detailsModalStyles.loading}>
                  <ActivityIndicator color={theme.accent} size="large" />
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={detailsModalStyles.statsRow}>
                    <View style={detailsModalStyles.stat}>
                      <Text style={detailsModalStyles.statVal}>{Math.round((selectedWorkout?.duration_seconds || 0) / 60)}m</Text>
                      <Text style={detailsModalStyles.statLabel}>TIEMPO</Text>
                    </View>
                    <View style={detailsModalStyles.stat}>
                      <Text style={detailsModalStyles.statVal}>{selectedWorkout?.total_volume}kg</Text>
                      <Text style={detailsModalStyles.statLabel}>VOLUMEN</Text>
                    </View>
                  </View>

                  <Text style={detailsModalStyles.sectionTitle}>EJERCICIOS</Text>
                  {workoutExercises.map((exLog, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={detailsModalStyles.exItem}
                      onPress={() => handleExercisePress(exLog.exercise_id)}
                    >
                      <View style={detailsModalStyles.exHeader}>
                        <Text style={detailsModalStyles.exName}>{exLog.exercise?.name}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                      </View>
                      <View style={detailsModalStyles.setsRow}>
                        {(exLog.sets_completed || []).map((s: any, sIdx: number) => (
                          <View key={sIdx} style={detailsModalStyles.setBadge}>
                            <Text style={detailsModalStyles.setText}>{s.weight}kg x {s.reps}</Text>
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
      </SafeAreaView>
    </View>
  );
}

function ThemeOption({ label, isActive, color, onPress, theme, styles }: { 
  label: string; 
  isActive: boolean; 
  color: string; 
  onPress: () => void;
  theme: AppTheme;
  styles: any;
}) {
  return (
    <TouchableOpacity 
      style={[
        styles.themeOption, 
        isActive && { borderColor: theme.accent, backgroundColor: theme.surface }
      ]} 
      onPress={onPress}
    >
      <View style={[styles.themeColorCircle, { backgroundColor: color }]} />
      <Text style={[styles.themeLabel, isActive && { color: theme.accent }]}>{label}</Text>
      {isActive && <Ionicons name="checkmark-circle" size={14} color={theme.accent} />}
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, theme, styles }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; theme: AppTheme; styles: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={theme.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: theme.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.accentBorder,
  },
  avatarPlaceholder: {
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.accent,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.bgDeep,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderMuted,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: theme.borderSubtle,
    marginLeft: 64,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  themeColorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.error,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    gap: 2,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: theme.textMuted,
  },
  historyMetrics: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.accent,
  },
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 1,
  },
  viewMoreRanks: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  ranksScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  miniRankCard: {
    width: 90,
    backgroundColor: theme.bgCard,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  miniRankMuscle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
  },
  miniTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTierText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

const createDetailsModalStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.bgBase,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.textPrimary,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.accent,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 2,
    marginBottom: 16,
  },
  exItem: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setBadge: {
    backgroundColor: theme.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  setText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '700',
  },
});

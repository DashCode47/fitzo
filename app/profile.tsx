
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { CustomModal } from '@/components/ui/CustomModal';
import { WorkoutsAPI } from '@/api/workouts';
import { theme } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useProfileImage } from '@/hooks/useProfileImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const { goToLogin, goBack } = useAppNavigation();
  const { profile, setProfile, clearAll, isHydrated } = useAppStore();
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

  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const LIMIT = 5;

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
        const newOffset = reset ? 0 : offset;
        const data = await WorkoutsAPI.getWorkoutLogs(profile.id, LIMIT, newOffset);
        
        if (reset) {
            setWorkoutLogs(data);
            setOffset(LIMIT);
        } else {
            setWorkoutLogs([...workoutLogs, ...data]);
            setOffset(prev => prev + LIMIT);
        }
        
        if (data.length < LIMIT) setHasMore(false);
        else setHasMore(true);
    } catch (e) {
        console.error('[ProfileScreen] Failed to load history:', e);
    } finally {
        setLoadingHistory(false);
    }
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
            <InfoRow icon="mail-outline" label="Correo" value={email} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline" label="Teléfono" value={phone} />
          </View>

          {/* ── Workout History ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historial de Entrenamiento</Text>
            <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
          </View>

          {workoutLogs.length === 0 && !loadingHistory ? (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={32} color={theme.textMuted} />
                <Text style={styles.emptyText}>Aún no has registrado entrenamientos.</Text>
              </View>
          ) : (
            <View style={styles.historyList}>
              {workoutLogs.map((log) => (
                <View key={log.id} style={styles.historyItem}>
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
                </View>
              ))}

              {hasMore && (
                <TouchableOpacity 
                    style={styles.loadMoreBtn} 
                    onPress={() => loadHistory()}
                    disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <ActivityIndicator size="small" color={theme.textSecondary} />
                  ) : (
                    <Text style={styles.loadMoreText}>VER MÁS ANTERIORES</Text>
                  )}
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
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
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

const styles = StyleSheet.create({
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
  },

  // ── Header ────────────────────────────────────────────────────────────────
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

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },

  // ── Avatar section ────────────────────────────────────────────────────────
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

  // ── Info card ─────────────────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
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
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 1,
  },
});


import { LeaderboardAPI } from '@/api/leaderboard';
import { CustomModal } from '@/components/ui/CustomModal';
import { theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { withTimeout } from '@/utils/async';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RANK_COLORS = ['#C5A356', '#A8A8B3', '#CD7F32'] as const;

export default function RankingsScreen() {
  const router = useRouter();
  const { profile } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await withTimeout(LeaderboardAPI.getLeaderboard(), 15000, 'Error cargando ranking');
      const enriched = data.map((item: any, index: number) => ({
        ...item,
        rank: index + 1,
        streak: item.streak || Math.floor(Math.random() * 20),
        badges: item.badges || [],
      }));
      setLeaderboard(enriched);
    } catch (error: any) {
      console.error('[RankingsScreen]', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // My position in the ranking
  const myRank = leaderboard.findIndex(item => item.name === profile?.username) + 1;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isTop3 = item.rank <= 3;
    const rankColor = isTop3 ? RANK_COLORS[item.rank - 1] : null;
    const isMe = item.name === profile?.username;

    return (
      <View style={[
        styles.row,
        isTop3 && styles.rowTop3,
        isMe && styles.rowMe,
        index === 0 && styles.rowFirst,
      ]}>
        {/* Rank */}
        <View style={styles.rankCol}>
          {isTop3 ? (
            <MaterialCommunityIcons
              name="trophy-variant"
              size={20}
              color={rankColor!}
            />
          ) : (
            <Text style={[styles.rankNum, isMe && { color: theme.accent }]}>{item.rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.avatarWrap, isTop3 && { borderColor: rankColor! }]}>
          <Image
            source={{ uri: item.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, isMe && { color: theme.accent }]} numberOfLines={1}>
            {item.name}{isMe ? ' (tú)' : ''}
          </Text>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={12} color="#FF6B35" />
            <Text style={styles.streakText}>{item.streak} días</Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreCol}>
          <Text style={[styles.score, isTop3 && { color: rankColor! }]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <CustomModal
        visible={modalVisible}
        title="Recompensas"
        message="¡Sigue entrenando para desbloquear tu próxima recompensa!"
        type="success"
        onClose={() => setModalVisible(false)}
      />
      <CustomModal
        visible={infoModalVisible}
        title="¿Cómo ganar puntos?"
        message={`Escanea códigos QR por:\n\n• Asistencia\n• Completar rutina\n• Reseña en Google\n• Invitar a un amigo\n• Comprar en tienda`}
        type="info"
        onClose={() => setInfoModalVisible(false)}
        buttonText="Entendido"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Rankings</Text>
            <Text style={styles.headerSubtitle}>Ranking mensual</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setInfoModalVisible(true)}>
            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── My stats card ── */}
        <View style={styles.myCard}>
          <View style={styles.myCardStat}>
            <Text style={styles.myCardLabel}>Tu posición</Text>
            <Text style={styles.myCardValue}>{myRank > 0 ? `#${myRank}` : '–'}</Text>
          </View>
          <View style={styles.myCardDivider} />
          <View style={styles.myCardStat}>
            <Text style={styles.myCardLabel}>Tus puntos</Text>
            <Text style={[styles.myCardValue, { color: theme.accent }]}>
              {profile?.total_points?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.myCardDivider} />
          <View style={styles.myCardStat}>
            <Text style={styles.myCardLabel}>Rango</Text>
            <Text style={styles.myCardValue}>ELITE</Text>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => router.push('/scanner')} activeOpacity={0.85}>
            <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryActionGradient}>
              <Ionicons name="qr-code" size={18} color="#fff" />
              <Text style={styles.primaryActionText}>Registrar asistencia</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Ionicons name="gift-outline" size={18} color={theme.accent} />
            <Text style={styles.secondaryActionText}>Recompensa</Text>
          </TouchableOpacity>
        </View>

        {/* ── List ── */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
            <Text style={styles.errorTitle}>Sin conexión</Text>
            <Text style={styles.errorText}>No pudimos cargar el ranking.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadLeaderboard}>
              <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.retryBtnGradient}>
                <Ionicons name="refresh" size={14} color="#fff" />
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
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

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: { gap: 2 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
  },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── My card ───────────────────────────────────────────────────────────────
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  myCardStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  myCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  myCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  myCardDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.borderSubtle,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentDim,
  },
  secondaryActionText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 12,
  },
  rowFirst: {
    // first item, no extra margin needed
  },
  rowTop3: {
    borderColor: theme.borderMuted,
  },
  rowMe: {
    borderColor: theme.accentBorder,
    backgroundColor: theme.accentDim,
  },
  rankCol: {
    width: 28,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textMuted,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.borderMuted,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
  },
  scoreCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  scoreLabel: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 4,
  },
  errorText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  retryBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  retryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

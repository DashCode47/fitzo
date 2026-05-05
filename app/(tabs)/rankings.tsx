
import { LeaderboardAPI, LeaderboardItem } from '@/api/leaderboard';
import { RankingsSkeleton } from '@/components/rankings/RankingsSkeleton';
import { RanksView } from '@/components/rankings/RanksView';
import { RANK_TIERS } from '@/constants/ranks';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import { withTimeout } from '@/utils/async';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RankingInfoModal } from '@/components/rankings/RankingInfoModal';

const RANK_COLORS = ['#C5A356', '#A8A8B3', '#CD7F32'] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bgDeep },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segment
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: theme.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  segmentBtnTextActive: { color: theme.accent, fontWeight: '700' },

  // My position card
  myCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  myCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  myCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  myCardAvatarImg: { width: 44, height: 44 },
  myCardInfo: { flex: 1 },
  myCardName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  myCardPos: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  myCardRight: { alignItems: 'flex-end', gap: 4 },
  myCardTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  myCardTierText: { fontSize: 12, fontWeight: '800' },
  myCardScore: { fontSize: 11, color: theme.textMuted },

  // Leaderboard list
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
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
  rowTop3: { borderColor: theme.borderMuted },
  rowFirst: {
    paddingVertical: 14,
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: '#C5A356',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  rowFirstGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C5A35680',
  },
  rowMe: { borderColor: theme.accentBorder, backgroundColor: theme.accentDim },
  posCol: { width: 28, alignItems: 'center' },
  posNum: { fontSize: 13, fontWeight: '800', color: theme.textMuted },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.borderMuted,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapFirst: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  avatar: { width: '100%', height: '100%' },
  nameCol: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  nameFirst: { fontSize: 15 },
  scoreText: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  scoreTextMe: { color: theme.accent },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: { fontSize: 11, fontWeight: '800' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Error / empty
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 60,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
  errorText: { color: theme.textSecondary, fontSize: 14 },
  retryBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  retryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// Modal styles removed (now shared)

// ─── Podium ───────────────────────────────────────────────────────────────────
function PodiumView({ top3, profileId, theme }: {
  top3: LeaderboardItem[];
  profileId?: string;
  theme: AppTheme;
}) {
  const first  = top3.find(i => i.position === 1);
  const second = top3.find(i => i.position === 2);
  const third  = top3.find(i => i.position === 3);

  // Crown float animation for #1
  const crownFloat = useRef(new Animated.Value(0)).current;
  
  // Slide-up animations for each slot
  const anim1 = useRef(new Animated.Value(50)).current;
  const fade1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(50)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(50)).current;
  const fade3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(crownFloat, { toValue: -6, duration: 900, useNativeDriver: true }),
        Animated.timing(crownFloat, { toValue: 0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const makeParallel = (anim: Animated.Value, fade: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(anim, { toValue: 0, duration: 480, delay, useNativeDriver: true, easing: Easing.out(Easing.back(1.1)) }),
        Animated.timing(fade, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      ]);

    Animated.parallel([
      makeParallel(anim1, fade1, 0),
      makeParallel(anim2, fade2, 80),
      makeParallel(anim3, fade3, 160),
    ]).start();
  }, []);

  if (!first) return null;

  const tierInfo = (entry?: LeaderboardItem) =>
    entry ? (RANK_TIERS.find(t => t.name === entry.rankTier) || RANK_TIERS[0]) : RANK_TIERS[0];

  const podiumSlot = (
    entry: LeaderboardItem | undefined,
    pos: 1 | 2 | 3,
    podiumH: number,
    slideAnim: Animated.Value,
    fadeAnim: Animated.Value,
  ) => {
    if (!entry) return <View style={{ flex: 1 }} />;
    const rankColor = RANK_COLORS[pos - 1];
    const avatarSize = pos === 1 ? 64 : 52;
    const isMe = entry.id === profileId;
    const tier = tierInfo(entry);

    return (
      <Animated.View
        style={{ flex: 1, alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Crown for #1 */}
        {pos === 1 && (
          <Animated.View style={{ transform: [{ translateY: crownFloat }], marginBottom: 4 }}>
            <Text style={{ fontSize: 22 }}>👑</Text>
          </Animated.View>
        )}
        {/* Medal for #2/#3 */}
        {pos !== 1 && (
          <Ionicons name="medal-outline" size={18} color={rankColor} style={{ marginBottom: 6 }} />
        )}

        {/* Avatar */}
        <View style={{
          width: avatarSize, height: avatarSize,
          borderRadius: avatarSize * 0.3,
          borderWidth: 2.5, borderColor: rankColor,
          backgroundColor: theme.surface,
          overflow: 'hidden',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 8,
        }}>
          {entry.avatar
            ? <Image source={{ uri: entry.avatar }} style={{ width: '100%', height: '100%' }} />
            : <Ionicons name="person" size={pos === 1 ? 28 : 22} color={theme.textMuted} />
          }
        </View>

        {/* Name */}
        <Text numberOfLines={1} style={{
          fontSize: pos === 1 ? 13 : 12,
          fontWeight: '800',
          color: pos === 1 ? rankColor : theme.textPrimary,
          marginBottom: 2,
          maxWidth: '100%',
          textAlign: 'center',
          paddingHorizontal: 4,
        }}>
          {entry.name}{isMe ? ' ★' : ''}
        </Text>

        {/* Tier badge */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 3,
          backgroundColor: tier.color + '22',
          paddingHorizontal: 7, paddingVertical: 3,
          borderRadius: 6, marginBottom: 8,
        }}>
          <Ionicons name={tier.icon as any} size={9} color={tier.color} />
          <Text style={{ fontSize: 9, fontWeight: '800', color: tier.color }}>{tier.name}</Text>
        </View>

        {/* Podium block */}
        <LinearGradient
          colors={[rankColor + '55', rankColor + '22']}
          style={{
            width: '100%', height: podiumH,
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderBottomWidth: 0,
            borderColor: rankColor + '60',
          }}
        >
          <Text style={{ fontSize: pos === 1 ? 22 : 18, fontWeight: '900', color: rankColor }}>
            {pos}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 8 }}>
      {podiumSlot(second, 2, 56,  anim2, fade2)}
      {podiumSlot(first,  1, 80,  anim1, fade1)}
      {podiumSlot(third,  3, 44,  anim3, fade3)}
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function LeaderboardRow({ item, isMe, index, theme, styles }: {
  item: LeaderboardItem;
  isMe: boolean;
  index: number;
  theme: AppTheme;
  styles: any;
}) {
  const isTop3 = item.position <= 3;
  const isFirst = item.position === 1;
  const isSecond = item.position === 2;
  const isThird = item.position === 3;
  const rankColor = isTop3 ? RANK_COLORS[item.position - 1] : null;
  const tierInfo = RANK_TIERS.find(t => t.name === item.rankTier) || RANK_TIERS[0];

  // Todos — slide desde la derecha + fade en secuencia
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = index * 55;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true, easing: Easing.out(Easing.back(1.1)) }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  // #1 — pulso lento (scale 1.0 → 1.015) encima del slide
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isFirst) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.015, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isFirst]);

  // #2 — shimmer horizontal deslizante
  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    if (!isSecond) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 200, duration: 1800, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [isSecond]);

  // #3 — bronze glow pulsing border opacity
  const bronzeAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!isThird) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bronzeAnim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(bronzeAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isThird]);

  const innerRow = (
    <>
      {/* #1 — fondo gradiente dorado */}
      {isFirst && (
        <LinearGradient
          colors={['#C5A35618', '#C5A35608', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* #2 shimmer overlay */}
      {isSecond && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 0, bottom: 0, width: 60,
            transform: [{ translateX: shimmerAnim }],
          }}
        >
          <LinearGradient
            colors={['transparent', RANK_COLORS[1] + '40', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* #3 — bronze glow border overlay */}
      {isThird && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: RANK_COLORS[2],
            opacity: bronzeAnim,
          }}
        />
      )}

      <View style={styles.posCol}>
        {isFirst ? (
          <Ionicons name="ribbon" size={24} color={RANK_COLORS[0]} />
        ) : isTop3 ? (
          <Ionicons name="trophy" size={18} color={rankColor!} />
        ) : (
          <Text style={[styles.posNum, isMe && { color: theme.accent }]}>{item.position}</Text>
        )}
      </View>
      <View style={[
        styles.avatarWrap,
        isFirst && [styles.avatarWrapFirst, { borderWidth: 2.5, borderColor: RANK_COLORS[0] }],
        !isFirst && isTop3 && { borderColor: rankColor! },
      ]}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={isFirst ? 22 : 18} color={theme.textMuted} />
        )}
      </View>
      <View style={styles.nameCol}>
        <Text
          style={[
            styles.name,
            isFirst && [styles.nameFirst, { color: '#C5A356', fontWeight: '800' }],
            !isFirst && isMe && { color: theme.accent },
          ]}
          numberOfLines={1}
        >
          {item.name}{isMe && !isFirst ? ' (tú)' : ''}
        </Text>
        <Text style={[styles.scoreText, isFirst && { color: '#C5A35699' }, isMe && !isFirst && styles.scoreTextMe]}>
          Score {item.rankIndex.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20' }]}>
        <Ionicons name={tierInfo.icon as any} size={11} color={tierInfo.color} />
        <Text style={[styles.tierText, { color: tierInfo.color }]}>{tierInfo.name}</Text>
      </View>
    </>
  );

  const rowContent = (
    <View style={[
      styles.row,
      isTop3 && styles.rowTop3,
      isFirst && styles.rowFirst,
      isMe && styles.rowMe,
      (isFirst || isSecond || isThird) && { overflow: 'hidden' },
    ]}>
      {innerRow}
    </View>
  );

  // #1: slide horizontal + fade + pulso loop
  if (isFirst) {
    return (
      <Animated.View style={{ transform: [{ translateX: slideAnim }, { scale: pulseAnim }], opacity: fadeAnim }}>
        {rowContent}
      </Animated.View>
    );
  }

  // Todos los demás: slide horizontal + fade secuencial
  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      {rowContent}
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RankingsScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { profile } = useAppStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(false);
  const [viewMode, setViewMode] = useState<'tabla' | 'misrangos'>('tabla');
  const [infoVisible, setInfoVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setErrorStatus(false);
      const data = await withTimeout(LeaderboardAPI.getRankLeaderboard(), 15000, 'Error cargando ranking');
      setLeaderboard(data);
    } catch (e) {
      console.error('[RankingsScreen]', e);
      setErrorStatus(true);
    } finally {
      setLoading(false);
    }
  };

  const myEntry = leaderboard.find(item => item.id === profile?.id);
  const myTierInfo = myEntry
    ? (RANK_TIERS.find(t => t.name === myEntry.rankTier) || RANK_TIERS[0])
    : null;

  const top3Count = Math.min(3, leaderboard.length);
  const showPodium = leaderboard.length >= 3;

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Rankings</Text>
            <Text style={styles.headerSubtitle}>Por fuerza relativa</Text>
          </View>
          <TouchableOpacity style={styles.infoBtn} onPress={() => setInfoVisible(true)}>
            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Segment */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'tabla' && styles.segmentBtnActive]}
            onPress={() => setViewMode('tabla')}
          >
            <Text style={[styles.segmentBtnText, viewMode === 'tabla' && styles.segmentBtnTextActive]}>
              Tabla
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'misrangos' && styles.segmentBtnActive]}
            onPress={() => setViewMode('misrangos')}
          >
            <Text style={[styles.segmentBtnText, viewMode === 'misrangos' && styles.segmentBtnTextActive]}>
              Mis Rangos
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'tabla' ? (
          <>
            {/* My position card */}
            {myEntry && myTierInfo && (
              <View style={styles.myCard}>
                <LinearGradient
                  colors={[myTierInfo.color + '25', myTierInfo.color + '08']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.myCardGradient}
                >
                  <View style={styles.myCardAvatar}>
                    {profile?.photo_url ? (
                      <Image source={{ uri: profile.photo_url }} style={styles.myCardAvatarImg} />
                    ) : (
                      <Ionicons name="person" size={22} color={theme.textMuted} />
                    )}
                  </View>
                  <View style={styles.myCardInfo}>
                    <Text style={styles.myCardName}>{profile?.username || 'Tú'}</Text>
                    <Text style={styles.myCardPos}>Posición #{myEntry.position} de {leaderboard.length}</Text>
                  </View>
                  <View style={styles.myCardRight}>
                    <View style={[styles.myCardTier, { backgroundColor: myTierInfo.color + '25' }]}>
                      <Ionicons name={myTierInfo.icon as any} size={12} color={myTierInfo.color} />
                      <Text style={[styles.myCardTierText, { color: myTierInfo.color }]}>
                        {myTierInfo.name}
                      </Text>
                    </View>
                    <Text style={styles.myCardScore}>Score {myEntry.rankIndex.toFixed(2)}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* List */}
            {loading ? (
              <RankingsSkeleton />
            ) : errorStatus ? (
              <View style={styles.errorState}>
                <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
                <Text style={styles.errorTitle}>Sin conexión</Text>
                <Text style={styles.errorText}>No pudimos cargar el ranking.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadLeaderboard}>
                  <LinearGradient
                    colors={theme.gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.retryBtnGradient}
                  >
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={styles.retryBtnText}>Reintentar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1, overflow: 'hidden' }}>
                {/* Podium for top 3 */}
                {showPodium && (
                  <PodiumView
                    top3={leaderboard.slice(0, 3)}
                    profileId={profile?.id}
                    theme={theme}
                  />
                )}

                {/* Section header between podium and rest of list */}
                {showPodium && leaderboard.length > 3 && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    marginTop: 8,
                    marginBottom: 8,
                    gap: 10,
                  }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSubtle }} />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                    }}>
                      RESTO DEL RANKING
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSubtle }} />
                  </View>
                )}

                <FlatList
                  data={leaderboard.slice(top3Count)}
                  keyExtractor={item => item.id}
                  renderItem={({ item, index }) => (
                    <LeaderboardRow
                      item={item}
                      index={index}
                      isMe={item.id === profile?.id}
                      theme={theme}
                      styles={styles}
                    />
                  )}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </>
        ) : (
          <RanksView />
        )}
      </SafeAreaView>

      <RankingInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        currentTierIndex={myEntry ? RANK_TIERS.findIndex(t => t.name === myEntry.rankTier) : -1}
      />
    </View>
  );
}

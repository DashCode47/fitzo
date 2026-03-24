
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

  // Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderMuted,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  modalTierIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTierName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  modalTierDesc: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
  modalCloseBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalCloseBtnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const TIER_DESCRIPTIONS: Record<string, string> = {
  Chulla:     'Nivel inicial. Estás empezando tu camino.',
  Camellador: 'Ya tienes base. Constancia ante todo.',
  Chagra:     'Fuerza sólida. El gym se nota.',
  Capo:       'Alto rendimiento. Referente en el gym.',
  Máquina:    'Nivel elite. Números que impresionan.',
  Atahualpa:  'El pico. Fuerza de leyenda.',
};

// ─── Info Modal ───────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose, theme, styles }: {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  styles: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sistema de Rangos</Text>
            <Text style={styles.modalSubtitle}>
              El ranking se basa en tu fuerza relativa al peso corporal.{'\n'}
              Cada rango requiere levantar más peso proporcional a ti.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {RANK_TIERS.map((tier, index) => (
                <View key={tier.name} style={styles.modalTierRow}>
                  <View style={[styles.modalTierIcon, { backgroundColor: tier.color + '20' }]}>
                    <Ionicons name={tier.icon as any} size={20} color={tier.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTierName}>{tier.name}</Text>
                    <Text style={styles.modalTierDesc}>{TIER_DESCRIPTIONS[tier.name]}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Nivel {index + 1}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalCloseBtnGradient}
              >
                <Text style={styles.modalCloseBtnText}>Entendido</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  const rankColor = isTop3 ? RANK_COLORS[item.position - 1] : null;
  const tierInfo = RANK_TIERS.find(t => t.name === item.rankTier) || RANK_TIERS[0];

  // Todos — slide desde la derecha + fade en secuencia
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = index * 55;
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
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
      (isFirst || isSecond) && { overflow: 'hidden' },
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
                <FlatList
                  data={leaderboard}
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

      <InfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        theme={theme}
        styles={styles}
      />
    </View>
  );
}

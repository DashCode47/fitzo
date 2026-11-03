import { LeaderboardAPI, LeaderboardItem, RankPosition } from "@/api/leaderboard";
import { RanksAPI } from "@/api/ranks";
import { RankingsSkeleton } from "@/components/rankings/RankingsSkeleton";
import { RanksView } from "@/components/rankings/RanksView";
import { RANK_TIERS } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useAppStore } from "@/store/useAppStore";
import { withTimeout } from "@/utils/async";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RANK_COLORS = ["#C5A356", "#A8A8B3", "#CD7F32"] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgDeep },
    topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },


    // My position card
    myCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    notRankedCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    notRankedText: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
    },
    myCardGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    myCardAvatar: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    myCardAvatarImg: { width: 44, height: 44 },
    myCardInfo: { flex: 1 },
    myCardName: { fontSize: 15, fontWeight: "700", color: theme.textPrimary },
    myCardPos: { fontSize: 12, color: theme.textMuted, marginTop: 1 },

    // Leaderboard list
    list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
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
      backgroundColor: "transparent",
      shadowColor: "#C5A356",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    rowFirstGradient: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#C5A35680",
    },
    rowMe: {
      borderColor: theme.accentBorder,
      backgroundColor: theme.accentDim,
    },
    posCol: { width: 28, alignItems: "center" },
    posNum: { fontSize: 13, fontWeight: "800", color: theme.textMuted },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.borderMuted,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarWrapFirst: {
      width: 46,
      height: 46,
      borderRadius: 14,
    },
    avatar: { width: "100%", height: "100%" },
    nameCol: { flex: 1 },
    name: { fontSize: 14, fontWeight: "700", color: theme.textPrimary },
    nameFirst: { fontSize: 15 },
    tierBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
    },
    tierText: { fontSize: 11, fontWeight: "800" },

    // Section header
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginTop: 24,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },

    // Error / empty
    errorState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingBottom: 60,
    },
    errorTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.textPrimary,
      marginTop: 4,
    },
    errorText: { color: theme.textSecondary, fontSize: 14 },
    retryBtn: {
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 8,
    },
    retryBtnGradient: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 11,
    },
    retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  });


// ─── Podium ───────────────────────────────────────────────────────────────────
function PodiumView({
  top3,
  profileId,
  theme,
}: {
  top3: LeaderboardItem[];
  profileId?: string;
  theme: AppTheme;
}) {
  const first = top3.find((i) => i.position === 1);
  const second = top3.find((i) => i.position === 2);
  const third = top3.find((i) => i.position === 3);
  const reduceMotion = useReduceMotion();

  // Crown float animation for #1
  const crownFloat = useRef(new Animated.Value(0)).current;

  // Slide-up animations for each slot — start already at rest when reduce
  // motion is on, so entries render in place instead of sliding/fading in.
  const anim1 = useRef(new Animated.Value(reduceMotion ? 0 : 50)).current;
  const fade1 = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const anim2 = useRef(new Animated.Value(reduceMotion ? 0 : 50)).current;
  const fade2 = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const anim3 = useRef(new Animated.Value(reduceMotion ? 0 : 50)).current;
  const fade3 = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(crownFloat, {
          toValue: -6,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(crownFloat, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const makeParallel = (
      anim: Animated.Value,
      fade: Animated.Value,
      delay: number,
    ) =>
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 0,
          duration: 480,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.1)),
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 380,
          delay,
          useNativeDriver: true,
        }),
      ]);

    Animated.parallel([
      makeParallel(anim1, fade1, 0),
      makeParallel(anim2, fade2, 80),
      makeParallel(anim3, fade3, 160),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  if (!first) return null;

  const tierInfo = (entry?: LeaderboardItem) =>
    entry
      ? RANK_TIERS.find((t) => t.name === entry.rankTier) || RANK_TIERS[0]
      : RANK_TIERS[0];

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
        style={{
          flex: 1,
          alignItems: "center",
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Crown for #1 */}
        {pos === 1 && (
          <Animated.View
            style={{ transform: [{ translateY: crownFloat }], marginBottom: 4 }}
          >
            <Text style={{ fontSize: 22 }}>👑</Text>
          </Animated.View>
        )}
        {/* Medal for #2/#3 */}
        {pos !== 1 && (
          <Ionicons
            name="medal-outline"
            size={18}
            color={rankColor}
            style={{ marginBottom: 6 }}
          />
        )}

        {/* Avatar */}
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize * 0.3,
            borderWidth: 2.5,
            borderColor: rankColor,
            backgroundColor: theme.surface,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {entry.avatar ? (
            <Image
              source={{ uri: entry.avatar }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Ionicons
              name="person"
              size={pos === 1 ? 28 : 22}
              color={theme.textMuted}
            />
          )}
        </View>

        {/* Name */}
        <Text
          numberOfLines={1}
          style={{
            fontSize: pos === 1 ? 13 : 12,
            fontWeight: "800",
            color: pos === 1 ? rankColor : theme.textPrimary,
            marginBottom: 2,
            maxWidth: "100%",
            textAlign: "center",
            paddingHorizontal: 4,
          }}
        >
          {entry.name}
          {isMe ? " ★" : ""}
        </Text>

        {/* Tier badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: tier.color + "22",
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "800", color: tier.color }}>
            {tier.name}
          </Text>
        </View>

        {/* Podium block */}
        <LinearGradient
          colors={[rankColor + "55", rankColor + "22"]}
          style={{
            width: "100%",
            height: podiumH,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: rankColor + "60",
          }}
        >
          <Text
            style={{
              fontSize: pos === 1 ? 22 : 18,
              fontWeight: "900",
              color: rankColor,
            }}
          >
            {pos}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        marginBottom: 8,
      }}
    >
      {podiumSlot(second, 2, 56, anim2, fade2)}
      {podiumSlot(first, 1, 80, anim1, fade1)}
      {podiumSlot(third, 3, 44, anim3, fade3)}
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function LeaderboardRow({
  item,
  isMe,
  index,
  theme,
  styles,
}: {
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
  const tierInfo =
    RANK_TIERS.find((t) => t.name === item.rankTier) || RANK_TIERS[0];
  const reduceMotion = useReduceMotion();

  // Todos — slide desde la derecha + fade en secuencia (ya en reposo si reduce motion)
  const slideAnim = useRef(new Animated.Value(reduceMotion ? 0 : 60)).current;
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const delay = index * 55;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // #1 — pulso lento (scale 1.0 → 1.015) encima del slide
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isFirst || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.015,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirst, reduceMotion]);

  // #2 — shimmer horizontal deslizante
  const shimmerAnim = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    if (!isSecond || reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 200,
        duration: 1800,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSecond, reduceMotion]);

  // #3 — bronze glow pulsing border opacity
  const bronzeAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!isThird || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bronzeAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bronzeAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThird, reduceMotion]);

  const innerRow = (
    <>
      {/* #1 — fondo gradiente dorado */}
      {isFirst && (
        <LinearGradient
          colors={["#C5A35618", "#C5A35608", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* #2 shimmer overlay */}
      {isSecond && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 60,
            transform: [{ translateX: shimmerAnim }],
          }}
        >
          <LinearGradient
            colors={["transparent", RANK_COLORS[1] + "40", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* #3 — bronze glow border overlay */}
      {isThird && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
          <Text style={[styles.posNum, isMe && { color: theme.accent }]}>
            {item.position}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.avatarWrap,
          isFirst && [
            styles.avatarWrapFirst,
            { borderWidth: 2.5, borderColor: RANK_COLORS[0] },
          ],
          !isFirst && isTop3 && { borderColor: rankColor! },
        ]}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Ionicons
            name="person"
            size={isFirst ? 22 : 18}
            color={theme.textMuted}
          />
        )}
      </View>
      <View style={styles.nameCol}>
        <Text
          style={[
            styles.name,
            isFirst && [
              styles.nameFirst,
              { color: "#C5A356", fontWeight: "800" },
            ],
            !isFirst && isMe && { color: theme.accent },
          ]}
          numberOfLines={1}
        >
          {item.name}
          {isMe && !isFirst ? " (tú)" : ""}
        </Text>
      </View>
      <View
        style={[styles.tierBadge, { backgroundColor: tierInfo.color + "20" }]}
      >
        <Text style={[styles.tierText, { color: tierInfo.color }]}>
          {tierInfo.name}
        </Text>
      </View>
    </>
  );

  const rowContent = (
    <View
      style={[
        styles.row,
        isTop3 && styles.rowTop3,
        isFirst && styles.rowFirst,
        isMe && styles.rowMe,
        (isFirst || isSecond || isThird) && { overflow: "hidden" },
      ]}
    >
      {innerRow}
    </View>
  );

  // #1: slide horizontal + fade + pulso loop
  if (isFirst) {
    return (
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }, { scale: pulseAnim }],
          opacity: fadeAnim,
        }}
      >
        {rowContent}
      </Animated.View>
    );
  }

  // Todos los demás: slide horizontal + fade secuencial
  return (
    <Animated.View
      style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}
    >
      {rowContent}
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RankingsScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { profile, userStats, ranks, setRanks, streakData } = useAppStore();
  const streak = streakData?.streak ?? 0;

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [myPosition, setMyPosition] = useState<RankPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id, userStats?.weight, streak]),
  );

  const load = async () => {
    try {
      setErrorStatus(false);
      // Sync own rank first so the leaderboard below already reflects it.
      if (profile?.id && userStats?.weight) {
        const r = await RanksAPI.syncUserRank(
          profile.id,
          userStats.weight,
          (userStats.gender as any) || "M",
          streak,
        );
        if (r) setRanks(r);
      }

      const data = await withTimeout(
        LeaderboardAPI.getRankLeaderboard(),
        15000,
        "Error cargando ranking",
      );
      setLeaderboard(data);

      // The top-10 list may not include the current user — fetch their real
      // position separately in that case.
      const inTop10 = profile?.id && data.some((item) => item.id === profile.id);
      if (profile?.id && !inTop10) {
        try {
          setMyPosition(await LeaderboardAPI.getRankPosition(profile.id));
        } catch (e) {
          console.warn("[RankingsScreen] getRankPosition failed:", e);
          setMyPosition(null);
        }
      } else {
        setMyPosition(null);
      }
    } catch (e) {
      console.error("[RankingsScreen]", e);
      setErrorStatus(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const top3Count = Math.min(3, leaderboard.length);
  const showPodium = leaderboard.length >= 3;

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={theme.accent}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Rankings</Text>
          </View>

          {/* ── Your rank ── */}
          {!userStats?.weight ? (
            <TouchableOpacity
              style={styles.notRankedCard}
              onPress={() => router.push("/(tabs)/nutrition")}
              activeOpacity={0.85}
            >
              <Ionicons name="scale-outline" size={18} color={theme.textMuted} />
              <Text style={styles.notRankedText}>
                Configura tu peso corporal para calcular tu rango.
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ) : (
            ranks && <RanksView ranks={ranks} streak={streak} />
          )}

          {/* ── Leaderboard ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tabla</Text>
          </View>

          {/* User isn't in the top 10: show just their real position */}
          {myPosition && (
            <View style={styles.myCard}>
              <View style={[styles.myCardGradient, { backgroundColor: theme.surface }]}>
                <View style={styles.myCardAvatar}>
                  {profile?.photo_url ? (
                    <Image
                      source={{ uri: profile.photo_url }}
                      style={styles.myCardAvatarImg}
                    />
                  ) : (
                    <Ionicons name="person" size={22} color={theme.textMuted} />
                  )}
                </View>
                <View style={styles.myCardInfo}>
                  <Text style={styles.myCardName}>
                    {profile?.username || "Tú"}
                  </Text>
                  <Text style={styles.myCardPos}>
                    Posición #{myPosition.position} de {myPosition.total}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {loading ? (
            <RankingsSkeleton />
          ) : errorStatus ? (
            <View style={styles.errorState}>
              <Ionicons
                name="cloud-offline-outline"
                size={48}
                color={theme.textMuted}
              />
              <Text style={styles.errorTitle}>Sin conexión</Text>
              <Text style={styles.errorText}>No pudimos cargar el ranking.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={load}>
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
            <>
              {showPodium && (
                <PodiumView
                  top3={leaderboard.slice(0, 3)}
                  profileId={profile?.id}
                  theme={theme}
                />
              )}
              <View style={styles.list}>
                {leaderboard.slice(top3Count).map((item, index) => (
                  <LeaderboardRow
                    key={item.id}
                    item={item}
                    index={index}
                    isMe={item.id === profile?.id}
                    theme={theme}
                    styles={styles}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

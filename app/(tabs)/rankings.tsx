import { LeaderboardAPI, LeaderboardItem, RankPosition } from "@/api/leaderboard";
import { RanksAPI } from "@/api/ranks";
import { RankingsSkeleton } from "@/components/rankings/RankingsSkeleton";
import { RanksView } from "@/components/rankings/RanksView";
import { RANK_TIERS } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { withTimeout } from "@/utils/async";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
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
    avatar: { width: "100%", height: "100%" },
    nameCol: { flex: 1 },
    name: { fontSize: 14, fontWeight: "700", color: theme.textPrimary },
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
// ponytail: static on purpose — the old pulse/shimmer/glow loops competed with the level card.
function PodiumView({
  top3,
  profileId,
  theme,
}: {
  top3: LeaderboardItem[];
  profileId?: string;
  theme: AppTheme;
}) {
  const byPos = (p: number) => top3.find((i) => i.position === p);
  if (!byPos(1)) return null;

  const slot = (entry: LeaderboardItem | undefined, pos: 1 | 2 | 3, podiumH: number) => {
    if (!entry) return <View style={{ flex: 1 }} />;
    const rankColor = RANK_COLORS[pos - 1];
    const avatarSize = pos === 1 ? 64 : 52;
    const tier = RANK_TIERS.find((t) => t.name === entry.rankTier) || RANK_TIERS[0];

    return (
      <View style={{ flex: 1, alignItems: "center" }}>
        {pos === 1 ? (
          <Text style={{ fontSize: 22, marginBottom: 4 }}>👑</Text>
        ) : (
          <Ionicons name="medal-outline" size={18} color={rankColor} style={{ marginBottom: 6 }} />
        )}

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
            <Image source={{ uri: entry.avatar }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Ionicons name="person" size={pos === 1 ? 28 : 22} color={theme.textMuted} />
          )}
        </View>

        <Text
          numberOfLines={1}
          style={{
            fontSize: pos === 1 ? 13 : 12,
            fontWeight: "800",
            color: pos === 1 ? rankColor : theme.textPrimary,
            marginBottom: 4,
            maxWidth: "100%",
            textAlign: "center",
            paddingHorizontal: 4,
          }}
        >
          {entry.name}
          {entry.id === profileId ? " (tú)" : ""}
        </Text>

        <View
          style={{
            backgroundColor: tier.color + "22",
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 6,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "800", color: tier.color }}>{tier.name}</Text>
        </View>

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
          <Text style={{ fontSize: pos === 1 ? 22 : 18, fontWeight: "900", color: rankColor }}>{pos}</Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 12 }}>
      {slot(byPos(2), 2, 56)}
      {slot(byPos(1), 1, 80)}
      {slot(byPos(3), 3, 44)}
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function LeaderboardRow({
  item,
  isMe,
  theme,
  styles,
}: {
  item: LeaderboardItem;
  isMe: boolean;
  theme: AppTheme;
  styles: any;
}) {
  // Top 3 only reach here when there are fewer than 3 entries (no podium).
  const medal = item.position <= 3 ? RANK_COLORS[item.position - 1] : null;
  const tier = RANK_TIERS.find((t) => t.name === item.rankTier) || RANK_TIERS[0];

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.posCol}>
        <Text style={[styles.posNum, medal && { color: medal }, isMe && { color: theme.accent }]}>
          {item.position}
        </Text>
      </View>
      <View style={[styles.avatarWrap, medal && { borderColor: medal }]}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={18} color={theme.textMuted} />
        )}
      </View>
      <View style={styles.nameCol}>
        <Text style={[styles.name, isMe && { color: theme.accent }]} numberOfLines={1}>
          {item.name}
          {isMe ? " (tú)" : ""}
        </Text>
      </View>
      <View style={[styles.tierBadge, { backgroundColor: tier.color + "20" }]}>
        <Text style={[styles.tierText, { color: tier.color }]}>{tier.name}</Text>
      </View>
    </View>
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
                {leaderboard.slice(top3Count).map((item) => (
                  <LeaderboardRow
                    key={item.id}
                    item={item}
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

import { AttendanceAPI, StreakData } from "@/api/attendance";
import { Banner, BannersAPI } from "@/api/banners";
import { ContentAPI } from "@/api/content";
import { LeaderboardAPI } from "@/api/leaderboard";
import { NutritionAPI } from "@/api/nutrition";
import { RoutinesAPI } from "@/api/routines";
import { UserAPI } from "@/api/user";
import { PromoCarousel } from "@/components/home/HeaderComponents";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import {
  EventsTimeline,
  NutritionCard,
  TopThreePodium,
} from "@/components/home/SectionComponents";
import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { RanksAPI, calculateAllRanks } from "@/api/ranks";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { withTimeout } from "@/utils/async";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { goToLogin, goToProfile, goToNutrition } =
    useAppNavigation();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const {
    profile,
    setProfile,
    activeDiet,
    setActiveDiet,
    promos,
    setPromos,
    events,
    setEvents,
    leaderboard,
    setLeaderboard,
    userSchedule,
    setUserSchedule,
    isHydrated,
    lastStreak,
    setLastStreak,
    streakData,
    setStreakData,
  } = useAppStore();
  const { startWorkout, replaceModalProps } = useStartWorkout();

  const [loading, setLoading] = useState(!isHydrated);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  // streakData itself lives in the persisted store (see useAppStore) so the
  // last known streak/check-in state shows immediately on mount instead of
  // resetting to 0 every time this screen is revisited.
  const streak: StreakData = streakData ?? { streak: 0, weekDays: 0, todayCount: 0 };
  const [streakLoading, setStreakLoading] = useState(!streakData);
  const [checkingIn, setCheckingIn] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);

  const [data, setData] = useState<any>({
    promos: [],
    events: [],
    leaderboard: [],
    nutrition: null,
  });

  useEffect(() => {
    if (isHydrated) {
      const nutritionData = activeDiet
        ? {
            title: activeDiet.name,
            calories: `${activeDiet.calories} kcal`,
            protein: `Proteína: ${activeDiet.macros.protein}`,
            label: "TU PLAN PERSONAL",
            image:
              "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
          }
        : null;
      setData((prev: any) => ({
        ...prev,
        promos: promos || [],
        events: events || [],
        leaderboard: leaderboard || [],
        nutrition: nutritionData,
      }));
      if (loading && profile) setLoading(false);
    }
  }, [isHydrated, profile, activeDiet, promos, events, leaderboard, loading]);

  useEffect(() => {
    if (isHydrated) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const loadData = async () => {
    try {
      setLoadError(false);
      const {
        data: { session },
      } = (await withTimeout(
        supabase.auth.getSession(),
        20000,
        "Error recuperando sesión",
      )) as any;
      if (!session) {
        goToLogin();
        return;
      }

      await UserAPI.syncProfile(session.user);
      const [newProfile, newPromos, newEvents, newLeaderboard, newNutrition] =
        await Promise.all([
          UserAPI.getProfile(session.user.id).catch(() => profile),
          BannersAPI.getBanners().catch(() => promos || []),
          ContentAPI.getEvents().catch(() => events || []),
          LeaderboardAPI.getRankLeaderboard().catch(() => leaderboard || []),
          NutritionAPI.getActiveDiet(session.user.id).catch(() => activeDiet),
        ]);

      if (newProfile) setProfile(newProfile);
      if (newPromos) setPromos(newPromos);
      if (newEvents) setEvents(newEvents);
      if (newLeaderboard) setLeaderboard(newLeaderboard);
      if (newNutrition !== undefined) setActiveDiet(newNutrition);

      if (session.user.id) {
        RoutinesAPI.getUserSchedule(session.user.id)
          .then(setUserSchedule)
          .catch(() => {});
      }

      // Streak + rank sync. getStreakData is awaited on its own path (not
      // masked behind a shared .catch) so a rank-sync failure can't also
      // blank out the check-in card, and so streakLoading turns off exactly
      // when the streak itself resolves — regardless of how long the rank
      // sync below takes. On failure the store keeps whatever streak was
      // last loaded instead of resetting to 0 — getStreakData throws now
      // instead of masking network errors as an empty streak.
      if (session.user.id) {
        const streakPromise = AttendanceAPI.getStreakData(session.user.id)
          .then((streakInfo) => {
            if (streakInfo.streak === 0 && lastStreak > 0) {
              setShowStreakLost(true);
            }
            setLastStreak(streakInfo.streak);
            setStreakData(streakInfo);
            return streakInfo;
          })
          .catch((e) => {
            console.error("[HomeScreen] Failed to load streak:", e);
            return null;
          })
          .finally(() => setStreakLoading(false));

        // SYNC RANK TO DB (Optimization: only if we have weights)
        Promise.all([RanksAPI.getUserMaxWeights(session.user.id), streakPromise])
          .then(async ([weights, streakInfo]) => {
            if (weights.length && streakInfo) {
              const { data: stats } = await supabase
                .from("user_stats")
                .select("weight, gender")
                .eq("user_id", session.user.id)
                .single();
              const bw = stats?.weight || 75;
              const gn = stats?.gender || "M";
              const calculated = calculateAllRanks(
                weights,
                bw,
                gn as any,
                streakInfo.streak,
              );
              await RanksAPI.syncRankToProfile(
                session.user.id,
                calculated.avgIndex,
                calculated.generalTier,
              );
            }
          })
          .catch(() => {});
      } else {
        setStreakLoading(false);
      }
    } catch (e) {
      console.error("[HomeScreen] Refresh failed:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCheckIn = async () => {
    if (checkingIn || streakLoading || streak.todayCount >= 1) return;
    setCheckingIn(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const result = await AttendanceAPI.checkIn(userId);
      console.log("[CheckIn] result:", result);
      if (result.success) {
        const updated = await AttendanceAPI.getStreakData(userId);
        setStreakData(updated);
      } else if (!result.alreadyMax) {
        setErrorAlert("No pudimos registrar tu asistencia. Revisa tu conexión e intenta de nuevo.");
      }
    } catch (e) {
      console.error("[HomeScreen] Check-in failed:", e);
      setErrorAlert("No pudimos registrar tu asistencia. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  const handleBannerPress = (banner: Banner) =>
    router.push({
      pathname: "/banner-details",
      params: { id: banner.id, type: "promo" },
    });
  const handleEventPress = (event: any) =>
    router.push({
      pathname: "/banner-details",
      params: { id: event.id, type: "event" },
    });

  const getRoutineForDay = (dayIdx: number) => {
    return userSchedule?.find((s) => s.day_of_week === dayIdx)?.routine;
  };

  const handleStartTodayWorkout = async () => {
    const todayRoutine = getRoutineForDay(new Date().getDay());
    if (!todayRoutine || !profile) return;

    try {
      setStartingWorkout(true);
      const routine = await RoutinesAPI.getRoutineDetail(todayRoutine.id);
      if (!routine) return;
      startWorkout(routine);
    } catch (e) {
      console.error("[HomeScreen] Failed to start workout:", e);
      setErrorAlert("No pudimos cargar tu rutina de hoy. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setStartingWorkout(false);
    }
  };

  if (loading) {
    return <HomeSkeleton />;
  }

  const todayRoutine = getRoutineForDay(new Date().getDay());

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />

      {/* Background */}
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
      {/* Top glow */}
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        >
          {/* ── Header ── */}
          <HomeHeader
            profile={profile}
            streakData={streak}
            onProfilePress={goToProfile}
          />

          {/* ── Load Error Banner ── */}
          {loadError && (
            <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
              <Ionicons name="cloud-offline-outline" size={18} color={theme.error} />
              <Text style={styles.errorBannerText}>
                No pudimos actualizar tu información. Toca para reintentar.
              </Text>
              <Ionicons name="refresh" size={16} color={theme.error} />
            </TouchableOpacity>
          )}

          {/* ── Attendance Check-in ── */}
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceInfo}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.accent}
              />
              <Text style={styles.attendanceInfoText}>
                {streakLoading
                  ? "Cargando racha..."
                  : streak.weekDays >= 4
                    ? "¡Racha asegurada esta semana!"
                    : `${streak.weekDays}/4 días esta semana`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkInBtn,
                streak.todayCount >= 1 && styles.checkInBtnDone,
              ]}
              onPress={handleCheckIn}
              disabled={streakLoading || streak.todayCount >= 1 || checkingIn}
              activeOpacity={0.8}
            >
              {streakLoading ? (
                <ActivityIndicator size="small" color={theme.textMuted} />
              ) : streak.todayCount >= 1 ? (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.success}
                  />
                  <Text
                    style={[styles.checkInBtnText, { color: theme.success }]}
                  >
                    Registrado hoy
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={styles.checkInBtnText}>
                    {checkingIn ? "Registrando..." : "Marcar asistencia"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Today's Workout (hero) ── */}
          {todayRoutine && (
            <View style={{ marginHorizontal: 20, marginTop: 8 }}>
              <TodayWorkoutCard
                routine={todayRoutine}
                loading={startingWorkout}
                onPress={handleStartTodayWorkout}
              />
            </View>
          )}

          {/* ── Promo Carousel ── */}
          <View style={styles.carouselWrap}>
            <PromoCarousel data={data.promos} onPressItem={handleBannerPress} />
          </View>

          {/* ── Upcoming Events ── */}
          {data.events?.length > 0 && (
            <EventsTimeline data={data.events} onPressItem={handleEventPress} />
          )}

          {/* ── Top 3 Rankings ── */}
          {data.leaderboard.length > 0 && (
            <TopThreePodium
              data={data.leaderboard.slice(0, 3).map((item: any) => ({
                rank: item.position,
                name: item.name,
                score: item.rankIndex,
                avatar: item.avatar,
                tier: item.rankTier,
              }))}
              onSeeAll={() => router.push("/(tabs)/rankings")}
            />
          )}

          {/* ── Nutrition ── */}
          {data.nutrition && (
            <NutritionCard data={data.nutrition} onPress={goToNutrition} />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <CustomModal
        visible={showStreakLost}
        type="error"
        title="Racha Perdida"
        message="¡Oh no! Tu racha ha vuelto a 0. Recuerda que la 'maestría' requiere constancia. ¡No te rindas y empieza una nueva racha hoy!"
        buttonText="Aceptar el reto"
        onClose={() => setShowStreakLost(false)}
      />

      <CustomModal
        visible={!!errorAlert}
        type="error"
        title="Algo salió mal"
        message={errorAlert || ""}
        onClose={() => setErrorAlert(null)}
      />

      <CustomModal {...replaceModalProps} />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 220,
    },
    scroll: {
      paddingBottom: 20,
    },

    // Header removed to HomeHeader.tsx

    // ── Load error banner ───────────────────────────────────────────────────────
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.error + "15",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.error + "40",
      gap: 10,
    },
    errorBannerText: {
      flex: 1,
      color: theme.error,
      fontSize: 12,
      fontWeight: "600",
    },

    // ── Attendance card ──────────────────────────────────────────────────────────
    attendanceCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 20,
      marginBottom: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    attendanceInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    attendanceInfoText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "500",
    },
    checkInBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: theme.accent,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
    },
    checkInBtnDone: {
      backgroundColor: "rgba(52,211,153,0.12)",
      borderWidth: 1,
      borderColor: "rgba(52,211,153,0.3)",
    },
    checkInBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatar: {
      width: 38,
      height: 38,
    },

    // ── Carousel wrapper ─────────────────────────────────────────────────────────
    carouselWrap: {
      marginTop: 16,
    },
  });

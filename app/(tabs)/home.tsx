
import { Banner, BannersAPI } from '@/api/banners';
import { RoutinesAPI } from '@/api/routines';
import { ContentAPI } from '@/api/content';
import { LeaderboardAPI } from '@/api/leaderboard';
import { NutritionAPI } from '@/api/nutrition';
import { UserAPI } from '@/api/user';
import { CrowdMeter, PromoCarousel } from '@/components/home/HeaderComponents';
import { HomeSkeleton } from '@/components/home/HomeSkeleton';
import { EventsTimeline, NutritionCard, TopThreePodium } from '@/components/home/SectionComponents';
import { MOCK_LEADERBOARD, MOCK_NUTRITION, MOCK_USER } from '@/constants/mocks';
import { theme } from '@/constants/theme';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useGymOccupancy } from '@/hooks/useGymOccupancy';
import { RadarService } from '@/lib/radar';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { withTimeout } from '@/utils/async';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { RanksAPI, calculateAllRanks } from '@/api/ranks';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function LocationPermissionNotice({ onAction }: { onAction: () => void }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      const status = await RadarService.getPermissionsStatus();
      if (status === 'NOT_DETERMINED' || status === 'DENIED') setVisible(true);
    };
    checkStatus().catch(e => console.error('[LocationPermissionNotice]', e));
  }, []);

  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.noticeContainer} onPress={onAction} activeOpacity={0.85}>
      <LinearGradient
        colors={theme.gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.noticeGradient}
      >
        <View style={styles.noticeIconBox}>
          <Ionicons name="location" size={18} color="#fff" />
        </View>
        <View style={styles.noticeTextBlock}>
          <Text style={styles.noticeTitle}>Activa tu ubicación</Text>
          <Text style={styles.noticeSubtitle}>Regístrate automáticamente al llegar</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { goToLogin, goToProfile, goToNutrition, goToScanner, goToRankings, goToLocationPermission } = useAppNavigation();

  const {
    profile, setProfile,
    activeDiet, setActiveDiet,
    promos, setPromos,
    events, setEvents,
    leaderboard, setLeaderboard,
    userSchedule, setUserSchedule,
    setActiveWorkout,
    isHydrated,
  } = useAppStore();

  const [loading, setLoading] = useState(!isHydrated);
  const [refreshing, setRefreshing] = useState(false);
  const { count: gymCount, maxCapacity } = useGymOccupancy();

  const [data, setData] = useState<any>({
    user: MOCK_USER,
    promos: [],
    events: [],
    leaderboard: MOCK_LEADERBOARD,
    nutrition: MOCK_NUTRITION,
  });

  useEffect(() => {
    if (isHydrated) {
      const user = profile ? { name: profile.username || 'Atleta', avatar: profile.photo_url } : MOCK_USER;
      const nutritionData = activeDiet ? {
        title: activeDiet.name,
        calories: `${activeDiet.calories} kcal`,
        protein: `Proteína: ${activeDiet.macros.protein}`,
        label: 'TU PLAN PERSONAL',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop',
      } : {
        title: '¡Crea tu Plan Nutricional!',
        calories: 'Tus Macros',
        protein: 'Tus Objetivos',
        label: '¿AÚN SIN PLAN?',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop',
      };
      setData((prev: any) => ({
        ...prev,
        user,
        promos: promos || [],
        events: events || [],
        leaderboard: leaderboard?.length ? leaderboard : MOCK_LEADERBOARD,
        nutrition: nutritionData,
      }));
      if (loading && profile) setLoading(false);
    }
  }, [isHydrated, profile, activeDiet, promos, events, leaderboard]);

  useEffect(() => {
    if (isHydrated) loadData();
  }, [isHydrated]);

  const loadData = async () => {
    try {
      const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 20000, 'Error recuperando sesión')) as any;
      if (!session) { goToLogin(); return; }

      await UserAPI.syncProfile(session.user);
      const [newProfile, newPromos, newEvents, newLeaderboard, newNutrition] = await Promise.all([
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

      // Also get schedule for the CTA
      if (session.user.id) {
        RoutinesAPI.getUserSchedule(session.user.id).then(setUserSchedule).catch(() => {});
      }

      // SYNC RANK TO DB (Optimization: only if we have weights)
      if (session.user.id) {
        RanksAPI.getUserMaxWeights(session.user.id).then(async (weights) => {
          if (weights.length) {
            // Get user stats for weight/gender
            const { data: stats } = await supabase.from('user_stats').select('weight, gender').eq('user_id', session.user.id).single();
            const bw = stats?.weight || 75;
            const gn = stats?.gender || 'M';
            const calculated = calculateAllRanks(weights, bw, gn as any);
            await RanksAPI.syncRankToProfile(session.user.id, calculated.avgIndex, calculated.generalTier);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.error('[HomeScreen] Refresh failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadData(); };
  const handleBannerPress = (banner: Banner) => router.push({ pathname: '/banner-details', params: { id: banner.id, type: 'promo' } });
  const handleEventPress = (event: any) => router.push({ pathname: '/banner-details', params: { id: event.id, type: 'event' } });

  const getRoutineForDay = (dayIdx: number) => {
    return userSchedule?.find(s => s.day_of_week === dayIdx)?.routine;
  };

  const handleStartTodayWorkout = async () => {
    const todayRoutine = getRoutineForDay(new Date().getDay());
    if (!todayRoutine || !profile) return;

    try {
      setLoading(true);
      const routine = await RoutinesAPI.getRoutineDetail(todayRoutine.id);
      if (!routine) return;

      const activeWorkout = {
        routineId: routine.id,
        routineName: routine.name,
        startTime: new Date().toISOString(),
        exercises: routine.exercises?.map(re => ({
          exerciseId: re.exercise_id,
          name: re.exercise?.name || 'Ejercicio',
          sets: Array.from({ length: re.sets }).map((_, i) => ({
            set: i + 1,
            reps: parseInt(re.reps) || 10,
            weight: 0,
            completed: false,
          }))
        })) || []
      };

      setActiveWorkout(activeWorkout);
      router.push('/workout-session');
    } catch (e) {
      console.error('[HomeScreen] Failed to start workout:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      {/* Top glow */}
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hola, {profile?.username || 'Atleta'}</Text>
              <TouchableOpacity style={styles.pointsBadge} onPress={goToRankings}>
                <Ionicons name="flash" size={13} color={theme.accent} />
                <Text style={styles.pointsText}>{profile?.total_points || 0} pts</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={goToScanner}>
                <Ionicons name="qr-code-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarBtn} onPress={goToProfile}>
                {profile?.photo_url ? (
                  <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Crowd Meter ── */}
          <CrowdMeter count={gymCount} maxCapacity={maxCapacity} />

          {/* ── Location notice ── */}
          <LocationPermissionNotice onAction={goToLocationPermission} />

          {/* ── Promo Carousel ── */}
          <View style={styles.carouselWrap}>
            <PromoCarousel data={data.promos} onPressItem={handleBannerPress} />
          </View>

          {/* ── Today's Workout CTA ── */}
          {getRoutineForDay(new Date().getDay()) && (
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <TouchableOpacity
                style={styles.ctaCard}
                onPress={handleStartTodayWorkout}
              >
                <LinearGradient
                  colors={['rgba(155, 147, 255, 0.1)', 'rgba(108, 99, 255, 0.05)']}
                  style={styles.ctaGradient}
                >
                  <View style={styles.ctaIcon}>
                    <Ionicons name="play" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ctaTitle}>Entrenamiento de hoy</Text>
                    <Text style={styles.ctaSubtitle}>
                      {getRoutineForDay(new Date().getDay())?.name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Upcoming Events ── */}
          {data.events?.length > 0 && (
            <EventsTimeline data={data.events} onPressItem={handleEventPress} />
          )}

          {/* ── Top 3 Rankings ── */}
          <TopThreePodium data={data.leaderboard.slice(0, 3)} onSeeAll={() => router.push('/rankings')} />

          {/* ── Nutrition ── */}
          <NutritionCard data={data.nutrition} onPress={goToNutrition} />

          <View style={{ height: 100 }} />
        </ScrollView>
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
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  scroll: {
    paddingBottom: 20,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    gap: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pointsText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 38,
    height: 38,
  },

  // ── Location notice ──────────────────────────────────────────────────────────
  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  noticeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  noticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTextBlock: {
    flex: 1,
  },
  noticeTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  noticeSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 1,
  },

  // ── Carousel wrapper ─────────────────────────────────────────────────────────
  carouselWrap: {
    marginTop: 16,
  },
  ctaCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: theme.accent,
    marginTop: 1,
  },
});

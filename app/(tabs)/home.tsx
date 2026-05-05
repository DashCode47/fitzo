
import { Banner, BannersAPI } from '@/api/banners';
import { RoutinesAPI } from '@/api/routines';
import { ContentAPI } from '@/api/content';
import { LeaderboardAPI } from '@/api/leaderboard';
import { NutritionAPI } from '@/api/nutrition';
import { UserAPI } from '@/api/user';
import { AttendanceAPI, StreakData } from '@/api/attendance';
import { CrowdMeter, PromoCarousel } from '@/components/home/HeaderComponents';
import { CustomModal } from '@/components/ui/CustomModal';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSkeleton } from '@/components/home/HomeSkeleton';
import { EventsTimeline, NutritionCard, TopThreePodium } from '@/components/home/SectionComponents';
import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
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

function LocationPermissionNotice({ onAction, theme, styles }: { onAction: () => void, theme: AppTheme, styles: any }) {
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
  const { goToLogin, goToProfile, goToNutrition, goToScanner, goToLocationPermission } = useAppNavigation();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const {
    profile, setProfile,
    activeDiet, setActiveDiet,
    promos, setPromos,
    events, setEvents,
    leaderboard, setLeaderboard,
    userSchedule, setUserSchedule,
    setActiveWorkout,
    isHydrated,
    lastStreak, setLastStreak
  } = useAppStore();
  
  const [loading, setLoading] = useState(!isHydrated);
  const [refreshing, setRefreshing] = useState(false);
  const { count: gymCount, maxCapacity } = useGymOccupancy();
  const [streakData, setStreakData] = useState<StreakData>({ streak: 0, weekDays: 0, todayCount: 0 });
  const [checkingIn, setCheckingIn] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);

  const [data, setData] = useState<any>({
    promos: [],
    events: [],
    leaderboard: [],
    nutrition: null,
  });

  useEffect(() => {
    if (isHydrated) {
      const nutritionData = activeDiet ? {
        title: activeDiet.name,
        calories: `${activeDiet.calories} kcal`,
        protein: `Proteína: ${activeDiet.macros.protein}`,
        label: 'TU PLAN PERSONAL',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop',
      } : null;
      setData((prev: any) => ({
        ...prev,
        promos: promos || [],
        events: events || [],
        leaderboard: leaderboard || [],
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

      if (session.user.id) {
        RoutinesAPI.getUserSchedule(session.user.id).then(setUserSchedule).catch(() => {});
      }

      // SYNC RANK TO DB (Optimization: only if we have weights)
      if (session.user.id) {
        Promise.all([
          RanksAPI.getUserMaxWeights(session.user.id),
          AttendanceAPI.getStreakData(session.user.id)
        ]).then(async ([weights, streakInfo]) => {
          // Detect streak loss
          if (streakInfo.streak === 0 && lastStreak > 0) {
            setShowStreakLost(true);
          }
          setLastStreak(streakInfo.streak);
          setStreakData(streakInfo);

          if (weights.length) {
            const { data: stats } = await supabase.from('user_stats').select('weight, gender').eq('user_id', session.user.id).single();
            const bw = stats?.weight || 75;
            const gn = stats?.gender || 'M';
            const calculated = calculateAllRanks(weights, bw, gn as any, streakInfo.streak);
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

  const handleCheckIn = async () => {
    if (checkingIn || streakData.todayCount >= 1) return;
    setCheckingIn(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const result = await AttendanceAPI.checkIn(userId);
      console.log('[CheckIn] result:', result);
      if (result.success) {
        const updated = await AttendanceAPI.getStreakData(userId);
        setStreakData(updated);
      }
    } catch (e) {
      console.error('[HomeScreen] Check-in failed:', e);
    } finally {
      setCheckingIn(false);
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
      <StatusBar style={theme.bgDeep === '#FAFAFA' ? 'dark' : 'light'} />

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
          <HomeHeader
            profile={profile}
            streakData={streakData}
            onScannerPress={goToScanner}
            onProfilePress={goToProfile}
          />

          {/* ── Attendance Check-in ── */}
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceInfo}>
              <Ionicons name="calendar-outline" size={16} color={theme.accent} />
              <Text style={styles.attendanceInfoText}>
                {streakData.weekDays >= 4
                  ? '¡Racha asegurada esta semana!'
                  : `${streakData.weekDays}/4 días esta semana`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkInBtn,
                streakData.todayCount >= 1 && styles.checkInBtnDone,
              ]}
              onPress={handleCheckIn}
              disabled={streakData.todayCount >= 1 || checkingIn}
              activeOpacity={0.8}
            >
              {streakData.todayCount >= 1 ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.checkInBtnText, { color: theme.success }]}>Registrado hoy</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={styles.checkInBtnText}>
                    {checkingIn ? 'Registrando...' : 'Marcar asistencia'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Crowd Meter ── */}
          <CrowdMeter count={gymCount} maxCapacity={maxCapacity} />

          {/* ── Location notice ── */}
          <LocationPermissionNotice onAction={goToLocationPermission} theme={theme} styles={styles} />

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
          {data.leaderboard.length > 0 && (
            <TopThreePodium
              data={data.leaderboard.slice(0, 3).map((item: any) => ({
                rank: item.position,
                name: item.name,
                score: item.rankIndex,
                avatar: item.avatar,
                tier: item.rankTier,
              }))}
              onSeeAll={() => router.push('/(tabs)/rankings')}
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
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
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

  // Header removed to HomeHeader.tsx

  // ── Attendance card ──────────────────────────────────────────────────────────
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendanceInfoText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  checkInBtnDone: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  checkInBtnText: {
    color: '#fff',
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


import { ContentAPI } from '@/api/content';
import { LeaderboardAPI } from '@/api/leaderboard';
import { NutritionAPI } from '@/api/nutrition';
import { UserAPI } from '@/api/user';
import { CrowdMeter, PromoCarousel, TopBar } from '@/components/home/HeaderComponents';
import { EventsTimeline, Leaderboard, NutritionCard } from '@/components/home/SectionComponents';
import { MOCK_CROWD, MOCK_EVENTS, MOCK_LEADERBOARD, MOCK_NUTRITION, MOCK_PROMOS, MOCK_USER } from '@/constants/mocks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';

import { useSegments } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

export default function HomeScreen() {
  const segments = useSegments();
  const { goToLogin, goToProfile, goToNutrition } = useAppNavigation();
  
  // Zustand Store
  const { 
    profile, setProfile, 
    activeDiet, setActiveDiet,
    promos, setPromos,
    events, setEvents,
    leaderboard, setLeaderboard,
    isHydrated 
  } = useAppStore();

  const [loading, setLoading] = useState(!isHydrated);
  const [data, setData] = useState<any>({
    user: MOCK_USER,
    crowd: MOCK_CROWD,
    promos: MOCK_PROMOS,
    events: MOCK_EVENTS,
    leaderboard: MOCK_LEADERBOARD,
    nutrition: MOCK_NUTRITION,
  });

  // Effect to sync store data with local view data
  useEffect(() => {
    if (isHydrated) {
      const userProfile = profile ? (Array.isArray(profile.profile) ? profile.profile[0] : profile.profile) : null;
      
      const user = userProfile ? { 
         name: userProfile.firstName, 
         avatar: userProfile.photoUrl 
      } : MOCK_USER;

      const nutritionData = activeDiet ? {
        title: activeDiet.name,
        calories: `${activeDiet.calories} kcal`,
        protein: `Proteína: ${activeDiet.macros.protein}`,
        label: 'TU PLAN PERSONAL',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop'
      } : {
        title: '¡Crea tu Plan Nutricional!',
        calories: 'Tus Macros',
        protein: 'Tus Objetivos',
        label: '¿AÚN SIN PLAN?',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop'
      };

      setData({
        user,
        crowd: MOCK_CROWD,
        promos: promos && promos.length ? promos : MOCK_PROMOS,
        events: events && events.length ? events : MOCK_EVENTS,
        leaderboard: leaderboard && leaderboard.length ? leaderboard : MOCK_LEADERBOARD,
        nutrition: nutritionData,
      });
      
      if (loading && profile) {
        setLoading(false);
      }
    }
  }, [isHydrated, profile, activeDiet, promos, events, leaderboard]);

  useEffect(() => {
    // Only load data if we are actually on the home screen and store is ready
    const currentRoute = segments.join('/');
    if (currentRoute.includes('home') && isHydrated) {
      loadData();
    }
  }, [segments, isHydrated]);

  const loadData = async () => {
    try {
      // 1. Wait for session to be restored
      const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 20000, "Error recuperando sesión")) as any;
      
      if (!session) {
        goToLogin();
        return;
      }

      // 2. Refresh data in background
      const [newProfile, newPromos, newEvents, newLeaderboard, newNutrition] = await Promise.all([
        UserAPI.getProfile(session.user.id).catch(() => profile),
        ContentAPI.getPromotions().catch(() => promos || MOCK_PROMOS),
        ContentAPI.getEvents().catch(() => events || MOCK_EVENTS),
        LeaderboardAPI.getLeaderboard().catch(() => leaderboard || MOCK_LEADERBOARD),
        NutritionAPI.getActiveDiet(session.user.id).catch(() => activeDiet),
      ]);

      // Update store
      if (newProfile) setProfile(newProfile);
      if (newPromos) setPromos(newPromos);
      if (newEvents) setEvents(newEvents);
      if (newLeaderboard) setLeaderboard(newLeaderboard);
      if (newNutrition !== undefined) setActiveDiet(newNutrition);

    } catch (e) {
      console.error("[HomeScreen] Refresh failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
        <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center', backgroundColor: 'black'}]}>
             <ActivityIndicator size="large" color={GOLD_COLOR} />
        </SafeAreaView>
     );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground 
        source={require('../../assets/images/login.jpg')} 
        style={styles.backgroundImage}
      >
         <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
            style={styles.gradientOverlay}
         >
            <SafeAreaView style={styles.safeArea}>
              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Top Bar */}
                    <TopBar user={data.user} onPressProfile={goToProfile} />

                    {/* Crowd Meter */}
                    <CrowdMeter data={data.crowd} />

                    {/* Promo Carousel */}
                    <View style={{ marginTop: 16 }}>
                        <PromoCarousel data={data.promos} />
                    </View>

                    {/* Upcoming Events */}
                    <EventsTimeline data={data.events} />

                    {/* Rankings */}
                    <Leaderboard data={data.leaderboard} />

                    {/* Nutrition Plan */}
                    <NutritionCard data={data.nutrition} onPress={goToNutrition} />

                    {/* Bottom Padding for Tab Bar */}
                    <View style={{ height: 80 }} />
              </ScrollView>
            </SafeAreaView>
         </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
      flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

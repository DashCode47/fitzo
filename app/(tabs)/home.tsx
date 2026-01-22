
import { Banner, BannersAPI } from '@/api/banners';
import { ContentAPI } from '@/api/content';
import { LeaderboardAPI } from '@/api/leaderboard';
import { NutritionAPI } from '@/api/nutrition';
import { UserAPI } from '@/api/user';
import { CrowdMeter, PromoCarousel } from '@/components/home/HeaderComponents';
import { EventsTimeline, NutritionCard, TopThreePodium } from '@/components/home/SectionComponents';
import { MOCK_CROWD, MOCK_EVENTS, MOCK_LEADERBOARD, MOCK_NUTRITION, MOCK_USER } from '@/constants/mocks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';


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
    promos: [],
    events: MOCK_EVENTS,
    leaderboard: MOCK_LEADERBOARD,
    nutrition: MOCK_NUTRITION,
  });

  // Effect to sync store data with local view data
  useEffect(() => {
    if (isHydrated) {
      const user = profile ? { 
         name: profile.username || 'Atleta', 
         avatar: profile.photo_url 
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
        promos: promos || [],
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
      const { data: { session } } = (await withTimeout(supabase.auth.getSession(), 20000, "Error recuperando sesión")) as any;
      if (!session) {
        goToLogin();
        return;
      }

      // 1. Sync Profile on Login/Refresh
      await UserAPI.syncProfile(session.user);

      // 2. Refresh data in background
      const [newProfile, newPromos, newEvents, newLeaderboard, newNutrition] = await Promise.all([
        UserAPI.getProfile(session.user.id).catch(() => profile),
        BannersAPI.getBanners().catch(() => promos || []),
        ContentAPI.getEvents().catch(() => events || MOCK_EVENTS),
        LeaderboardAPI.getLeaderboard().catch(() => leaderboard || MOCK_LEADERBOARD),
        NutritionAPI.getActiveDiet(session.user.id).catch(() => activeDiet),
      ]);
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

  const handleBannerPress = (banner: Banner) => {
    if (banner.external_link) {
      Linking.openURL(banner.external_link).catch(err => console.error("Couldn't load page", err));
    } else {
      router.push({
        pathname: '/banner-details',
        params: { id: banner.id }
      });
    }
  };

  if (loading) {
     return (
        <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center', backgroundColor: 'black'}]}>
             <ActivityIndicator size="large" color={GOLD_COLOR} />
        </SafeAreaView>
     );
  }

  const router = useRouter();

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
                    {/* Top Bar with Points and Scanner */}
                    <View style={styles.header}>
                      <View>
                        <Text style={styles.greeting}>Hola, {profile?.username || 'Atleta'}</Text>
                        <View style={styles.pointsContainer}>
                          <Ionicons name="flash" size={16} color="#FFD700" />
                          <Text style={styles.pointsText}>{profile?.total_points || 0} PTS</Text>
                        </View>
                      </View>
                      <View style={styles.headerIcons}>
                        <TouchableOpacity 
                          style={styles.iconButton} 
                          onPress={() => router.push('/scanner')}
                        >
                          <Ionicons name="qr-code-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.profileButton} 
                          onPress={goToProfile}
                        >
                          {profile?.photo_url ? (
                            <Image 
                              source={{ uri: profile.photo_url }} 
                              style={styles.avatar} 
                            />
                          ) : (
                            <Ionicons name="person-circle-outline" size={32} color="#FFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Crowd Meter */}
                    <CrowdMeter data={data.crowd} />

                    {/* Promo Carousel */}
                    <View style={{ marginTop: 16 }}>
                        <PromoCarousel data={data.promos} onPressItem={handleBannerPress} />
                    </View>

                    {/* Upcoming Events */}
                    <EventsTimeline data={data.events} />

                    {/* Top 3 Rankings */}
                    <TopThreePodium 
                      data={data.leaderboard.slice(0, 3)} 
                      onSeeAll={() => router.push('/rankings')}
                    />

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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 15,
    padding: 5,
  },
  profileButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

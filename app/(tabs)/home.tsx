
import { Banner, BannersAPI } from '@/api/banners';
import { ContentAPI } from '@/api/content';
import { LeaderboardAPI } from '@/api/leaderboard';
import { NutritionAPI } from '@/api/nutrition';
import { UserAPI } from '@/api/user';
import { CrowdMeter, PromoCarousel } from '@/components/home/HeaderComponents';
import { EventsTimeline, NutritionCard, TopThreePodium } from '@/components/home/SectionComponents';
import { MOCK_CROWD, MOCK_EVENTS, MOCK_LEADERBOARD, MOCK_NUTRITION, MOCK_USER } from '@/constants/mocks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { RadarService } from '@/lib/radar';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';


import { useAppStore } from '@/store/useAppStore';

function LocationPermissionNotice({ onAction }: { onAction: () => void }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      const status = await RadarService.getPermissionsStatus();
      if (status === 'NOT_DETERMINED' || status === 'DENIED') {
        setVisible(true);
      }
    };
    checkStatus().catch(e => console.error('[LocationPermissionNotice] checkStatus failed:', e));
  }, []);

  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.noticeContainer} onPress={onAction}>
      <LinearGradient
        colors={[GOLD_COLOR, '#8a6d2b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.noticeGradient}
      >
        <View style={styles.noticeContent}>
          <View style={styles.noticeIconBox}>
            <Ionicons name="location" size={20} color="white" />
          </View>
          <View style={styles.noticeTextBlock}>
            <Text style={styles.noticeTitle}>ACTIVA TU UBICACIÓN</Text>
            <Text style={styles.noticeSubtitle}>Regístrate automáticamente al llegar.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const segments = useSegments();
  const router = useRouter();
  const { goToLogin, goToProfile, goToNutrition, goToScanner, goToRankings, goToLocationPermission } = useAppNavigation();
  
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
  const [refreshing, setRefreshing] = useState(false);

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

      setData((prev: any) => ({
        ...prev,
        user,
        promos: promos || [],
        events: events && events.length ? events : MOCK_EVENTS,
        leaderboard: leaderboard && leaderboard.length ? leaderboard : MOCK_LEADERBOARD,
        nutrition: nutritionData,
      }));
      
      if (loading && profile) {
        setLoading(false);
      }
    }
  }, [isHydrated, profile, activeDiet, promos, events, leaderboard]);

  useEffect(() => {
    // Only load data once when store is hydrated. 
    // This prevents re-fetching every time you switch tabs or go back.
    if (isHydrated) {
      loadData();
    }
  }, [isHydrated]); // Removed 'segments' to stop triggering on navigation back

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
      const [newProfile, newPromos, newEvents, newLeaderboard, newNutrition, newCrowd] = await Promise.all([
        UserAPI.getProfile(session.user.id).catch(() => profile),
        BannersAPI.getBanners().catch(() => promos || []),
        ContentAPI.getEvents().catch(() => events || MOCK_EVENTS),
        LeaderboardAPI.getLeaderboard().catch(() => leaderboard || MOCK_LEADERBOARD),
        NutritionAPI.getActiveDiet(session.user.id).catch(() => activeDiet),
        ContentAPI.getCrowdStatus().catch(() => MOCK_CROWD)
      ]);
      if (newProfile) setProfile(newProfile);
      if (newPromos) setPromos(newPromos);
      if (newEvents) setEvents(newEvents);
      if (newLeaderboard) setLeaderboard(newLeaderboard);
      if (newNutrition !== undefined) setActiveDiet(newNutrition);

      setData((prev: any) => ({ ...prev, crowd: newCrowd }));

    } catch (e) {
      console.error("[HomeScreen] Refresh failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBannerPress = (banner: Banner) => {
    router.push({
      pathname: '/banner-details',
      params: { id: banner.id, type: 'promo' }
    });
  };

  const handleEventPress = (event: any) => {
    router.push({
      pathname: '/banner-details',
      params: { id: event.id, type: 'event' }
    });
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
              <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={handleRefresh} 
                    tintColor={GOLD_COLOR}
                    colors={[GOLD_COLOR]}
                  />
                }
              >
                    {/* Top Bar with Points and Scanner */}
                    <View style={styles.header}>
                      <View>
                        <Text style={styles.greeting}>Hola, {profile?.username || 'Atleta'}</Text>
                        <TouchableOpacity style={styles.pointsContainer} onPress={() => goToRankings()}>
                          <Ionicons name="flash" size={16} color="#FFD700" />
                          <Text style={styles.pointsText}>{profile?.total_points || 0} PTS</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.headerIcons}>
                        <TouchableOpacity 
                          style={styles.iconButton} 
                          onPress={() => goToScanner()}
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

                    {/* Radar Location Permission Reminder */}
                    <LocationPermissionNotice onAction={goToLocationPermission} />

                    {/* Promo Carousel */}
                    <View style={{ marginTop: 16 }}>
                        <PromoCarousel data={data.promos} onPressItem={handleBannerPress} />
                    </View>

                    {/* Upcoming Events */}
                    <EventsTimeline data={data.events} onPressItem={handleEventPress} />

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
  noticeContainer: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: GOLD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  noticeGradient: {
    padding: 16,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noticeTextBlock: {
    flex: 1,
  },
  noticeTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  noticeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});

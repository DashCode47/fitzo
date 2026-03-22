import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RadarService } from '@/lib/radar';
import { useAppStore } from '@/store/useAppStore';
import { Alert } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { profile } = useAppStore();

  useEffect(() => {
    RadarService.initialize();
  }, []);

  useEffect(() => {
    const startRadar = async () => {
      if (profile?.id) {
        console.log('[RootLayout] Activating Radar for:', profile.id);
        
        // 1. First ensure we have permissions 
        const status = await RadarService.requestPermissions();
        console.log('[RootLayout] Radar Permission Status:', status);

        // 2. Identify and Activate with correct mode
        const mode = __DEV__ ? 'continuous' : 'responsive';
        await RadarService.activate(
          profile.id, 
          { 
            name: profile.username || 'Atleta',
            email: profile.email || '' 
          },
          ['gym_member', profile.role || 'CLIENT'],
          mode
        );
      }
    };

    startRadar().catch(e => console.error('[RootLayout] startRadar failed:', e));
  }, [profile?.id]);

  useEffect(() => {
    // Escuchar eventos de Radar (entradas/salidas)
    RadarService.onEvents((result) => {
      const { events } = result;
      if (!Array.isArray(events)) return;
      events.forEach((event: any) => {
        if (event.type === 'user.entered_geofence') {
          Alert.alert(
            "¡Bienvenido!",
            `Has entrado a: ${event.geofence?.description || 'Gimnasio'}`,
            [{ text: "Entrenar 🦾" }]
          );
        } else if (event.type === 'user.exited_geofence') {
          console.log(`[Radar] User exited geofence: ${event.geofence?._id}`);
          Alert.alert(
            "¡Hasta pronto!",
            "Has salido del gimnasio. ¡Buen entrenamiento!",
            [{ text: "OK" }]
          );
        }
      });
    });

    return () => {
      RadarService.off();
    };
  }, []);

  useEffect(() => {
    console.log('[RootLayout] Current segments:', segments);
  }, [segments]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="routine-detail" />
          <Stack.Screen name="routine-create" options={{ presentation: 'modal' }} />
          <Stack.Screen name="workout-session" options={{ gestureEnabled: false }} />
          <Stack.Screen name="schedule-edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="exercise-progress" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

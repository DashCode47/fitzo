import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAppStore } from "@/store/useAppStore";

import { NotificationService } from "@/services/notifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { profile } = useAppStore();

  useEffect(() => {
    if (profile?.id) {
      console.log(
        "[RootLayout] Registering for Notifications for:",
        profile.id,
      );
      NotificationService.registerForPushNotificationsAsync(profile.id)
        .then((token) =>
          console.log("[RootLayout] Notification Token registered:", token),
        )
        .catch((err) =>
          console.error("[RootLayout] Notification registration failed:", err),
        );
    }
  }, [profile?.id]);

  useEffect(() => {
    console.log("[RootLayout] Current segments:", segments);
  }, [segments]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="routine-detail" />
          <Stack.Screen
            name="routine-create"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="workout-session"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="schedule-edit"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="exercise-progress" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

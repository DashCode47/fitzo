import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CustomModal } from "@/components/ui/CustomModal";
import { GEOFENCE_ID } from "@/env";
import { RadarService } from "@/lib/radar";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";

import { NotificationService } from "@/services/notifications";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { profile } = useAppStore();

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "info";
    buttonText: string;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttonText: "OK",
  });

  useEffect(() => {
    RadarService.initialize();
  }, []);

  useEffect(() => {
    const startRadar = async () => {
      if (profile?.id) {
        console.log("[RootLayout] Activating Radar for:", profile.id);

        // 1. First ensure we have permissions
        const status = await RadarService.requestPermissions();
        console.log("[RootLayout] Radar Permission Status:", status);

        // 2. Identify and Activate with correct mode
        const mode = __DEV__ ? "continuous" : "responsive";
        await RadarService.activate(
          profile.id,
          {
            name: profile.username || "Atleta",
            email: profile.email || "",
          },
          ["gym_member", profile.role || "CLIENT"],
          mode,
        );
      }
    };

    startRadar().catch((e) =>
      console.error("[RootLayout] startRadar failed:", e),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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
    if (!profile?.id) return;

    const checkGeofenceOnOpen = async () => {
      const { data: openVisit } = await supabase
        .from("gym_visits")
        .select("id")
        .eq("user_id", profile.id)
        .eq("geofence_id", GEOFENCE_ID)
        .is("exited_at", null)
        .maybeSingle();

      if (openVisit) {
        console.log(
          "[AppOpen] User already has open visit, skipping trackOnce",
        );
        return;
      }

      console.log("[AppOpen] No open visit found, calling trackOnce()");
      const result = await RadarService.trackOnce();
      console.log(
        "[AppOpen] trackOnce result:",
        result?.status,
        "events:",
        result?.events?.length ?? 0,
      );
    };

    checkGeofenceOnOpen().catch((e) =>
      console.error("[AppOpen] checkGeofenceOnOpen failed:", e),
    );

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          checkGeofenceOnOpen().catch((e) =>
            console.error(
              "[AppOpen] checkGeofenceOnOpen on foreground failed:",
              e,
            ),
          );
        }
      },
    );

    return () => subscription.remove();
  }, [profile?.id]);

  useEffect(() => {
    // Escuchar eventos de Radar (entradas/salidas)
    RadarService.onEvents((result) => {
      const { events } = result;
      if (!Array.isArray(events)) return;
      events.forEach((event: any) => {
        if (event.type === "user.entered_geofence") {
          setModalConfig({
            visible: true,
            title: "¡Bienvenido!",
            message: `Has entrado a: ${event.geofence?.description || "Gimnasio"}`,
            type: "success",
            buttonText: "Entrenar 🦾",
          });
        } else if (event.type === "user.exited_geofence") {
          console.log(`[Radar] User exited geofence: ${event.geofence?._id}`);
          setModalConfig({
            visible: true,
            title: "¡Hasta pronto!",
            message: "Has salido del gimnasio. ¡Buen entrenamiento!",
            type: "info",
            buttonText: "OK",
          });
        }
      });
    });

    return () => {
      RadarService.off();
    };
  }, []);

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
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
              headerShown: true,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>

      <CustomModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        buttonText={modalConfig.buttonText}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaProvider>
  );
}

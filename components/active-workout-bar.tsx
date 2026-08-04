import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ActiveWorkoutBar() {
  const theme = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const activeWorkout = useAppStore((s) => s.activeWorkout);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  const onWorkoutSessionScreen = segments.includes("workout-session" as never);
  if (!activeWorkout || onWorkoutSessionScreen) return null;

  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000),
  );

  return (
    <TouchableOpacity
      style={styles.wrap}
      activeOpacity={0.9}
      onPress={() => router.push("/workout-session")}
    >
      <LinearGradient colors={theme.gradients.accent} style={styles.bar}>
        <Ionicons name="barbell" size={18} color="#fff" />
        <Text style={styles.title} numberOfLines={1}>
          {activeWorkout.routineName}
        </Text>
        <Text style={styles.time}>{formatTime(elapsed)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 72,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  title: {
    flex: 1,
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
  },
  time: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
});

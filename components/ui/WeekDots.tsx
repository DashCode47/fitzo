import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const LABELS = ["L", "M", "X", "J", "V", "S", "D"];

// Mon..Sun circles: filled ✓ = done, dashed = today (pending), faded = upcoming.
export function WeekDots({ days, size = 34 }: { days: boolean[]; size?: number }) {
  const theme = useAppTheme();
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {LABELS.map((label, i) => {
        const done = !!days[i];
        const isToday = i === todayIdx;
        return (
          <View key={label} style={{ alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: done ? theme.accent : isToday ? theme.accent : theme.borderMuted,
                borderStyle: !done && isToday ? "dashed" : "solid",
                backgroundColor: done ? theme.accent : theme.surface,
                opacity: !done && i > todayIdx ? 0.5 : 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {done && <Ionicons name="checkmark" size={size * 0.47} color="#fff" />}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: isToday ? "800" : "700",
                color: isToday ? theme.accent : theme.textMuted,
              }}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

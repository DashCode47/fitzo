import { ActiveWorkoutBar } from "@/components/active-workout-bar";
import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/hooks/useAppTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Active tab gets a filled glyph on an accent pill; inactive is outline + muted.
function TabIcon({ on, off, focused }: { on: IconName; off: IconName; focused: boolean }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? theme.accentDim : "transparent",
      }}
    >
      <MaterialCommunityIcons
        name={focused ? on : off}
        size={22}
        color={focused ? theme.accent : theme.textMuted}
      />
    </View>
  );
}

export default function TabLayout() {
  const theme = useAppTheme();
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopWidth: 1,
          borderTopColor: theme.borderSubtle,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon on="home-variant" off="home-variant-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: "Rutinas",
          tabBarIcon: ({ focused }) => (
            <TabIcon on="dumbbell" off="dumbbell" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ focused }) => (
            <TabIcon on="chart-box" off="chart-box-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrición",
          tabBarIcon: ({ focused }) => (
            <TabIcon on="food-apple" off="food-apple-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: "Ranking",
          tabBarIcon: ({ focused }) => (
            <TabIcon on="trophy" off="trophy-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
    <ActiveWorkoutBar />
    </>
  );
}

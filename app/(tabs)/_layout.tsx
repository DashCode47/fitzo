import { theme } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? theme.accent : theme.textMuted}
    />
  );
}

export default function TabLayout() {
  return (
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
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'fitness' : 'fitness-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'bag' : 'bag-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'restaurant' : 'restaurant-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

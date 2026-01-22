import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

const GOLD_COLOR = '#C5A356';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GOLD_COLOR,
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="nutrition.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="trophy.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

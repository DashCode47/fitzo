
import { DietPlan, UserStats } from '@/api/nutrition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
  // Data
  profile: any | null;
  activeDiet: DietPlan | null;
  userStats: UserStats | null;
  promos: any[] | null;
  events: any[] | null;
  leaderboard: any[] | null;
  
  // Hydration state
  isHydrated: boolean;

  // Setters
  setProfile: (profile: any) => void;
  setActiveDiet: (diet: DietPlan | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  setPromos: (promos: any[]) => void;
  setEvents: (events: any[]) => void;
  setLeaderboard: (leaderboard: any[]) => void;
  setHydrated: (val: boolean) => void;
  
  // Actions
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      activeDiet: null,
      userStats: null,
      promos: null,
      events: null,
      leaderboard: null,
      isHydrated: false,

      setProfile: (profile) => set({ profile }),
      setActiveDiet: (activeDiet) => set({ activeDiet }),
      setUserStats: (userStats) => set({ userStats }),
      setPromos: (promos) => set({ promos }),
      setEvents: (events) => set({ events }),
      setLeaderboard: (leaderboard) => set({ leaderboard }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      clearAll: () => set({ 
        profile: null, 
        activeDiet: null, 
        userStats: null, 
        promos: null, 
        events: null,
        leaderboard: null
      }),
    }),
    {
      name: 'iron-body-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

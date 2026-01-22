
import { Banner } from '@/api/banners';
import { DietPlan, UserStats } from '@/api/nutrition';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserProfile {
  id?: string;
  email: string;
  username?: string;
  phone?: string;
  role?: string;
  status?: string;
  photo_url?: string;
  total_points?: number;
  created_at?: string;
  updated_at?: string;
}
interface AppState {
  // Data
  profile: UserProfile | null;
  activeDiet: DietPlan | null;
  userStats: UserStats | null;
  promos: Banner[] | null;
  events: any[] | null;
  leaderboard: any[] | null;
  
  // Hydration state
  isHydrated: boolean;

  // Setters
  setProfile: (profile: UserProfile | null) => void;
  setActiveDiet: (diet: DietPlan | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  setPromos: (promos: Banner[]) => void;
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

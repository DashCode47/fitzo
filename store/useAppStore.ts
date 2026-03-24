
import { Banner } from '@/api/banners';
import { DietPlan, UserStats } from '@/api/nutrition';
import { Routine, UserSchedule } from '@/api/routines';
import { WorkoutLog } from '@/api/workouts';
import { UserRanks } from '@/api/ranks';
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

export interface ActiveWorkout {
    routineId: number;
    routineName: string;
    startTime: string;
    exercises: Array<{
        exerciseId: number;
        name: string;
        sets: Array<{
            set: number;
            reps: number;
            weight: number;
            completed: boolean;
        }>;
    }>;
}

interface AppState {
  // Data
  profile: UserProfile | null;
  activeDiet: DietPlan | null;
  userStats: UserStats | null;
  promos: Banner[] | null;
  events: any[] | null;
  leaderboard: any[] | null;
  
  // Workouts & Routines
  routines: Routine[] | null;
  activeWorkout: ActiveWorkout | null;
  workoutLogs: WorkoutLog[] | null;
  hasMoreLogs: boolean;
  logsOffset: number;
  userSchedule: UserSchedule[] | null;

  muscleRanks: UserRanks | null;
  
  // Settings
  themeMode: 'dark' | 'light' | 'cyan';
  
  // Hydration state
  isHydrated: boolean;

  // Setters
  setProfile: (profile: UserProfile | null) => void;
  setActiveDiet: (diet: DietPlan | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  setPromos: (promos: Banner[]) => void;
  setEvents: (events: any[]) => void;
  setLeaderboard: (leaderboard: any[]) => void;
  setRoutines: (routines: Routine[]) => void;
  setActiveWorkout: (workout: ActiveWorkout | null) => void;
  setWorkoutLogs: (logs: WorkoutLog[]) => void;
  appendWorkoutLogs: (logs: WorkoutLog[], hasMore: boolean) => void;
  setLogsOffset: (offset: number) => void;
  resetWorkoutLogs: () => void;
  setUserSchedule: (schedule: UserSchedule[]) => void;
  setMuscleRanks: (ranks: UserRanks | null) => void;
  setThemeMode: (mode: 'dark' | 'light' | 'cyan') => void;
  setHydrated: (val: boolean) => void;
  
  // Actions
  updateWorkoutSet: (exerciseIndex: number, setIndex: number, data: Partial<{ reps: number, weight: number, completed: boolean }>) => void;
  addWorkoutSet: (exerciseIndex: number) => void;
  removeWorkoutSet: (exerciseIndex: number, setIndex: number) => void;
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
      routines: null,
      activeWorkout: null,
      workoutLogs: [],
      hasMoreLogs: true,
      logsOffset: 0,
      userSchedule: null,
      muscleRanks: null,
      themeMode: 'dark',
      isHydrated: false,

      setProfile: (profile) => set({ profile }),
      setActiveDiet: (activeDiet) => set({ activeDiet }),
      setUserStats: (userStats) => set({ userStats }),
      setPromos: (promos) => set({ promos }),
      setEvents: (events) => set({ events }),
      setLeaderboard: (leaderboard) => set({ leaderboard }),
      setRoutines: (routines) => set({ routines }),
      setActiveWorkout: (activeWorkout) => set({ activeWorkout }),
      setWorkoutLogs: (workoutLogs) => set({ workoutLogs }),
      appendWorkoutLogs: (newLogs, hasMore) => set((state) => ({ 
        workoutLogs: [...(state.workoutLogs || []), ...newLogs],
        hasMoreLogs: hasMore,
        logsOffset: (state.logsOffset || 0) + newLogs.length
      })),
      setLogsOffset: (logsOffset) => set({ logsOffset }),
      resetWorkoutLogs: () => set({ workoutLogs: [], logsOffset: 0, hasMoreLogs: true }),
      setUserSchedule: (userSchedule) => set({ userSchedule }),
      setMuscleRanks: (muscleRanks) => set({ muscleRanks }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      updateWorkoutSet: (exIdx, setIdx, data) => set((state) => {
          if (!state.activeWorkout) return state;
          const newWorkout = { ...state.activeWorkout };
          const ex = newWorkout.exercises[exIdx];
          if (ex) {
              ex.sets[setIdx] = { ...ex.sets[setIdx], ...data };
          }
          return { activeWorkout: newWorkout };
      }),

      addWorkoutSet: (exIdx) => set((state) => {
          if (!state.activeWorkout) return state;
          const newWorkout = { ...state.activeWorkout };
          const ex = newWorkout.exercises[exIdx];
          if (ex) {
              const lastSet = ex.sets[ex.sets.length - 1];
              ex.sets.push({
                  set: ex.sets.length + 1,
                  reps: lastSet?.reps ?? 10,
                  weight: lastSet?.weight ?? 0,
                  completed: false,
              });
          }
          return { activeWorkout: newWorkout };
      }),

      removeWorkoutSet: (exIdx, setIdx) => set((state) => {
          if (!state.activeWorkout) return state;
          const newWorkout = { ...state.activeWorkout };
          const ex = newWorkout.exercises[exIdx];
          if (ex && ex.sets.length > 1) {
              ex.sets.splice(setIdx, 1);
              ex.sets.forEach((s, i) => { s.set = i + 1; });
          }
          return { activeWorkout: newWorkout };
      }),

      clearAll: () => set({ 
        profile: null, 
        activeDiet: null, 
        userStats: null, 
        promos: null, 
        events: null,
        leaderboard: null,
        routines: null,
        activeWorkout: null,
        workoutLogs: null,
        userSchedule: null,
        muscleRanks: null
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

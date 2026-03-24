
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  description?: string;
  image_url?: string;
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  difficulty: string;
  goal: string;
  estimated_duration: number;
  is_template: boolean;
  created_by?: string;
  created_at: string;
  exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_id: number;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  suggested_weight?: string;
  notes?: string;
  exercise?: Exercise;
}

export interface UserSchedule {
    id: number;
    user_id: string;
    routine_id: number;
    day_of_week: number;
    active: boolean;
    routine?: Routine;
}

export const ROUTINE_DIFFICULTIES: Record<string, string> = {
  'beginner': 'Principiante',
  'intermediate': 'Intermedio',
  'advanced': 'Avanzado'
};

export const ROUTINE_GOALS: Record<string, string> = {
  'hypertrophy': 'Hipertrofia',
  'strength': 'Fuerza',
  'fat_loss': 'Pérdida de Grasa',
  'endurance': 'Resistencia'
};

export const RoutinesAPI = {
  translateDifficulty: (val: string) => ROUTINE_DIFFICULTIES[val.toLowerCase()] || val,
  translateGoal: (val: string) => ROUTINE_GOALS[val.toLowerCase()] || val,

  getExercises: async (): Promise<Exercise[]> => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('exercises').select('*').order('name', { ascending: true }) as any
      ) as any;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[RoutinesAPI] getExercises failed:', e);
      throw e;
    }
  },

  getUserRoutines: async (userId: string): Promise<Routine[]> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('routines')
          .select('*')
          .or(`created_by.eq.${userId},is_template.eq.true`)
          .order('created_at', { ascending: false }) as any
      ) as any;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[RoutinesAPI] getUserRoutines failed:', e);
      throw e;
    }
  },

  getRoutineDetail: async (routineId: number): Promise<Routine | null> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('routines')
          .select(`
            *,
            exercises:routine_exercises (
              *,
              exercise:exercises (*)
            )
          `)
          .eq('id', routineId)
          .single() as any
      ) as any;
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[RoutinesAPI] getRoutineDetail failed:', e);
      throw e;
    }
  },

  getUserSchedule: async (userId: string): Promise<UserSchedule[]> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('user_routine_schedule')
          .select(`
            *,
            routine:routines (*)
          `)
          .eq('user_id', userId) as any
      ) as any;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[RoutinesAPI] getUserSchedule failed:', e);
      throw e;
    }
  },

  upsertSchedule: async (schedule: Partial<UserSchedule>) => {
    try {
        const { data, error } = await withTimeout(
            supabase
                .from('user_routine_schedule')
                .upsert(schedule, { onConflict: 'user_id,day_of_week' })
                .select() as any
        ) as any;
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('[RoutinesAPI] upsertSchedule failed:', e);
        throw e;
    }
  },

  createRoutine: async (routine: Partial<Routine>, exercises: Partial<RoutineExercise>[]) => {
    try {
      // 1. Create the routine container
      const { data: routineData, error: routineError } = await withTimeout(
        supabase.from('routines').insert(routine).select().single() as any
      ) as any;
      if (routineError) throw routineError;

      // 2. Insert exercises for that routine
      if (exercises && exercises.length > 0) {
        const exerciseData = exercises.map((ex, idx) => ({
            ...ex,
            routine_id: routineData.id,
            order_index: idx
        }));
        const { error: exError } = await withTimeout(
            supabase.from('routine_exercises').insert(exerciseData) as any
        ) as any;
        if (exError) throw exError;
      }

      return routineData;
    } catch (e) {
      console.error('[RoutinesAPI] createRoutine failed:', e);
      throw e;
    }
  },

  updateRoutine: async (routineId: number, routine: Partial<Routine>, exercises: Partial<RoutineExercise>[]) => {
    try {
      // 1. Update routine metadata
      const { data: routineData, error: routineError } = await withTimeout(
        supabase.from('routines').update(routine).eq('id', routineId).select().single() as any
      ) as any;
      if (routineError) throw routineError;

      // 2. Delete existing exercises to replace them
      const { error: deleteError } = await withTimeout(
          supabase.from('routine_exercises').delete().eq('routine_id', routineId) as any
      ) as any;
      if (deleteError) throw deleteError;

      // 3. Insert new exercises
      if (exercises && exercises.length > 0) {
        const exerciseData = exercises.map((ex, idx) => ({
            ...ex,
            routine_id: routineId,
            order_index: idx
        }));
        const { error: exError } = await withTimeout(
            supabase.from('routine_exercises').insert(exerciseData) as any
        ) as any;
        if (exError) throw exError;
      }

      return routineData;
    } catch (e) {
      console.error('[RoutinesAPI] updateRoutine failed:', e);
      throw e;
    }
  },

  deleteRoutine: async (routineId: number) => {
    try {
      const { error } = await withTimeout(
        supabase.from('routines').delete().eq('id', routineId) as any
      ) as any;
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('[RoutinesAPI] deleteRoutine failed:', e);
      throw e;
    }
  }
};

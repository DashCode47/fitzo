import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';

export interface UserStats {
  id?: number;
  user_id: string;
  weight: number;
  height: number;
  age: number;
  gender: 'M' | 'F';
  activity_level: 'sedentary' | 'moderate' | 'active';
  goal: 'cut' | 'bulk' | 'maintain';
  allergies: string[];
  updated_at?: string;
}

export interface WeightLog {
  id: number;
  user_id: string;
  weight: number;
  logged_at: string;
}

export interface DietPlan {
  id: number;
  name: string;
  calories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  meals: Array<{
    title: string;
    time?: string;
    options: Array<{
      name: string;
      foods: string[];
    }>;
  }>;
}

export const NutritionAPI = {
  getUserStats: async (userId: string): Promise<UserStats | null> => {
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle() as any,
        10000,
        "Error obteniendo estadísticas"
      )) as any;

      if (error) {
        console.error('[NutritionAPI] Error fetching stats:', error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error('[NutritionAPI] getUserStats failed:', e);
      throw e;
    }
  },

  saveUserStats: async (stats: UserStats) => {
    const { data, error } = (await withTimeout(
      supabase
        .from('user_stats')
        .upsert(stats, { onConflict: 'user_id' })
        .select()
        .single() as any,
      10000,
      "Error guardando estadísticas"
    )) as any;

    if (error) {
      console.error('[NutritionAPI] Error saving stats:', error);
      throw error;
    }
    return data;
  },

  // Appends one entry to the weight history. Called alongside saveUserStats
  // whenever the user updates their weight, so the history builds up from
  // normal use of the stats form instead of needing a separate check-in action.
  logWeight: async (userId: string, weight: number) => {
    const { error } = (await withTimeout(
      supabase.from('weight_logs').insert({ user_id: userId, weight }) as any,
      10000,
      "Error registrando peso"
    )) as any;

    if (error) {
      console.error('[NutritionAPI] Error logging weight:', error);
      throw error;
    }
  },

  getWeightHistory: async (userId: string, limit = 30): Promise<WeightLog[]> => {
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', userId)
          .order('logged_at', { ascending: false })
          .limit(limit) as any,
        10000,
        "Error obteniendo historial de peso"
      )) as any;

      if (error) throw error;
      return [...(data || [])].reverse();
    } catch (e) {
      console.error('[NutritionAPI] getWeightHistory failed:', e);
      throw e;
    }
  },

  getActiveDiet: async (userId: string): Promise<DietPlan | null> => {
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from('user_diets')
          .select(`
            active,
            diet_plans (*)
          `)
          .eq('user_id', userId)
          .eq('active', true)
          .maybeSingle() as any,
        10000,
        "Error obteniendo dieta"
      )) as any;

      if (error) {
        console.error('[NutritionAPI] Error fetching diet:', error);
        throw error;
      }

      if (!data || !data.diet_plans) return null;

      // Handle both object and array response formats from Supabase joins
      const plan = Array.isArray(data.diet_plans) ? data.diet_plans[0] : data.diet_plans;
      if (!plan) return null;

    // Robust parsing for meals and macros if they come back as strings
    try {
      if (typeof plan.meals === 'string') {
        plan.meals = JSON.parse(plan.meals);
      }
      if (typeof plan.macros === 'string') {
        plan.macros = JSON.parse(plan.macros);
      }
    } catch (e) {
      console.error('[NutritionAPI] Failed to parse diet fields:', e);
    }

      return plan as unknown as DietPlan;
    } catch (e) {
      console.error('[NutritionAPI] getActiveDiet failed:', e);
      throw e;
    }
  },

  assignBestDietPlan: async (userId: string, targetCalories: number) => {
    try {
      const { error } = await supabase.rpc('assign_best_diet_plan', {
        p_user_id: userId,
        p_target_calories: targetCalories
      });

      if (error) {
        console.error('[NutritionAPI] Error in rpc call:', error);
        throw error;
      }
    } catch (e) {
      console.error('[NutritionAPI] assignBestDietPlan failed:', e);
      throw e;
    }
  }
};

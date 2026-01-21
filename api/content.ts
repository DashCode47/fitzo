
import { supabase } from '@/lib/supabase';

export const ContentAPI = {
  getPromotions: async () => {
    const { data, error } = await supabase.from('promotions').select('*');
    if (error) throw error;
    return data;
  },

  getEvents: async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (error) throw error;
    return data;
  },

  getNutritionPlans: async () => {
    const { data, error } = await supabase.from('nutrition_plans').select('*');
    if (error) throw error;
    return data;
  },
};

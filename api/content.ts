
import { supabase } from '@/lib/supabase';

export const ContentAPI = {
  getPromotions: async () => {
    const { data, error } = await supabase.from('promotions').select('*');
    if (error) throw error;
    return data;
  },

  getEvents: async () => {
    const now = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(5);
    if (error) throw error;
    return data;
  },

  getNutritionPlans: async () => {
    const { data, error } = await supabase.from('nutrition_plans').select('*');
    if (error) throw error;
    return data;
  },

  getCrowdStatus: async () => {
    // Consulta la vista crowd_meter que cuenta las sesiones 'ACTIVE'
    const { data, error } = await supabase
      .from('crowd_meter')
      .select('current_count')
      .single();
    
    if (error) {
      console.warn('[ContentAPI] Could not fetch crowd_meter, using defaults:', error.message);
      return { status: 'Normal', percentage: 15, description: 'Simulado' };
    }

    const currentCount = data.current_count || 0;
    const maxCapacity = 80; // Podríamos mover esto a una tabla de settings luego
    const percentage = Math.round((currentCount / maxCapacity) * 100);
    
    let status = 'Baja';
    if (percentage > 80) status = 'Alta';
    else if (percentage > 50) status = 'Media';

    return {
      status,
      percentage,
      description: `Hay ${currentCount} personas entrenando`
    };
  }
};

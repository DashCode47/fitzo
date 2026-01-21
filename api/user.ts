
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/utils/async';

/**
 * UserAPI - Provides methods to interact with user profile data.
 */
export const UserAPI = {
  getProfile: async (userId?: string) => {
    let finalUserId = userId;

    try {
      if (!finalUserId) {
        // 1. Try local session recovery
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          finalUserId = session.user.id;
        } else {
          // 2. Fallback to server verification
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
             throw new Error('No se pudo recuperar la sesión activa');
          }
          finalUserId = user.id;
        }
      }

      // 3. Fetch User Data + Profile from DB
      const query = supabase
        .from('users')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('id', finalUserId)
        .single();

      const { data, error } = (await withTimeout(query as any, 15000, "La base de datos no respondió a tiempo")) as any;

      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error("[UserAPI] Profile fetch failed:", e.message);
      throw e;
    }
  },
};

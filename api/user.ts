
import { supabase } from '@/lib/supabase';

/**
 * UserAPI - Provides methods to interact with user profile data.
 */
export const UserAPI = {
  syncProfile: async (user: any) => {
    if (!user?.email) return null;
    try {
      const payload = {
        id: user.id, // Primary key
        email: user.email,
        username: user.user_metadata?.first_name || user.email.split('@')[0],
        display_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        national_id: user.user_metadata?.national_id,
        phone: user.user_metadata?.phone,
        updated_at: new Date().toISOString(),
      };
      
      console.log("[UserAPI] Syncing profile with payload:", JSON.stringify(payload, null, 2));

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error("[UserAPI] Profile sync Error:", error.code, error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error("[UserAPI] Profile sync Exception:", e);
      return null;
    }
  },

  getProfile: async (userId?: string) => {
    let finalUserId = userId;

    try {
      if (!finalUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No active session');
        finalUserId = user.id;
      }

      // Fetch only from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', finalUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           // If not found, it might be a new user where trigger is still running or failed.
           // Return partial data from auth as fallback
           const { data: authData } = await supabase.auth.getUser();
           return {
             id: finalUserId,
             email: authData.user?.email,
             username: authData.user?.user_metadata?.first_name,
           };
        }
        throw error;
      }

      return data;
    } catch (e: any) {
      console.error("[UserAPI] Profile fetch failed:", e.message);
      throw e;
    }
  },
};

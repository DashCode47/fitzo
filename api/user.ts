
import { supabase } from '@/lib/supabase';

/**
 * UserAPI - Provides methods to interact with user profile data.
 */
export const UserAPI = {
  syncProfile: async (user: any) => {
    if (!user?.email) return null;
    try {
      const metadata = user.user_metadata || {};
      
      // Normalize gender for the ranking system (male/female -> M/F)
      let gender = metadata.gender || 'M';
      if (gender === 'male') gender = 'M';
      if (gender === 'female') gender = 'F';

      const weight = parseFloat(metadata.weight) || 75;

      const profilePayload = {
        id: user.id,
        email: user.email,
        username: metadata.first_name || user.email.split('@')[0],
        display_name: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
        national_id: metadata.national_id,
        phone: metadata.phone,
        updated_at: new Date().toISOString(),
      };
      
      console.log("[UserAPI] Syncing profile and stats...");

      // 1. Sync Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Sync User Stats (needed for Rankings)
      // Check if stats already exist to NOT overwrite height/age if user changed them in nutrition
      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingStats) {
        await supabase.from('user_stats').insert({
          user_id: user.id,
          weight: weight,
          gender: gender,
          height: 170, // Default height
          updated_at: new Date().toISOString()
        });
      }

      return profileData;
    } catch (e) {
      console.error("[UserAPI] Profile/Stats sync Exception:", e);
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

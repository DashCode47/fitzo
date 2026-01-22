
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

export const AuthAPI = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error.message;

    if (data.session) {
      await SecureStore.setItemAsync('user_token', data.session.access_token);
    }

    return data.user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('user_token');
  },

  lookupEmailByCedula: async (nationalId: string) => {
    // Calls a security definer RPC to bypass RLS for this specific lookup
    const { data, error } = await supabase.rpc('lookup_email_by_national_id', { 
        p_national_id: nationalId 
    });
    
    if (error) {
      console.error('[AuthAPI] Lookup RPC Error:', error.message);
      return { email: null };
    }

    // RPC returns string or null
    return { email: data };
  },

  registerUser: async (userData: any) => {
    // Database trigger 'handle_new_user' handles users/profiles inserts
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password, 
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          national_id: userData.nationalId,
          phone: userData.phone,
        }
      }
    });

    if (error) throw error;
    return data;
  },

  signInWithOtp: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  },

  verifyOtp: async (email: string, token: string) => {
    console.log('[AuthAPI] Verifying OTP for:', email);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    
    if (error) {
      console.error('[AuthAPI] Verify OTP Error:', error);
      throw error;
    }
    
    if (data.session) {
      await SecureStore.setItemAsync('user_token', data.session.access_token);
    }
    
    return data;
  }
};

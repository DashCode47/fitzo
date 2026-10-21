
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

  deleteAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Avatars are stored as `${user.id}.${ext}` in the root of the bucket.
    // Best effort: a leftover photo must not block deleting the account.
    const { data: files } = await supabase.storage.from('avatars').list('', { search: user.id });
    if (files?.length) {
      await supabase.storage.from('avatars').remove(files.map((f) => f.name));
    }

    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;

    // The user no longer exists server-side, so only clear the local session.
    await supabase.auth.signOut({ scope: 'local' });
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  },

  getToken: async () => {
    return await SecureStore.getItemAsync('user_token');
  },

  lookupEmailByUsername: async (username: string) => {
    // Calls a security definer RPC to bypass RLS for this specific lookup
    const { data, error } = await supabase.rpc('lookup_email_by_username', {
        p_username: username
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
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          gender: userData.gender,
          weight: userData.weight,
        }
      }
    });

    if (error) throw error;
    return data;
  },
};

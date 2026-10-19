
/**
 * Environment variables configuration.
 * Using EXPO_PUBLIC_ prefix to automatically expose variables to the app.
 */

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Env] Supabase configuration is missing in .env');
}

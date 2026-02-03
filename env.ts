
/**
 * Environment variables configuration.
 * Using EXPO_PUBLIC_ prefix to automatically expose variables to the app.
 */

export const RADAR_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY || '';
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const RADAR_SECRET_KEY = process.env.EXPO_PUBLIC_RADAR_SECRET_KEY || '';

if (!RADAR_PUBLISHABLE_KEY) {
  console.warn('[Env] RADAR_PUBLISHABLE_KEY is not defined in .env');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Env] Supabase configuration is missing in .env');
}

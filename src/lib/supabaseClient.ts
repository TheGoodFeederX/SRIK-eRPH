import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are missing
export const hasSupabaseCredentials = !!(supabaseUrl && supabaseAnonKey);

// Create client with fallback empty values if credentials are missing
// This prevents the app from crashing but operations will fail gracefully
export const supabase = hasSupabaseCredentials
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key');

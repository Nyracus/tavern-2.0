// src/config/supabase.config.ts
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Use service_role key for admin operations (storage uploads/deletes)
// Fallback to anon key if service_role not provided
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Only create Supabase client if both URL and key are provided
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

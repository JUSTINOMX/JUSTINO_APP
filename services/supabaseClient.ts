
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Initialize only if keys actually exist (to avoid crashing the demo)
// We check if the values are the placeholders or real strings
const isConfigured = 
  config.supabaseUrl && 
  config.supabaseUrl !== "https://tu-proyecto.supabase.co" &&
  config.supabaseAnonKey &&
  config.supabaseAnonKey.length > 20;

export const supabase = isConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn()
      }
    })
  : null;

// Helper to check if we are online/connected to DB
export const isDbConnected = () => !!supabase;

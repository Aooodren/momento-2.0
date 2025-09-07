import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Export createClient for use in other modules
export const createClient = createSupabaseClient;

// Create a singleton Supabase client instance
export const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
import { createClient } from '@supabase/supabase-js';

// Access environment variables in Vite using import.meta.env.
// vite.config.js bridges the project's NEXT_PUBLIC_SUPABASE_* / SUPABASE_*
// variables into these VITE_ names, so either naming scheme works.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[v0] Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment.'
  );
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

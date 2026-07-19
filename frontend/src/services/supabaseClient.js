import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export async function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Support both VITE_ and NEXT_PUBLIC_ prefixes
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Clear any invalid sessions on init
  try {
    const { data: { session } } = await supabaseInstance.auth.getSession();
    if (!session) {
      // Clear stale localStorage data
      localStorage.removeItem('supabase.auth.token');
    }
  } catch {
    // Clear any corrupted session data
    localStorage.removeItem('supabase.auth.token');
  }

  return supabaseInstance;
}

export async function clearSession() {
  if (supabaseInstance) {
    await supabaseInstance.auth.signOut();
  }
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('currentUser');
}

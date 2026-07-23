import axios from 'axios';
import { getSupabaseClient } from './supabaseClient';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach the current Supabase session token to every request. The
// backend (api/_auth.js) requires this for all cameras/incidents
// endpoints as of Phase 1 -- requests without it now get a 401
// instead of silently working (previously no token was sent at all).
api.interceptors.request.use(async (config) => {
  try {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        return config;
      }
    }
  } catch {
    // Fall through to localStorage fallback
  }

  // Fallback: check localStorage for Convex Auth / Supabase tokens
  try {
    const raw = localStorage.getItem("supabase.auth.token");
    if (raw) {
      const parsed = JSON.parse(raw);
      const t = parsed?.currentSession?.access_token || parsed?.access_token || null;
      if (t) {
        config.headers.Authorization = `Bearer ${t}`;
        return config;
      }
    }
    const t =
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("convex-auth-token");
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
  } catch {
    // Let request go out without a token
  }

  return config;
});

export default api;

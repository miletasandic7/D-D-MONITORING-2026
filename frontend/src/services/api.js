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
      }
    }
  } catch (e) {
    // Let the request go out without a token; the backend will
    // respond with 401 and the UI's existing error handling covers it.
  }
  return config;
});

export default api;

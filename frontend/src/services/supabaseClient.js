let supabaseInstance = null;
let supabasePromise = null;

export async function getSupabaseClient() {
	if (supabaseInstance) return supabaseInstance;
	if (supabasePromise) return supabasePromise;

	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) return null;

	supabasePromise = import('@supabase/supabase-js').then(({ createClient }) => {
		supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
		return supabaseInstance;
	}).finally(() => {
		supabasePromise = null;
	});

	return supabasePromise;
}

export default getSupabaseClient;

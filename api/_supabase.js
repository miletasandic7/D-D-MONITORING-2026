function getSupabaseConfig() {
  const baseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { baseUrl, anonKey };
}

function hasSupabaseConfig() {
  const { baseUrl, anonKey } = getSupabaseConfig();
  return Boolean(baseUrl && anonKey);
}

async function supabaseRestRequest(table, query = {}, options = {}) {
  const { baseUrl, anonKey } = getSupabaseConfig();
  if (!baseUrl || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  let parsedBody;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = rawBody;
  }

  if (!response.ok) {
    const message =
      typeof parsedBody === 'string'
        ? parsedBody
        : parsedBody?.message || parsedBody?.error || `Supabase request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsedBody;
}

module.exports = {
  getSupabaseConfig,
  hasSupabaseConfig,
  supabaseRestRequest,
};

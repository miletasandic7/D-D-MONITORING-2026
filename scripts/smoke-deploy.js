#!/usr/bin/env node

try {
  require('dotenv').config();
} catch (e) {
  // optional
}

const deployBaseUrl = (process.argv[2] || process.env.DEPLOY_BASE_URL || '').trim().replace(/\/+$/, '');
const bearerToken = (process.env.SMOKE_BEARER_TOKEN || '').trim();
const bearerPrefix = 'Bearer ';

if (!deployBaseUrl) {
  console.error('[smoke:deploy] Pass the deploy base URL as argv[2] or DEPLOY_BASE_URL');
  process.exit(1);
}

if (!/^https?:\/\//.test(deployBaseUrl)) {
  console.error('[smoke:deploy] DEPLOY_BASE_URL must start with http:// or https://');
  process.exit(1);
}

async function requestJson(pathname, { requireSuccess = false, allowAuthFailure = false } = {}) {
  const headers = bearerToken ? { Authorization: `${bearerPrefix}${bearerToken}` } : {};
  const response = await fetch(`${deployBaseUrl}${pathname}`, {
    headers,
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = text;
  }

  if (response.status === 503) {
    throw new Error(`${pathname} returned 503: ${JSON.stringify(body)}`);
  }

  if (requireSuccess && (!response.ok || !body || body.success !== true)) {
    throw new Error(`${pathname} did not report success: status=${response.status} body=${JSON.stringify(body)}`);
  }

  if (allowAuthFailure && !bearerToken && ![200, 401, 403].includes(response.status)) {
    throw new Error(`${pathname} returned unexpected status without token: ${response.status}`);
  }

  if (allowAuthFailure && bearerToken && response.status !== 200) {
    throw new Error(`${pathname} returned ${response.status} even though SMOKE_BEARER_TOKEN was provided`);
  }

  console.log(`[smoke:deploy] ${pathname} -> ${response.status}`);
  return { status: response.status, body };
}

(async () => {
  try {
    await requestJson('/api/health', { requireSuccess: true });
    await requestJson('/api/cameras', { allowAuthFailure: true });
    await requestJson('/api/incidents', { allowAuthFailure: true });
    console.log('[smoke:deploy] Deployment smoke test passed.');
  } catch (error) {
    console.error('[smoke:deploy] Failed:', error.message);
    process.exit(1);
  }
})();

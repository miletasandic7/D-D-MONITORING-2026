const PLAN_DEFINITIONS = {
  starter: {
    id: 'starter',
    name: 'Standard Global',
    amount: '500.00',
    currency: 'USD',
  },
  growth: {
    id: 'growth',
    name: 'Business Global',
    amount: '950.00',
    currency: 'USD',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Global',
    amount: '1500.00',
    currency: 'USD',
  },
};

function getPayPalEnvironment() {
  return String(process.env.PAYPAL_ENVIRONMENT || 'live').toLowerCase();
}

function getPayPalApiBaseUrl() {
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL.replace(/\/$/, '');
  }

  return getPayPalEnvironment() === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_LIVE_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_LIVE_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET || '';

  return { clientId, secret };
}

function resolvePlanDefinition(planId) {
  return PLAN_DEFINITIONS[planId] || null;
}

function buildContactSummary({ district = '', contacts = {} } = {}) {
  const parts = [
    district ? `District: ${district}` : null,
    contacts.policeStation ? `Police: ${contacts.policeStation}` : null,
    contacts.fireService ? `Fire: ${contacts.fireService}` : null,
    contacts.ambulance ? `Ambulance: ${contacts.ambulance}` : null,
    contacts.localCommand ? `Command: ${contacts.localCommand}` : null,
  ].filter(Boolean);

  return parts.join(' | ');
}

async function getPayPalAccessToken() {
  const { clientId, secret } = getPayPalCredentials();
  if (!clientId || !secret) {
    throw new Error('Missing PayPal credentials');
  }

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.message || 'Unable to authenticate with PayPal');
  }

  return payload.access_token;
}

function normalizeCheckoutBody(body = {}) {
  return {
    planId: String(body.planId || '').trim(),
    planName: String(body.planName || '').trim(),
    amount: String(body.amount || '').trim(),
    currency: String(body.currency || 'USD').trim().toUpperCase(),
    district: String(body.district || '').trim(),
    contacts: body.contacts || {},
  };
}

async function createPayPalOrder(body = {}) {
  const checkout = normalizeCheckoutBody(body);
  const plan = resolvePlanDefinition(checkout.planId);

  if (!plan) {
    throw new Error('Unsupported PayPal plan');
  }

  if (!checkout.district || !checkout.contacts.policeStation || !checkout.contacts.fireService || !checkout.contacts.ambulance || !checkout.contacts.localCommand) {
    throw new Error('Emergency contacts are required before checkout');
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalApiBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: plan.id,
          custom_id: plan.id,
          description: `${plan.name} for ${checkout.district}`,
          amount: {
            currency_code: checkout.currency || plan.currency,
            value: checkout.amount || plan.amount,
          },
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || payload?.details?.[0]?.issue || 'Unable to create PayPal order');
  }

  return payload;
}

async function capturePayPalOrder(orderId) {
  if (!orderId) {
    throw new Error('Missing PayPal order ID');
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalApiBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || payload?.details?.[0]?.issue || 'Unable to capture PayPal order');
  }

  return payload;
}

module.exports = {
  PLAN_DEFINITIONS,
  buildContactSummary,
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalApiBaseUrl,
  getPayPalCredentials,
  getPayPalEnvironment,
  resolvePlanDefinition,
};

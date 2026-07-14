// PayPal REST integration for subscription checkout.
// Ported from the imported app's `paypal.js`.

export interface PlanDefinition {
  id: string;
  name: string;
  amount: string;
  currency: string;
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  starter: { id: "starter", name: "Standard Global", amount: "500.00", currency: "USD" },
  growth: { id: "growth", name: "Business Global", amount: "950.00", currency: "USD" },
  enterprise: { id: "enterprise", name: "Enterprise Global", amount: "1500.00", currency: "USD" },
};

export function resolvePlanDefinition(planId: string): PlanDefinition | null {
  return PLAN_DEFINITIONS[planId] ?? null;
}

function getPayPalEnvironment(): string {
  return String(process.env.PAYPAL_ENVIRONMENT ?? "live").toLowerCase();
}

function getPayPalApiBaseUrl(): string {
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL.replace(/\/$/, "");
  }
  return getPayPalEnvironment() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

function getPayPalCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_LIVE_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_LIVE_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET || "";
  return { clientId, secret };
}

async function getPayPalAccessToken(): Promise<string> {
  const { clientId, secret } = getPayPalCredentials();
  if (!clientId || !secret) {
    throw new Error("Missing PayPal credentials");
  }

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error_description?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error_description || payload.message || "Unable to authenticate with PayPal");
  }

  return payload.access_token as string;
}

export interface CheckoutInput {
  planId: string;
  planName?: string;
  amount?: string;
  currency?: string;
  district?: string;
  contacts?: Record<string, unknown>;
}

export async function createPayPalOrder(body: CheckoutInput): Promise<Record<string, unknown>> {
  const plan = resolvePlanDefinition(body.planId);
  if (!plan) {
    throw new Error("Unsupported PayPal plan");
  }

  // Pricing authority stays server-side: the amount and currency always come
  // from PLAN_DEFINITIONS. Any client-supplied amount/currency is ignored so a
  // caller cannot under-price or mis-currency a real order.
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalApiBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: plan.id,
          custom_id: plan.id,
          description: `${plan.name} for ${body.district || "N/A"}`,
          amount: {
            currency_code: plan.currency,
            value: plan.amount,
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });

  const payload = (await response.json()) as {
    message?: string;
    details?: Array<{ issue?: string }>;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.details?.[0]?.issue || "Unable to create PayPal order");
  }

  return payload;
}

export async function capturePayPalOrder(orderId: string): Promise<Record<string, unknown>> {
  if (!orderId) {
    throw new Error("Missing PayPal order ID");
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const payload = (await response.json()) as {
    message?: string;
    details?: Array<{ issue?: string }>;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.details?.[0]?.issue || "Unable to capture PayPal order");
  }

  return payload;
}

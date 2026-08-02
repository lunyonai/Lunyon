import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

function paypalBaseUrl() {
  return env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new AppError("PayPal is not configured", 503);
  }

  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new AppError("Failed to authenticate with PayPal", 502);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(params: {
  userId: string;
  amount: string;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const token = await getAccessToken();
  const currency = params.currency ?? "USD";

  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: params.amount,
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AppError(`PayPal order failed: ${details}`, 502);
  }

  const order = (await response.json()) as {
    id: string;
    links?: Array<{ rel: string; href: string }>;
  };

  await supabaseAdmin.from("purchases").insert({
    user_id: params.userId,
    provider: "paypal",
    provider_session_id: order.id,
    amount_cents: Math.round(Number(params.amount) * 100),
    currency: currency.toLowerCase(),
    status: "pending",
  });

  const approveUrl = order.links?.find((l) => l.rel === "approve")?.href;
  return { orderId: order.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();

  const response = await fetch(
    `${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new AppError("Failed to capture PayPal order", 502);
  }

  const result = await response.json();

  await supabaseAdmin
    .from("purchases")
    .update({ status: "completed" })
    .eq("provider_session_id", orderId);

  return result;
}

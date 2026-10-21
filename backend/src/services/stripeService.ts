import Stripe from "stripe";
import { env } from "../config/env.js";
import { nextAccessUntil } from "../lib/entitlement.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured", 503);
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!env.STRIPE_PRICE_ID) {
    throw new AppError("Stripe price is not configured", 503);
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    metadata: { userId: params.userId },
  });

  await supabaseAdmin.from("purchases").insert({
    user_id: params.userId,
    provider: "stripe",
    provider_session_id: session.id,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    status: "pending",
  });

  return { url: session.url, sessionId: session.id };
}

/** Adds (or removes, for a refund) access days. Throws so Stripe retries the event. */
async function adjustEntitlement(userId: string, days: number) {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .select("access_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError("Could not read entitlement", 500);

  const next = nextAccessUntil((data?.access_until as string | null) ?? null, days);
  const { error: upsertError } = await supabaseAdmin.from("entitlements").upsert(
    {
      user_id: userId,
      status: next.status,
      access_until: next.accessUntil,
      source: "stripe",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (upsertError) throw new AppError("Could not update entitlement", 500);
}

/**
 * Moves a purchase from one status to another. Returns the user id only when this call made the
 * change, so Stripe's retries and duplicate deliveries never grant access twice.
 */
async function transitionPurchase(
  sessionId: string,
  from: string[],
  to: "completed" | "failed" | "canceled",
  extra: Record<string, unknown> = {},
) {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .update({ status: to, ...extra })
    .eq("provider_session_id", sessionId)
    .in("status", from)
    .select("user_id");
  if (error) throw new AppError("Could not update purchase", 500);
  return (data?.[0]?.user_id as string | undefined) ?? null;
}

async function purchaseExists(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("provider_session_id", sessionId)
    .limit(1);
  if (error) throw new AppError("Could not read purchase", 500);
  return (data ?? []).length > 0;
}

async function completeCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  let userId = await transitionPurchase(session.id, ["pending", "failed"], "completed", {
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
  });

  if (!userId && !(await purchaseExists(session.id))) {
    // The row was not created at checkout time; trust only our own metadata.
    const metadataUser = session.metadata?.userId ?? session.client_reference_id;
    if (!metadataUser) return;
    const { error } = await supabaseAdmin.from("purchases").insert({
      user_id: metadataUser,
      provider: "stripe",
      provider_session_id: session.id,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      status: "completed",
    });
    if (error) throw new AppError("Could not record purchase", 500);
    userId = metadataUser;
  }

  if (!userId) return; // Already processed.
  try {
    await adjustEntitlement(userId, env.ENTITLEMENT_DAYS);
  } catch (err) {
    // Put the purchase back so Stripe's retry grants the access.
    await supabaseAdmin
      .from("purchases")
      .update({ status: "pending" })
      .eq("provider_session_id", session.id);
    throw err;
  }
}

async function refundCharge(stripe: Stripe, charge: Stripe.Charge) {
  if (!charge.refunded || typeof charge.payment_intent !== "string") return;
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: charge.payment_intent,
    limit: 1,
  });
  const session = sessions.data[0];
  if (!session) return;
  const userId = await transitionPurchase(session.id, ["completed"], "canceled");
  if (userId) await adjustEntitlement(userId, -env.ENTITLEMENT_DAYS);
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string | undefined,
) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Stripe webhook secret is not configured", 503);
  }
  if (!signature) {
    throw new AppError("Missing Stripe signature", 400);
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError("Invalid Stripe signature", 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await completeCheckout(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      await transitionPurchase(event.data.object.id, ["pending"], "failed");
      break;
    case "checkout.session.expired":
      await transitionPurchase(event.data.object.id, ["pending"], "canceled");
      break;
    case "charge.refunded":
      await refundCharge(stripe, event.data.object);
      break;
    default:
      break;
  }

  return { received: true };
}

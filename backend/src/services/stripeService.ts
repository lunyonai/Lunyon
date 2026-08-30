import Stripe from "stripe";
import { env } from "../config/env.js";
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
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
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
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await supabaseAdmin
      .from("purchases")
      .update({ status: "completed" })
      .eq("provider_session_id", session.id);
  }

  return { received: true };
}

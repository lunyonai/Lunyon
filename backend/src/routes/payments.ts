import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { createCheckoutSession } from "../services/stripeService.js";

const router = Router();

function sameOriginUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (!value.startsWith(env.FRONTEND_URL)) {
    throw new AppError("Redirect URL must match FRONTEND_URL", 400);
  }
  return value;
}

router.post("/stripe/checkout", requireAuth, async (req, res, next) => {
  try {
    if (!req.user?.email) throw new AppError("User email required", 400);

    const body = z
      .object({
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
      .strict()
      .parse(req.body ?? {});

    const result = await createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      successUrl: sameOriginUrl(
        body.successUrl,
        `${env.FRONTEND_URL}/dashboard?paid=1`,
      ),
      cancelUrl: sameOriginUrl(
        body.cancelUrl,
        `${env.FRONTEND_URL}/dashboard?canceled=1`,
      ),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/paypal/create-order", requireAuth, (_req, res) => {
  res.status(410).json({
    error: "PayPal checkout is disabled. Lunyon uses Stripe as the payment path.",
  });
});

router.post("/paypal/capture", requireAuth, (_req, res) => {
  res.status(410).json({
    error: "PayPal capture is disabled. Lunyon uses Stripe as the payment path.",
  });
});

export default router;

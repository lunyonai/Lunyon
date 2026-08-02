import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { createCheckoutSession } from "../services/stripeService.js";
import {
  capturePayPalOrder,
  createPayPalOrder,
} from "../services/paypalService.js";

const router = Router();

router.post("/stripe/checkout", requireAuth, async (req, res, next) => {
  try {
    if (!req.user?.email) throw new AppError("User email required", 400);

    const body = z
      .object({
        priceId: z.string().min(1),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
      .parse(req.body);

    const result = await createCheckoutSession({
      userId: req.user.id,
      email: req.user.email,
      priceId: body.priceId,
      successUrl: body.successUrl ?? `${env.FRONTEND_URL}/dashboard?paid=1`,
      cancelUrl: body.cancelUrl ?? `${env.FRONTEND_URL}/dashboard?canceled=1`,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/paypal/create-order", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const body = z
      .object({
        amount: z.string().min(1),
        currency: z.string().optional(),
        returnUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
      .parse(req.body);

    const result = await createPayPalOrder({
      userId: req.user.id,
      amount: body.amount,
      currency: body.currency,
      returnUrl: body.returnUrl ?? `${env.FRONTEND_URL}/dashboard?paypal=1`,
      cancelUrl: body.cancelUrl ?? `${env.FRONTEND_URL}/dashboard?canceled=1`,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/paypal/capture", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ orderId: z.string().min(1) }).parse(req.body);
    const result = await capturePayPalOrder(body.orderId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

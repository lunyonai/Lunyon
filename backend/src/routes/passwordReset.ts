import { Router } from "express";
import { z } from "zod";
import { clientIp, consumeRateLimit } from "../lib/rateLimit.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  confirmPasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../services/passwordResetService.js";

const router = Router();

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
});

function assertRate(
  key: string,
  max: number,
  windowMs: number,
  cooldownMs?: number,
) {
  const result = consumeRateLimit({ key, max, windowMs, cooldownMs });
  if (!result.ok) {
    throw new AppError("Please wait before trying again", 429, "RATE_LIMITED");
  }
}

router.post("/request", async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const ip = clientIp(req);
    assertRate(`reset-ip:${ip}`, 20, 60 * 60 * 1000);
    assertRate(`reset-email:${email.toLowerCase()}`, 5, 60 * 60 * 1000, 60 * 1000);
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().trim().email().max(254),
        code: z.string().min(1).max(12),
      })
      .strict()
      .parse(req.body);
    const ip = clientIp(req);
    assertRate(`reset-verify-ip:${ip}`, 30, 15 * 60 * 1000);
    const result = await verifyPasswordResetCode(body.email, body.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/confirm", async (req, res, next) => {
  try {
    const body = z
      .object({
        resetToken: z.string().min(20).max(200),
        newPassword: z.string().min(8).max(128),
      })
      .strict()
      .parse(req.body);
    const ip = clientIp(req);
    assertRate(`reset-confirm-ip:${ip}`, 20, 60 * 60 * 1000);
    const result = await confirmPasswordReset(body.resetToken, body.newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

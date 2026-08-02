import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { generateCompletion } from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/generate", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        prompt: z.string().min(1),
        system: z.string().optional(),
        provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
      })
      .parse(req.body);

    const result = await generateCompletion(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/email", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        to: z.string().email(),
        subject: z.string().min(1),
        html: z.string().min(1),
        text: z.string().optional(),
      })
      .parse(req.body);

    const result = await sendEmail(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/health-secure", requireAuth, (req, res) => {
  if (!req.user) throw new AppError("Unauthorized", 401);
  res.json({ ok: true, userId: req.user.id });
});

export default router;

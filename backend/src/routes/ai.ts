import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import { PROMPT_TEMPLATE_IDS } from "../services/ai/prompts.js";
import { runPromptTemplate } from "../services/runService.js";

const router = Router();

const runPromptSchema = z
  .object({
    input: z.string().trim().min(1).max(8000),
    locale: z.enum(["en", "pt", "es"]).default("en"),
  })
  .strict();

router.post("/prompts/:promptId/run", requireAuth, aiRateLimit, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const promptId = z.enum(PROMPT_TEMPLATE_IDS).parse(req.params.promptId);
    const body = runPromptSchema.parse(req.body ?? {});
    const result = await runPromptTemplate(req.user.id, { promptId, ...body });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/email", requireAuth, (_req, res) => {
  res.status(410).json({
    error: "Arbitrary email sending is disabled.",
  });
});

router.get("/health-secure", requireAuth, (req, res) => {
  if (!req.user) throw new AppError("Unauthorized", 401);
  res.json({ ok: true, userId: req.user.id });
});

export default router;

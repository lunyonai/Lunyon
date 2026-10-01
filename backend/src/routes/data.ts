import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createPrompt,
  getCourseProgress,
  getSettings,
  listPrompts,
  listTemplates,
  updateSettings,
  upsertCourseProgress,
} from "../services/dataService.js";
import {
  getNormalizedEntitlement,
  getNormalizedMe,
} from "../services/identityService.js";

const router = Router();

const settingsUpdateSchema = z
  .object({
    theme: z.enum(["dark", "light"]).optional(),
    locale: z.enum(["en", "pt", "es", "pt-BR"]).optional(),
    notifications_enabled: z.boolean().optional(),
    preferred_ai_provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
  })
  .strict();

router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const me = await getNormalizedMe(req.user);
    res.json(me);
  } catch (err) {
    next(err);
  }
});

router.get("/entitlement", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const entitlement = await getNormalizedEntitlement(req.user.id);
    res.json(entitlement);
  } catch (err) {
    next(err);
  }
});

router.get("/prompts", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await listPrompts(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/prompts", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = z
      .object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(req.body);

    const data = await createPrompt({ userId: req.user.id, ...body });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

/** @deprecated Legacy course product. Not used by the Lunyon app. */
router.get("/templates", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await listTemplates(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/** @deprecated Legacy course product. Not used by the Lunyon app. */
router.get("/course-progress", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getCourseProgress(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/** @deprecated Legacy course product. Not used by the Lunyon app. */
router.put("/course-progress", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = z
      .object({
        courseId: z.string().min(1),
        progressPercent: z.number().min(0).max(100),
        completedLessons: z.array(z.string()).optional(),
      })
      .parse(req.body);

    const data = await upsertCourseProgress({
      userId: req.user.id,
      ...body,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/settings", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getSettings(req.user.id);
    res.json(data ?? {});
  } catch (err) {
    next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = settingsUpdateSchema.parse(req.body ?? {});
    const data = await updateSettings(req.user.id, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

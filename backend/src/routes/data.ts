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

const router = Router();

router.use(requireAuth);

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

router.get("/templates", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await listTemplates(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/course-progress", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await getCourseProgress(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

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
    const data = await updateSettings(req.user.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { isValidTimezone } from "../lib/schedule.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getActivityStats, listActivity } from "../services/activityService.js";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["prompt", "employee", "workflow"]).optional(),
  ref: z.string().min(1).max(80).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const query = listQuery.parse(req.query);
    res.json(
      await listActivity(req.user.id, { limit: query.limit, type: query.type, refId: query.ref }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const tz = typeof req.query.tz === "string" && isValidTimezone(req.query.tz) ? req.query.tz : "UTC";
    res.json(await getActivityStats(req.user.id, tz));
  } catch (err) {
    next(err);
  }
});

export default router;

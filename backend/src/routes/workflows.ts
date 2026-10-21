import { Router } from "express";
import { z } from "zod";
import { isValidTimezone } from "../lib/schedule.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import {
  getWorkflowRun,
  listWorkflowRuns,
  startWorkflowRun,
} from "../services/workflowEngine.js";
import {
  createWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
} from "../services/workflowService.js";

const router = Router();
router.use(requireAuth);

const idSchema = z.string().uuid();

function paramId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return idSchema.parse(raw);
}

const paramValue = z.union([z.string().max(8000), z.number(), z.boolean(), z.null()]);

const stepSchema = z
  .object({
    id: z.string().min(1).max(80),
    type: z.enum([
      "run_employee",
      "run_prompt",
      "gmail.read_recent",
      "calendar.read_today",
    ]),
    employeeId: z.string().uuid().nullable().optional(),
    params: z.record(z.string().max(80), paramValue).optional(),
  })
  .strict();

const scheduleSchema = z
  .object({
    frequency: z.enum(["daily", "weekdays", "weekly"]),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    weekday: z.number().int().min(0).max(6).optional(),
    timezone: z.string().min(1).max(80).refine(isValidTimezone, "Invalid timezone"),
    locale: z.enum(["en", "pt", "es"]).default("en"),
  })
  .strict()
  .refine((value) => value.frequency !== "weekly" || value.weekday !== undefined, {
    message: "weekday is required for weekly schedules",
  });

const baseFields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  trigger: z.enum(["manual", "schedule"]).optional(),
  schedule: scheduleSchema.nullable().optional(),
  steps: z.array(stepSchema).min(1).max(20),
  employeeId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
};

const createSchema = z.object(baseFields).strict();
const patchSchema = z.object(baseFields).partial().strict();

router.get("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await listWorkflows(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = createSchema.parse(req.body);
    const data = await createWorkflow(req.user.id, body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const data = await getWorkflow(req.user.id, id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const body = patchSchema.parse(req.body ?? {});
    const data = await updateWorkflow(req.user.id, id, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/duplicate", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const body = z
      .object({ title: z.string().trim().min(1).max(180) })
      .strict()
      .parse(req.body ?? {});
    const data = await duplicateWorkflow(req.user.id, id, body.title);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/run", aiRateLimit, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const body = z
      .object({ locale: z.enum(["en", "pt", "es"]).default("en") })
      .strict()
      .parse(req.body ?? {});
    const run = await startWorkflowRun(req.user.id, id, { trigger: "manual", locale: body.locale });
    res.status(202).json(run);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/runs", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const limit = z.coerce.number().int().min(1).max(50).default(10).parse(req.query.limit);
    res.json(await listWorkflowRuns(req.user.id, id, limit));
  } catch (err) {
    next(err);
  }
});

router.get("/:id/runs/:runId", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const runId = paramId(req.params.runId);
    res.json(await getWorkflowRun(req.user.id, id, runId));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    await deleteWorkflow(req.user.id, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

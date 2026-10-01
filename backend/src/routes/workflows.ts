import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
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

const paramValue = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);

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

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional().nullable(),
    trigger: z.enum(["manual"]).optional(),
    steps: z.array(stepSchema).min(1).max(20),
    employeeId: z.string().uuid().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    trigger: z.enum(["manual"]).optional(),
    steps: z.array(stepSchema).min(1).max(20).optional(),
    employeeId: z.string().uuid().nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict();

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

router.post("/:id/run", (_req, res) => {
  res.status(410).json({
    error: "Workflow execution is not available yet.",
  });
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

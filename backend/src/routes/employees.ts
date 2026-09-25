import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createEmployee,
  deleteEmployee,
  duplicateEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employeeService.js";

const router = Router();
router.use(requireAuth);

const extraSchema = z.record(z.string().max(80), z.string().max(500));

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional().nullable(),
    purpose: z.string().trim().max(4000).optional().nullable(),
    instructions: z.string().trim().max(8000).optional().nullable(),
    kind: z.enum(["email", "meeting", "content", "workflow", "analyst", "custom"]),
    icon: z.enum(["mail", "message", "send", "workflow", "bot"]).optional(),
    status: z.enum(["active", "paused"]).optional(),
    capabilities: z
      .array(
        z.enum([
          "run_task",
          "run_prompt",
          "run_workflow",
          "gmail.read",
          "calendar.read",
        ]),
      )
      .max(20)
      .optional(),
    extra: extraSchema.optional(),
    workflowIds: z.array(z.string().max(80)).max(50).optional(),
  })
  .strict();

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    purpose: z.string().trim().max(4000).optional().nullable(),
    instructions: z.string().trim().max(8000).optional().nullable(),
    kind: z.enum(["email", "meeting", "content", "workflow", "analyst", "custom"]).optional(),
    icon: z.enum(["mail", "message", "send", "workflow", "bot"]).optional(),
    status: z.enum(["active", "paused"]).optional(),
    capabilities: z
      .array(
        z.enum([
          "run_task",
          "run_prompt",
          "run_workflow",
          "gmail.read",
          "calendar.read",
        ]),
      )
      .max(20)
      .optional(),
    extra: extraSchema.optional(),
    workflowIds: z.array(z.string().max(80)).max(50).optional(),
  })
  .strict();

const idSchema = z.string().uuid();

function paramId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return idSchema.parse(raw);
}

router.get("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await listEmployees(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = createSchema.parse(req.body);
    const data = await createEmployee(req.user.id, body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    const data = await getEmployee(req.user.id, id);
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
    const data = await updateEmployee(req.user.id, id, body);
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
      .object({ name: z.string().trim().min(1).max(140) })
      .strict()
      .parse(req.body ?? {});
    const data = await duplicateEmployee(req.user.id, id, body.name);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = paramId(req.params.id);
    await deleteEmployee(req.user.id, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

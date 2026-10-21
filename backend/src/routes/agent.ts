import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import {
  cancelAgentAction,
  confirmAgentAction,
  deleteConversation,
  deleteUserAiKey,
  getAgentStatus,
  getConversationMessages,
  listConversations,
  saveUserAiKey,
  sendAgentMessage,
} from "../services/agent/agentService.js";

const router = Router();
router.use(requireAuth);

const idSchema = z.string().uuid();

function paramId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return idSchema.parse(raw);
}

function userId(req: { user?: { id: string } }) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  return req.user.id;
}

const keySchema = z
  .object({
    provider: z.enum(["openai", "gemini"]),
    apiKey: z.string().trim().min(20).max(300),
  })
  .strict();

const messageSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(4000),
    timezone: z.string().min(1).max(80),
    locale: z.enum(["en", "pt", "es"]).default("en"),
  })
  .strict();

router.get("/status", async (req, res, next) => {
  try {
    res.json(await getAgentStatus(userId(req)));
  } catch (err) {
    next(err);
  }
});

router.put("/key", async (req, res, next) => {
  try {
    const body = keySchema.parse(req.body);
    res.json(await saveUserAiKey(userId(req), body.provider, body.apiKey));
  } catch (err) {
    next(err);
  }
});

router.delete("/key", async (req, res, next) => {
  try {
    res.json(await deleteUserAiKey(userId(req)));
  } catch (err) {
    next(err);
  }
});

router.get("/conversations", async (req, res, next) => {
  try {
    res.json(await listConversations(userId(req)));
  } catch (err) {
    next(err);
  }
});

router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    res.json(await getConversationMessages(userId(req), paramId(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.delete("/conversations/:id", async (req, res, next) => {
  try {
    await deleteConversation(userId(req), paramId(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/messages", aiRateLimit, async (req, res, next) => {
  try {
    const body = messageSchema.parse(req.body);
    res.json(await sendAgentMessage(userId(req), body));
  } catch (err) {
    next(err);
  }
});

router.post("/actions/:id/confirm", async (req, res, next) => {
  try {
    res.json(await confirmAgentAction(userId(req), paramId(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.post("/actions/:id/cancel", async (req, res, next) => {
  try {
    res.json(await cancelAgentAction(userId(req), paramId(req.params.id)));
  } catch (err) {
    next(err);
  }
});

export default router;

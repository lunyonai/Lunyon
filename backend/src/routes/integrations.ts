import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { signOAuthState, verifyOAuthState } from "../lib/tokenCrypto.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { listCalendarEvents } from "../services/calendarService.js";
import { getGmailMessage, listGmailMessages } from "../services/gmailService.js";
import {
  completeGoogleOAuth,
  disconnectGoogle,
  getGoogleStatus,
} from "../services/googleConnectionService.js";
import { assertGoogleConfigured, googleAuthUrl } from "../services/googleOAuth.js";

const router = Router();

function frontendRedirect(pathQuery: string) {
  return `${env.FRONTEND_URL}/settings?${pathQuery}`;
}

router.get("/google/connect", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    assertGoogleConfigured();
    const state = signOAuthState(req.user.id);
    res.json({ url: googleAuthUrl(state) });
  } catch (err) {
    next(err);
  }
});

router.get("/google/callback", async (req, res) => {
  try {
    const query = z
      .object({
        code: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        error: z.string().optional(),
      })
      .parse(req.query);

    if (query.error || !query.code || !query.state) {
      return res.redirect(frontendRedirect("google=denied"));
    }

    const userId = verifyOAuthState(query.state);
    await completeGoogleOAuth(userId, query.code);
    return res.redirect(frontendRedirect("google=connected"));
  } catch {
    return res.redirect(frontendRedirect("google=error"));
  }
});

router.get("/google/status", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const status = await getGoogleStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.post("/google/disconnect", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const status = await disconnectGoogle(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.get("/google/gmail/messages", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const query = z
      .object({ limit: z.coerce.number().int().min(1).max(15).optional() })
      .parse(req.query);
    const messages = await listGmailMessages(req.user.id, query.limit ?? 10);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.get("/google/gmail/messages/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = z.string().min(1).max(128).parse(req.params.id);
    const message = await getGmailMessage(req.user.id, id);
    res.json(message);
  } catch (err) {
    next(err);
  }
});

router.get("/google/calendar/events", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const query = z
      .object({ range: z.enum(["today", "next7"]).optional() })
      .parse(req.query);
    const events = await listCalendarEvents(req.user.id, query.range ?? "next7");
    res.json(events);
  } catch (err) {
    next(err);
  }
});

export default router;

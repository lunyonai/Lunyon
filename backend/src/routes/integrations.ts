import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { signOAuthState, verifyOAuthState } from "../lib/tokenCrypto.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  getTodayEvents,
  getUpcomingEvents,
  listCalendarEvents,
  listGoogleCalendars,
} from "../services/calendarService.js";
import { getGmailMessage, listGmailMessages } from "../services/gmailService.js";
import {
  completeGoogleOAuth,
  disconnectGoogle,
  getGoogleStatus,
  saveSelectedCalendarIds,
} from "../services/googleConnectionService.js";
import { commitCalendarWrite, previewCalendarWrite } from "../services/calendarWrite.js";
import { assertGoogleConfigured, googleAuthUrl } from "../services/googleOAuth.js";

const router = Router();

function frontendRedirect(pathQuery: string) {
  return `${env.FRONTEND_URL}/settings?${pathQuery}`;
}

router.get("/google/connect", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    assertGoogleConfigured();
    const write = req.query.write === "1" || req.query.write === "true";
    const state = signOAuthState(req.user.id);
    res.json({ url: googleAuthUrl(state, write) });
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

async function handleDisconnect(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const status = await disconnectGoogle(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

router.post("/google/disconnect", requireAuth, handleDisconnect);
router.delete("/google", requireAuth, handleDisconnect);

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

router.get("/google/calendars", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const calendars = await listGoogleCalendars(req.user.id);
    res.json(calendars);
  } catch (err) {
    next(err);
  }
});

router.put("/google/calendars", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = z
      .object({
        calendarIds: z.array(z.string().min(1).max(256)).max(50),
      })
      .parse(req.body);
    await saveSelectedCalendarIds(req.user.id, body.calendarIds);
    const calendars = await listGoogleCalendars(req.user.id);
    res.json(calendars);
  } catch (err) {
    next(err);
  }
});

router.get("/google/calendar/today", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const events = await getTodayEvents(req.user.id);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.get("/google/calendar/upcoming", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const query = z
      .object({ days: z.coerce.number().int().min(1).max(31).optional() })
      .parse(req.query);
    const events = await getUpcomingEvents(req.user.id, query.days ?? 7);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post("/google/calendar/events/preview", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const preview = await previewCalendarWrite(req.user.id, req.body);
    res.json(preview);
  } catch (err) {
    next(err);
  }
});

router.post("/google/calendar/events", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = z.object({ confirmationToken: z.string().min(16) }).parse(req.body);
    const result = await commitCalendarWrite(req.user.id, body.confirmationToken, {
      action: "create",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/google/calendar/events/:eventId", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const params = z.object({ eventId: z.string().min(1) }).parse(req.params);
    const body = z.object({ confirmationToken: z.string().min(16) }).parse(req.body);
    const result = await commitCalendarWrite(req.user.id, body.confirmationToken, {
      action: "update",
      googleEventId: params.eventId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/google/calendar/events/:eventId", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const params = z.object({ eventId: z.string().min(1) }).parse(req.params);
    const token = z
      .object({ confirmationToken: z.string().min(16) })
      .parse({
        confirmationToken:
          (typeof req.body === "object" && req.body && "confirmationToken" in req.body
            ? String((req.body as { confirmationToken?: string }).confirmationToken ?? "")
            : "") || String(req.query.confirmationToken ?? ""),
      });
    const result = await commitCalendarWrite(req.user.id, token.confirmationToken, {
      action: "delete",
      googleEventId: params.eventId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

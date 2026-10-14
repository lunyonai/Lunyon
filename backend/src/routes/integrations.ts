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
import {
  getGmailConnectionStatus,
  getGmailMessage,
  getGmailThread,
  listGmailMessages,
  searchGmailMessages,
} from "../services/gmailService.js";
import {
  previewGmailSend,
  replyToGmailMessage,
  sendGmailMessage,
} from "../services/gmailSend.js";
import {
  completeGmailOAuth,
  disconnectGmail,
} from "../services/gmailConnectionService.js";
import {
  completeGoogleOAuth,
  disconnectGoogle,
  getGoogleStatus,
  saveSelectedCalendarIds,
} from "../services/googleConnectionService.js";
import { commitCalendarWrite, previewCalendarWrite } from "../services/calendarWrite.js";
import { assertGoogleConfigured, gmailAuthUrl, googleAuthUrl } from "../services/googleOAuth.js";

const router = Router();

function frontendRedirect(pathQuery: string) {
  return `${env.FRONTEND_URL}/settings?${pathQuery}`;
}

function noStore(res: Response) {
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
}

router.get("/google/connect", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    assertGoogleConfigured();
    const write = req.query.write === "1" || req.query.write === "true";
    const state = signOAuthState(req.user.id, "calendar");
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
      let denied = "google=denied";
      try {
        const purpose = query.state ? verifyOAuthState(query.state).purpose : "calendar";
        if (purpose === "gmail" || purpose === "gmail_send") {
          denied = "gmail=denied";
        }
      } catch {
        // keep calendar flag
      }
      return res.redirect(frontendRedirect(denied));
    }

    const { userId, purpose } = verifyOAuthState(query.state);
    if (purpose === "gmail" || purpose === "gmail_send") {
      await completeGmailOAuth(userId, query.code, purpose === "gmail_send" ? "send" : "read");
      return res.redirect(
        frontendRedirect(purpose === "gmail_send" ? "gmail=send" : "gmail=connected"),
      );
    }
    await completeGoogleOAuth(userId, query.code);
    return res.redirect(frontendRedirect("google=connected"));
  } catch {
    let flag = "google=error";
    try {
      const state = typeof req.query.state === "string" ? req.query.state : "";
      const purpose = state ? verifyOAuthState(state).purpose : "calendar";
      if (purpose === "gmail" || purpose === "gmail_send") flag = "gmail=error";
    } catch {
      // keep calendar flag
    }
    return res.redirect(frontendRedirect(flag));
  }
});

router.get("/gmail/connect", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    assertGoogleConfigured();
    const send = req.query.send === "1" || req.query.send === "true";
    const state = signOAuthState(req.user.id, send ? "gmail_send" : "gmail");
    res.json({ url: gmailAuthUrl(state, send) });
  } catch (err) {
    next(err);
  }
});

router.get("/gmail/status", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const status = await getGmailConnectionStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

async function handleGmailDisconnect(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const status = await disconnectGmail(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

router.post("/gmail/disconnect", requireAuth, handleGmailDisconnect);
router.delete("/gmail", requireAuth, handleGmailDisconnect);

const gmailListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  pageToken: z.string().max(1024).optional(),
  q: z.string().max(500).optional(),
  folder: z.enum(["inbox", "sent", "all"]).optional(),
});

router.get("/gmail/messages", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const query = gmailListQuery.parse(req.query);
    const folder = query.folder ?? "inbox";
    const page = await listGmailMessages(req.user.id, {
      limit: query.limit ?? 20,
      pageToken: query.pageToken,
      query: query.q,
      folder,
    });
    res.json(page);
  } catch (err) {
    next(err);
  }
});

router.get("/gmail/search", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const query = gmailListQuery.extend({ q: z.string().min(1).max(500) }).parse(req.query);
    const folder = query.folder ?? "inbox";
    const page = await searchGmailMessages(req.user.id, query.q, {
      limit: query.limit ?? 20,
      pageToken: query.pageToken,
      folder,
    });
    res.json(page);
  } catch (err) {
    next(err);
  }
});

router.post("/gmail/messages/preview", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const preview = await previewGmailSend(req.user.id, { ...req.body, action: "send" });
    res.json(preview);
  } catch (err) {
    next(err);
  }
});

router.post("/gmail/messages", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const body = z.object({ confirmationToken: z.string().min(16) }).parse(req.body);
    const result = await sendGmailMessage(req.user.id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/gmail/messages/:id/reply/preview", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const id = z.string().min(1).max(128).parse(req.params.id);
    const preview = await previewGmailSend(req.user.id, {
      ...req.body,
      action: "reply",
      replyToMessageId: id,
    });
    res.json(preview);
  } catch (err) {
    next(err);
  }
});

router.post("/gmail/messages/:id/reply", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const id = z.string().min(1).max(128).parse(req.params.id);
    const body = z.object({ confirmationToken: z.string().min(16) }).parse(req.body);
    const result = await replyToGmailMessage(req.user.id, id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/gmail/threads/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const id = z.string().min(1).max(128).parse(req.params.id);
    const thread = await getGmailThread(req.user.id, id);
    res.json(thread);
  } catch (err) {
    next(err);
  }
});

router.get("/gmail/messages/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
    const id = z.string().min(1).max(128).parse(req.params.id);
    const message = await getGmailMessage(req.user.id, id);
    res.json(message);
  } catch (err) {
    next(err);
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
    noStore(res);
    const page = await listGmailMessages(req.user.id, { limit: query.limit ?? 10 });
    res.json(page.messages);
  } catch (err) {
    next(err);
  }
});

router.get("/google/gmail/messages/:id", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    noStore(res);
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

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getNormalizedMe } from "../services/identityService.js";

const router = Router();

function goneProductAuth(_req: Request, res: Response) {
  res.status(410).json({
    error:
      "This endpoint is not the Lunyon authentication path. Sign in with the app (Supabase Auth).",
  });
}

router.post("/register", goneProductAuth);
router.post("/login", goneProductAuth);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const me = await getNormalizedMe(req.user);
    res.json(me);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

export default router;

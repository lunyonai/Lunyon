import { Router } from "express";
import {
  getProfile,
  loginUser,
  registerUser,
} from "../services/authService.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    if (result.user?.email) {
      try {
        await sendWelcomeEmail(
          result.user.email,
          result.user.user_metadata?.full_name,
        );
      } catch {
        // Email is optional — don't fail registration
      }
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const profile = await getProfile(req.user.id);
    res.json({ user: req.user, profile });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

export default router;

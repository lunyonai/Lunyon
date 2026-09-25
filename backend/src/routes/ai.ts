import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/generate", requireAuth, (_req, res) => {
  res.status(410).json({
    error:
      "Direct AI generation is disabled. Execution will be available through the Workflow Execution Engine.",
  });
});

router.post("/email", requireAuth, (_req, res) => {
  res.status(410).json({
    error: "Arbitrary email sending is disabled.",
  });
});

router.get("/health-secure", requireAuth, (req, res) => {
  if (!req.user) throw new AppError("Unauthorized", 401);
  res.json({ ok: true, userId: req.user.id });
});

export default router;

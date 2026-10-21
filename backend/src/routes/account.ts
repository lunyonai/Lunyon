import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { deleteAccount, exportAccountData } from "../services/accountService.js";

const router = Router();
router.use(requireAuth);

router.get("/export", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await exportAccountData(req.user);
    res.setHeader("Content-Disposition", 'attachment; filename="lunyon-data.json"');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = z.object({ confirmEmail: z.string().trim().min(1) }).strict().parse(req.body ?? {});
    if (!req.user.email || body.confirmEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      throw new AppError("Type your account email to confirm", 400, "CONFIRMATION_MISMATCH");
    }
    await deleteAccount(req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

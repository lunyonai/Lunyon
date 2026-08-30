import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import paymentsRoutes from "./routes/payments.js";
import aiRoutes from "./routes/ai.js";
import { handleStripeWebhook } from "./services/stripeService.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "lunyon-api",
      env: env.NODE_ENV,
    });
  });

  // Stripe needs the raw body for signature verification
  app.post(
    "/api/payments/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res, next) => {
      try {
        const result = await handleStripeWebhook(
          req.body as Buffer,
          req.headers["stripe-signature"] as string | undefined,
        );
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api", dataRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/ai", aiRoutes);

  app.use(errorHandler);

  return app;
}

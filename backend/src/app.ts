import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import paymentsRoutes from "./routes/payments.js";
import aiRoutes from "./routes/ai.js";
import agentRoutes from "./routes/agent.js";
import employeeRoutes from "./routes/employees.js";
import workflowRoutes from "./routes/workflows.js";
import integrationRoutes from "./routes/integrations.js";
import { handleStripeWebhook } from "./services/stripeService.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(corsOptions));
  app.options("/{*path}", cors(corsOptions));

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
  app.use("/api/employees", employeeRoutes);
  app.use("/api/workflows", workflowRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api", dataRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/agent", agentRoutes);

  app.use(errorHandler);

  return app;
}

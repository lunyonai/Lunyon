import type { CorsOptions } from "cors";
import { env } from "./env.js";

export const PRODUCTION_FRONTEND_ORIGIN = "https://lunyon.vercel.app";
export const LOCAL_FRONTEND_ORIGIN = "http://localhost:5173";

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function allowedCorsOrigins() {
  const extra = (process.env.FRONTEND_URLS ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return [
    ...new Set([
      PRODUCTION_FRONTEND_ORIGIN,
      LOCAL_FRONTEND_ORIGIN,
      normalizeOrigin(env.FRONTEND_URL),
      ...extra,
    ]),
  ];
}

export function isAllowedCorsOrigin(origin: string | undefined) {
  if (!origin) return true;
  return allowedCorsOrigins().includes(normalizeOrigin(origin));
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

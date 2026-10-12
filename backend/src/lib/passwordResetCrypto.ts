import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

function pepper(): Buffer {
  const raw = env.PASSWORD_RESET_HMAC_KEY.trim();
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return createHash("sha256").update(raw).digest();
  }
  return createHash("sha256")
    .update(`lunyon-password-reset:${env.SUPABASE_SERVICE_ROLE_KEY}`)
    .digest();
}

export function hmacValue(value: string): string {
  return createHmac("sha256", pepper()).update(value).digest("hex");
}

export function hmacEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hashOtp(userId: string, code: string): string {
  return hmacValue(`otp:${userId}:${code}`);
}

export function hashResetToken(token: string): string {
  return hmacValue(`reset:${token}`);
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

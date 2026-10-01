import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
  const raw = env.INTEGRATION_ENCRYPTION_KEY.trim();
  if (!raw) {
    throw new AppError("Integrations are not configured", 503);
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const utf8 = Buffer.from(raw, "utf8");
  if (utf8.length === 32) return utf8;

  throw new AppError("Integrations are not configured", 503);
}

export function encryptSecret(plaintext: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const key = encryptionKey();
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length < 29) {
    throw new AppError("Stored credentials are invalid", 500);
  }
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function signOAuthState(userId: string): string {
  const exp = Date.now() + 10 * 60 * 1000;
  const nonce = randomBytes(16).toString("hex");
  const body = `${userId}.${exp}.${nonce}`;
  const mac = createHmac("sha256", encryptionKey()).update(body).digest("hex");
  return Buffer.from(`${body}.${mac}`).toString("base64url");
}

export function verifyOAuthState(state: string): string {
  let decoded: string;
  try {
    decoded = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    throw new AppError("Invalid OAuth state", 400);
  }

  const parts = decoded.split(".");
  if (parts.length !== 4) throw new AppError("Invalid OAuth state", 400);
  const [userId, expRaw, nonce, mac] = parts;
  if (!userId || !expRaw || !nonce || !mac) {
    throw new AppError("Invalid OAuth state", 400);
  }

  const expected = createHmac("sha256", encryptionKey())
    .update(`${userId}.${expRaw}.${nonce}`)
    .digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError("Invalid OAuth state", 400);
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) {
    throw new AppError("OAuth state expired", 400);
  }

  return userId;
}

import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  generateOtp,
  generateResetToken,
  hashOtp,
  hashResetToken,
  hmacEquals,
  normalizeEmail,
} from "../lib/passwordResetCrypto.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendPasswordResetCodeEmail } from "./emailService.js";

const CHALLENGE_MS = 10 * 60 * 1000;
const GENERIC = {
  success: true as const,
};

type ChallengeRow = {
  id: string;
  user_id: string;
  email_normalized: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  consumed_at: string | null;
  verified_at: string | null;
  reset_token_hash: string | null;
  reset_token_expires_at: string | null;
};

function dbUnavailable(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Password reset is not available yet", 503, "RESET_UNAVAILABLE");
  }
  throw new AppError("Could not complete this request", 400, "RESET_UNAVAILABLE");
}

async function pauseEnumeration() {
  await new Promise((resolve) => setTimeout(resolve, 180 + Math.floor(Math.random() * 120)));
}

async function findAuthUserId(email: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile?.id) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (!error && data.user) return data.user.id;
  }

  const response = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1&email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  );

  if (response.ok) {
    const body = (await response.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    const match = body.users?.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
  }

  for (let page = 1; page <= 3; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) break;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }

  return null;
}

async function invalidateActiveChallenges(userId: string) {
  await supabaseAdmin
    .from("password_reset_challenges")
    .update({
      consumed_at: new Date().toISOString(),
      reset_token_hash: null,
      reset_token_expires_at: null,
    })
    .eq("user_id", userId)
    .is("consumed_at", null);
}

export async function requestPasswordReset(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  await pauseEnumeration();

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError("Email is temporarily unavailable", 503, "EMAIL_UNAVAILABLE");
  }

  const { error: tableError } = await supabaseAdmin
    .from("password_reset_challenges")
    .select("id")
    .limit(1);
  if (tableError) dbUnavailable(tableError);

  const userId = await findAuthUserId(email);
  if (!userId) {
    return GENERIC;
  }

  const code = generateOtp();
  const now = new Date();
  await invalidateActiveChallenges(userId);

  const { error } = await supabaseAdmin.from("password_reset_challenges").insert({
    user_id: userId,
    email_normalized: email,
    code_hash: hashOtp(userId, code),
    expires_at: new Date(now.getTime() + CHALLENGE_MS).toISOString(),
    attempts: 0,
    max_attempts: 5,
  });

  if (error) dbUnavailable(error);

  try {
    await sendPasswordResetCodeEmail(email, code);
  } catch {
    await invalidateActiveChallenges(userId);
  }

  return GENERIC;
}

export async function verifyPasswordResetCode(emailRaw: string, codeRaw: string) {
  const email = normalizeEmail(emailRaw);
  const code = codeRaw.replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) {
    throw new AppError("Invalid or expired code", 400, "INVALID_CODE");
  }

  const { data, error } = await supabaseAdmin
    .from("password_reset_challenges")
    .select("*")
    .eq("email_normalized", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) dbUnavailable(error);
  const row = data as ChallengeRow | null;
  if (!row) {
    throw new AppError("Invalid or expired code", 400, "INVALID_CODE");
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new AppError("Invalid or expired code", 400, "EXPIRED_CODE");
  }

  if (row.verified_at) {
    throw new AppError("Invalid or expired code", 400, "INVALID_CODE");
  }

  if (row.attempts >= row.max_attempts) {
    throw new AppError("Too many attempts. Request a new code", 429, "TOO_MANY_ATTEMPTS");
  }

  const expected = hashOtp(row.user_id, code);
  if (!hmacEquals(expected, row.code_hash)) {
    await supabaseAdmin
      .from("password_reset_challenges")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    if (row.attempts + 1 >= row.max_attempts) {
      throw new AppError("Too many attempts. Request a new code", 429, "TOO_MANY_ATTEMPTS");
    }
    throw new AppError("Invalid or expired code", 400, "INVALID_CODE");
  }

  const resetToken = generateResetToken();
  const { error: updateError } = await supabaseAdmin
    .from("password_reset_challenges")
    .update({
      verified_at: new Date().toISOString(),
      reset_token_hash: hashResetToken(resetToken),
      reset_token_expires_at: new Date(Date.now() + CHALLENGE_MS).toISOString(),
    })
    .eq("id", row.id)
    .is("consumed_at", null);

  if (updateError) dbUnavailable(updateError);

  return { success: true, resetToken };
}

export async function confirmPasswordReset(resetToken: string, newPassword: string) {
  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
  }

  const tokenHash = hashResetToken(resetToken);
  const { data, error } = await supabaseAdmin
    .from("password_reset_challenges")
    .select("*")
    .eq("reset_token_hash", tokenHash)
    .is("consumed_at", null)
    .maybeSingle();

  if (error) dbUnavailable(error);
  const row = data as ChallengeRow | null;
  if (!row || !row.verified_at) {
    throw new AppError("This reset link is invalid or has expired", 400, "INVALID_RESET_TOKEN");
  }

  if (
    !row.reset_token_expires_at ||
    new Date(row.reset_token_expires_at).getTime() <= Date.now()
  ) {
    throw new AppError("This reset link is invalid or has expired", 400, "EXPIRED_RESET_TOKEN");
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    row.user_id,
    { password: newPassword },
  );

  if (authError) {
    throw new AppError("Could not update password", 400, "UPDATE_FAILED");
  }

  await supabaseAdmin
    .from("password_reset_challenges")
    .update({
      consumed_at: new Date().toISOString(),
      reset_token_hash: null,
      reset_token_expires_at: null,
    })
    .eq("id", row.id);

  await invalidateActiveChallenges(row.user_id);

  return { success: true };
}

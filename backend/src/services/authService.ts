import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).optional(),
});

export async function registerUser(input: z.infer<typeof credentialsSchema>) {
  const { email, password, fullName } = credentialsSchema.parse(input);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) throw new AppError(error.message, 400);

  if (data.user) {
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName ?? null,
    });
  }

  const { data: sessionData, error: signInError } =
    await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (signInError) throw new AppError(signInError.message, 400);

  return {
    user: sessionData.user,
    session: sessionData.session,
    accessToken: sessionData.session?.access_token,
  };
}

export async function loginUser(input: z.infer<typeof credentialsSchema>) {
  const { email, password } = credentialsSchema
    .pick({ email: true, password: true })
    .parse(input);

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new AppError(error.message, 401);

  return {
    user: data.user,
    session: data.session,
    accessToken: data.session?.access_token,
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new AppError(error.message, 400);
  return data;
}

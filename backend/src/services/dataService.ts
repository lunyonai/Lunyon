import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listPrompts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("prompts")
    .select("*")
    .or(`is_public.eq.true,user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 400);
  return data;
}

export async function createPrompt(params: {
  userId: string;
  title: string;
  content: string;
  category?: string;
  isPublic?: boolean;
}) {
  const { data, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      user_id: params.userId,
      title: params.title,
      content: params.content,
      category: params.category ?? "general",
      is_public: params.isPublic ?? false,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
}

/** @deprecated Legacy course product. Not used by the Lunyon app. */
export async function listTemplates(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("templates")
    .select("*")
    .or(`is_public.eq.true,user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 400);
  return data;
}

/** @deprecated Legacy course product. Not used by the Lunyon app. */
export async function getCourseProgress(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("course_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new AppError(error.message, 400);
  return data;
}

/** @deprecated Legacy course product. Not used by the Lunyon app. */
export async function upsertCourseProgress(params: {
  userId: string;
  courseId: string;
  progressPercent: number;
  completedLessons?: string[];
}) {
  const { data, error } = await supabaseAdmin
    .from("course_progress")
    .upsert({
      user_id: params.userId,
      course_id: params.courseId,
      progress_percent: params.progressPercent,
      completed_lessons: params.completedLessons ?? [],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
}

export async function getSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new AppError(error.message, 400);
  return data;
}

export type SettingsPatch = {
  theme?: "dark" | "light";
  locale?: "en" | "pt" | "es" | "pt-BR";
  notifications_enabled?: boolean;
  preferred_ai_provider?: "openai" | "anthropic" | "gemini";
};

export async function updateSettings(userId: string, settings: SettingsPatch) {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .upsert({
      ...settings,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
}

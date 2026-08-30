import OpenAI from "openai";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

export type AiProvider = "openai" | "anthropic" | "gemini";

export async function generateCompletion(params: {
  prompt: string;
  system?: string;
  provider?: AiProvider;
}) {
  const provider = params.provider ?? env.DEFAULT_AI_PROVIDER;

  switch (provider) {
    case "openai":
      return callOpenAI(params.prompt, params.system);
    case "anthropic":
      return callAnthropic(params.prompt, params.system);
    case "gemini":
      return callGemini(params.prompt, params.system);
    default:
      throw new AppError(`Unsupported AI provider: ${provider}`, 400);
  }
}

async function callOpenAI(prompt: string, system?: string) {
  if (!env.OPENAI_API_KEY) {
    throw new AppError("OpenAI is not configured", 503);
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      { role: "user" as const, content: prompt },
    ],
  });

  return {
    provider: "openai" as const,
    content: completion.choices[0]?.message?.content ?? "",
  };
}

async function callAnthropic(prompt: string, system?: string) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError("Anthropic is not configured", 503);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: system ?? undefined,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AppError(`Anthropic error: ${details}`, 502);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  return {
    provider: "anthropic" as const,
    content: data.content?.find((c) => c.type === "text")?.text ?? "",
  };
}

async function callGemini(prompt: string, system?: string) {
  if (!env.GEMINI_API_KEY) {
    throw new AppError("Gemini is not configured", 503);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AppError(`Gemini error: ${details}`, 502);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return {
    provider: "gemini" as const,
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
  };
}

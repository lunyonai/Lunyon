import OpenAI from "openai";
import { AppError } from "../../middleware/errorHandler.js";

export type AgentProvider = "openai" | "gemini";

export type AgentTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type HistoryTurn = { role: "user" | "assistant"; content: string };

export type ModelStep = { text: string; toolCalls: ToolCall[] };

/** One conversation turn with a model; keeps the provider-native message list internally. */
export interface ModelSession {
  next(): Promise<ModelStep>;
  addToolResults(results: Array<{ call: ToolCall; output: unknown }>): void;
}

export type ModelConfig = {
  provider: AgentProvider;
  apiKey: string;
  model: string;
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function providerError(status: number | undefined, body = ""): AppError {
  if (status === 401 || status === 403 || body.includes("API_KEY_INVALID")) {
    return new AppError("The AI provider rejected the API key", 502, "AI_KEY_INVALID");
  }
  if (status === 429) {
    return new AppError("The AI provider is rate limiting requests", 429, "AI_RATE_LIMITED");
  }
  return new AppError("The AI provider is unavailable", 502, "AI_UNAVAILABLE");
}

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function openAiSession(
  config: ModelConfig,
  system: string,
  history: HistoryTurn[],
  tools: AgentTool[],
): ModelSession {
  const client = new OpenAI({ apiKey: config.apiKey, maxRetries: 1 });
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
  ];

  return {
    async next() {
      let completion: OpenAI.Chat.ChatCompletion;
      try {
        completion = await client.chat.completions.create({
          model: config.model,
          messages,
          tools: tools.map((tool) => ({ type: "function" as const, function: tool })),
        });
      } catch (err) {
        throw providerError(err instanceof OpenAI.APIError ? err.status : undefined);
      }
      const message = completion.choices[0]?.message;
      if (!message) return { text: "", toolCalls: [] };
      messages.push(message);
      return {
        text: message.content ?? "",
        toolCalls: (message.tool_calls ?? []).map((call) => ({
          id: call.id,
          name: call.function.name,
          args: parseArgs(call.function.arguments),
        })),
      };
    },
    addToolResults(results) {
      for (const { call, output } of results) {
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
      }
    },
  };
}

type GeminiPart = {
  text?: string;
  thought?: boolean;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
};

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

function geminiSession(
  config: ModelConfig,
  system: string,
  history: HistoryTurn[],
  tools: AgentTool[],
): ModelSession {
  const contents: GeminiContent[] = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
  let round = 0;

  return {
    async next() {
      round += 1;
      let response: Response;
      try {
        response = await fetch(
          `${GEMINI_BASE}/models/${encodeURIComponent(config.model)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents,
              tools: [{ functionDeclarations: tools }],
            }),
          },
        );
      } catch {
        throw providerError(undefined);
      }
      if (!response.ok) throw providerError(response.status, await response.text());

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      // Keep the raw parts (including thought signatures) so follow-up rounds stay valid.
      contents.push({ role: "model", parts });
      return {
        text: parts
          .filter((part) => part.text && !part.thought)
          .map((part) => part.text)
          .join(""),
        toolCalls: parts
          .filter((part) => part.functionCall)
          .map((part, index) => ({
            id: `${round}-${index}`,
            name: part.functionCall!.name,
            args: part.functionCall!.args ?? {},
          })),
      };
    },
    addToolResults(results) {
      contents.push({
        role: "user",
        parts: results.map(({ call, output }) => ({
          functionResponse: { name: call.name, response: { result: output } },
        })),
      });
    },
  };
}

export function createModelSession(
  config: ModelConfig,
  system: string,
  history: HistoryTurn[],
  tools: AgentTool[],
): ModelSession {
  return config.provider === "openai"
    ? openAiSession(config, system, history, tools)
    : geminiSession(config, system, history, tools);
}

/** Cheap authenticated call used to check a key before saving it. */
export async function verifyProviderKey(provider: AgentProvider, apiKey: string) {
  let response: Response;
  try {
    response =
      provider === "openai"
        ? await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
        : await fetch(`${GEMINI_BASE}/models?pageSize=1`, {
            headers: { "x-goog-api-key": apiKey },
          });
  } catch {
    throw providerError(undefined);
  }
  if (response.ok) return;
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    throw new AppError("The AI provider rejected the API key", 400, "AI_KEY_INVALID");
  }
  throw providerError(response.status);
}

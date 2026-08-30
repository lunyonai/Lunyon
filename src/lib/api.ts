const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:3001");

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "API request failed",
    );
  }

  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return apiRequest<{
      accessToken?: string;
      session?: { access_token: string };
      user: unknown;
    }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  register(email: string, password: string, fullName?: string) {
    return apiRequest<{
      accessToken?: string;
      session?: { access_token: string };
      user: unknown;
    }>("/api/auth/register", {
      method: "POST",
      body: { email, password, fullName },
    });
  },

  me(token: string) {
    return apiRequest("/api/auth/me", { token });
  },

  generateAi(token: string, prompt: string, system?: string) {
    return apiRequest<{ provider: string; content: string }>(
      "/api/ai/generate",
      {
        method: "POST",
        token,
        body: { prompt, system },
      },
    );
  },

  listPrompts(token: string) {
    return apiRequest("/api/prompts", { token });
  },
};

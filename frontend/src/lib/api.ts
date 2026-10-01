import { supabase } from "./supabase";

// In production the API is served from the same origin via the /api/* rewrite in vercel.json.
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "" : "http://localhost:3001");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type MeResponse = {
  id: string;
  email: string | null;
  fullName: string | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
};

export type EntitlementResponse = {
  active: boolean;
  status: string;
  accessUntil: string | null;
};

export type EmployeePayload = {
  name: string;
  role: string;
  description?: string | null;
  purpose?: string | null;
  instructions?: string | null;
  kind: "email" | "meeting" | "content" | "workflow" | "analyst" | "custom";
  icon?: "mail" | "message" | "send" | "workflow" | "bot";
  status?: "active" | "paused";
  capabilities?: string[];
  extra?: Record<string, string>;
  workflowIds?: string[];
};

export type EmployeeRecord = EmployeePayload & {
  id: string;
  icon: "mail" | "message" | "send" | "workflow" | "bot";
  status: "active" | "paused";
  capabilities: string[];
  extra: Record<string, string>;
  workflowIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type GoogleStatus = {
  connected: boolean;
  status: "disconnected" | "connected" | "error";
  email: string | null;
  capabilities: string[];
};

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  snippet: string | null;
};

export type CalendarEventSummary = {
  id: string;
  title: string | null;
  start: string | null;
  end: string | null;
  location: string | null;
  organizer: string | null;
  attendees: string[];
  description: string | null;
};

export type WorkflowStepPayload = {
  id: string;
  type: "run_employee" | "run_prompt" | "gmail.read_recent" | "calendar.read_today";
  employeeId?: string | null;
  params?: Record<string, string | number | boolean | null>;
};

export type WorkflowPayload = {
  title: string;
  description?: string | null;
  trigger?: "manual";
  steps: WorkflowStepPayload[];
  employeeId?: string | null;
  status?: "active" | "inactive";
};

export type WorkflowRecord = {
  id: string;
  title: string;
  description: string | null;
  trigger: "manual";
  steps: WorkflowStepPayload[];
  employeeId: string | null;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "API request failed";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  me() {
    return apiRequest<MeResponse>("/api/me");
  },

  entitlement() {
    return apiRequest<EntitlementResponse>("/api/entitlement");
  },

  listEmployees() {
    return apiRequest<EmployeeRecord[]>("/api/employees");
  },

  getEmployee(id: string) {
    return apiRequest<EmployeeRecord>(`/api/employees/${id}`);
  },

  createEmployee(body: EmployeePayload) {
    return apiRequest<EmployeeRecord>("/api/employees", {
      method: "POST",
      body,
    });
  },

  updateEmployee(id: string, body: Partial<EmployeePayload>) {
    return apiRequest<EmployeeRecord>(`/api/employees/${id}`, {
      method: "PATCH",
      body,
    });
  },

  duplicateEmployee(id: string, name: string) {
    return apiRequest<EmployeeRecord>(`/api/employees/${id}/duplicate`, {
      method: "POST",
      body: { name },
    });
  },

  deleteEmployee(id: string) {
    return apiRequest<unknown>(`/api/employees/${id}`, { method: "DELETE" });
  },

  googleStatus() {
    return apiRequest<GoogleStatus>("/api/integrations/google/status");
  },

  googleConnect() {
    return apiRequest<{ url: string }>("/api/integrations/google/connect");
  },

  googleDisconnect() {
    return apiRequest<GoogleStatus>("/api/integrations/google/disconnect", {
      method: "POST",
      body: {},
    });
  },

  gmailMessages(limit = 10) {
    return apiRequest<GmailMessageSummary[]>(
      `/api/integrations/google/gmail/messages?limit=${limit}`,
    );
  },

  calendarEvents(range: "today" | "next7" = "next7") {
    return apiRequest<CalendarEventSummary[]>(
      `/api/integrations/google/calendar/events?range=${range}`,
    );
  },

  listWorkflows() {
    return apiRequest<WorkflowRecord[]>("/api/workflows");
  },

  getWorkflow(id: string) {
    return apiRequest<WorkflowRecord>(`/api/workflows/${id}`);
  },

  createWorkflow(body: WorkflowPayload) {
    return apiRequest<WorkflowRecord>("/api/workflows", {
      method: "POST",
      body,
    });
  },

  updateWorkflow(id: string, body: Partial<WorkflowPayload>) {
    return apiRequest<WorkflowRecord>(`/api/workflows/${id}`, {
      method: "PATCH",
      body,
    });
  },

  duplicateWorkflow(id: string, title: string) {
    return apiRequest<WorkflowRecord>(`/api/workflows/${id}/duplicate`, {
      method: "POST",
      body: { title },
    });
  },

  deleteWorkflow(id: string) {
    return apiRequest<unknown>(`/api/workflows/${id}`, { method: "DELETE" });
  },
};

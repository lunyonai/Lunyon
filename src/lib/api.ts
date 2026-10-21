import { supabase } from "./supabase";

function resolveApiUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://localhost:3001";
  return "";
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
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
  needsReauth: boolean;
  canWrite: boolean;
};

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary: boolean;
  selected: boolean;
  enabled: boolean;
  backgroundColor: string | null;
  timeZone: string | null;
  accessRole: string | null;
  writable: boolean;
};

export type GmailStatus = {
  connected: boolean;
  status: "disconnected" | "connected" | "error";
  email: string | null;
  canRead: boolean;
  canSend: boolean;
  capabilities: string[];
};

export type GmailFolder = "inbox" | "sent" | "all";

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  internalDate?: string | null;
  snippet: string | null;
  unread: boolean;
  labelIds: string[];
};

export type GmailMessageDetail = GmailMessageSummary & {
  cc: string | null;
  messageIdHeader: string | null;
  references: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
};

export type GmailSendDraft = {
  idempotencyKey: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  replyAll?: boolean;
};

export type GmailSendPreview = {
  confirmationToken: string;
  expiresInSeconds: number;
  action: "send" | "reply";
  summary: {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    text: string;
    threadId: string | null;
  };
};

export type GmailSendResult = {
  ok: boolean;
  action?: "send" | "reply";
  gmailMessageId?: string | null;
  threadId?: string | null;
  replayed?: boolean;
};

export type GmailListPage = {
  folder: GmailFolder;
  messages: GmailMessageSummary[];
  nextPageToken: string | null;
  resultSizeEstimate: number | null;
};

export type GmailThreadDetail = {
  id: string;
  messages: GmailMessageDetail[];
};

export type CalendarEventSummary = {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  timezone: string;
  description: string | null;
  location: string | null;
  meetingUrl: string | null;
  calendarSource: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string | null;
  googleEventId: string;
  recurringEventId: string | null;
  htmlLink: string | null;
  etag: string | null;
  attendees: string[];
  canModify: boolean;
};

export type CalendarWriteAction = "create" | "update" | "delete";

export type CalendarWriteDraft = {
  action: CalendarWriteAction;
  calendarId: string;
  googleEventId?: string;
  recurrence?: "this" | "series";
  sendUpdates?: "all" | "externalOnly" | "none";
  idempotencyKey: string;
  etag?: string;
  event?: {
    title: string;
    description?: string | null;
    start: string;
    end: string;
    timezone: string;
    isAllDay: boolean;
    location?: string | null;
    attendees?: string[];
    addMeet?: boolean;
  };
};

export type CalendarWritePreview = {
  confirmationToken: string;
  expiresInSeconds: number;
  action: CalendarWriteAction;
  summary: {
    calendarName?: string;
    title?: string;
    start?: string;
    end?: string;
    attendees?: string[];
    recurring?: boolean;
    sendUpdates?: string;
    conflicts?: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      calendarName: string;
    }>;
    htmlLink?: string | null;
    guestsNotified?: boolean;
    addMeet?: boolean;
  };
};

export type CalendarWriteResult = {
  ok: boolean;
  action?: CalendarWriteAction;
  htmlLink?: string | null;
  googleEventId?: string | null;
  replayed?: boolean;
};

export type WorkflowStepPayload = {
  id: string;
  type: "run_employee" | "run_prompt" | "gmail.read_recent" | "calendar.read_today";
  employeeId?: string | null;
  params?: Record<string, string | number | boolean | null>;
};

export type AiLocale = "en" | "pt" | "es";

export type WorkflowSchedule = {
  frequency: "daily" | "weekdays" | "weekly";
  time: string;
  weekday?: number;
  timezone: string;
  locale: AiLocale;
};

export type WorkflowPayload = {
  title: string;
  description?: string | null;
  trigger?: "manual" | "schedule";
  schedule?: WorkflowSchedule | null;
  steps: WorkflowStepPayload[];
  employeeId?: string | null;
  status?: "active" | "inactive";
};

export type WorkflowRecord = {
  id: string;
  title: string;
  description: string | null;
  trigger: "manual" | "schedule";
  schedule: WorkflowSchedule | null;
  steps: WorkflowStepPayload[];
  employeeId: string | null;
  status: "active" | "inactive";
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: "succeeded" | "failed" | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowRunStep = {
  id: string;
  type: WorkflowStepPayload["type"];
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  count?: number;
  output?: string;
  error?: string;
  errorCode?: string;
  durationMs?: number;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  trigger: "manual" | "schedule";
  status: "running" | "succeeded" | "failed";
  steps: WorkflowRunStep[];
  output: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type ActivityRecord = {
  id: string;
  type: "prompt" | "employee" | "workflow";
  refId: string | null;
  subject: string;
  detail: string | null;
  status: "succeeded" | "failed";
  durationMs: number | null;
  createdAt: string;
};

export type ActivityStats = {
  totals: Record<ActivityRecord["type"], number>;
  today: number;
  week: number;
  workflowRunsWeek: number;
  workflowFailuresWeek: number;
  avgDurationMs: number | null;
  byRef: Record<string, number>;
};

export type RunResult = {
  output: string;
  durationMs: number;
  activity: ActivityRecord | null;
};

export type AgentProvider = "openai" | "gemini";

export type AgentStatus = {
  ownKey: { provider: AgentProvider; hint: string; updatedAt: string } | null;
  freeAvailable: boolean;
  freeDailyLimit: number;
  /** Effective daily limit: own key, paid plan or free tier. */
  dailyLimit: number;
  planActive: boolean;
  usedToday: number;
};

export type AgentAction = {
  id: string;
  kind: "calendar.create" | "calendar.update" | "calendar.delete";
  status: "pending" | "confirmed" | "canceled" | "expired" | "failed";
  summary: {
    calendarName?: string;
    title?: string;
    start?: string;
    end?: string;
    timezone?: string;
    attendees?: string[];
    addMeet?: boolean;
    conflicts?: Array<{ id: string; title: string; start: string; end: string }>;
  };
  result: { htmlLink?: string | null; error?: string } | null;
  expiresAt: string;
};

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  actions: AgentAction[];
};

export type AgentConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export type AgentSendResult = {
  conversationId: string;
  userMessage: AgentMessage;
  message: AgentMessage;
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

  if (!API_URL) {
    throw new ApiError("Lunyon API is not configured", 503, "API_UNCONFIGURED");
  }

  const url = `${API_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    if (import.meta.env.DEV) {
      console.warn("[lunyon-api]", options.method ?? "GET", path, "unreachable", API_URL);
    }
    throw new ApiError("Lunyon API is unreachable", 0, "NETWORK");
  }

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
    const payload =
      typeof data === "object" && data !== null
        ? (data as { error?: unknown; code?: unknown })
        : {};
    const message =
      typeof payload.error === "string" ? payload.error : "API request failed";
    const code = typeof payload.code === "string" ? payload.code : undefined;
    if (import.meta.env.DEV) {
      console.warn("[lunyon-api]", options.method ?? "GET", path, response.status, code ?? "NO_CODE");
    }
    throw new ApiError(message, response.status, code);
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

  googleConnect(write = false) {
    return apiRequest<{ url: string }>(
      `/api/integrations/google/connect${write ? "?write=1" : ""}`,
    );
  },

  googleDisconnect() {
    return apiRequest<GoogleStatus>("/api/integrations/google", {
      method: "DELETE",
    });
  },

  googleCalendars() {
    return apiRequest<GoogleCalendarListItem[]>("/api/integrations/google/calendars");
  },

  saveGoogleCalendars(calendarIds: string[]) {
    return apiRequest<GoogleCalendarListItem[]>("/api/integrations/google/calendars", {
      method: "PUT",
      body: { calendarIds },
    });
  },

  gmailMessages(limit = 10) {
    return apiRequest<GmailMessageSummary[]>(
      `/api/integrations/google/gmail/messages?limit=${limit}`,
    );
  },

  gmailStatus() {
    return apiRequest<GmailStatus>("/api/integrations/gmail/status");
  },

  gmailConnect(send = false) {
    return apiRequest<{ url: string }>(
      `/api/integrations/gmail/connect${send ? "?send=1" : ""}`,
    );
  },

  gmailDisconnect() {
    return apiRequest<GmailStatus>("/api/integrations/gmail", { method: "DELETE" });
  },

  gmailInbox(
    options: { limit?: number; pageToken?: string; q?: string; folder?: GmailFolder } = {},
  ) {
    const params = new URLSearchParams();
    params.set("limit", String(options.limit ?? 20));
    params.set("folder", options.folder ?? "inbox");
    if (options.pageToken) params.set("pageToken", options.pageToken);
    if (options.q) params.set("q", options.q);
    return apiRequest<GmailListPage>(`/api/integrations/gmail/messages?${params.toString()}`);
  },

  gmailSearch(
    q: string,
    options: { limit?: number; pageToken?: string; folder?: GmailFolder } = {},
  ) {
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("limit", String(options.limit ?? 20));
    params.set("folder", options.folder ?? "inbox");
    if (options.pageToken) params.set("pageToken", options.pageToken);
    return apiRequest<GmailListPage>(`/api/integrations/gmail/search?${params.toString()}`);
  },

  gmailMessage(id: string) {
    return apiRequest<GmailMessageDetail>(
      `/api/integrations/gmail/messages/${encodeURIComponent(id)}`,
    );
  },

  gmailThread(id: string) {
    return apiRequest<GmailThreadDetail>(
      `/api/integrations/gmail/threads/${encodeURIComponent(id)}`,
    );
  },

  previewGmailSend(body: GmailSendDraft) {
    return apiRequest<GmailSendPreview>("/api/integrations/gmail/messages/preview", {
      method: "POST",
      body,
    });
  },

  commitGmailSend(confirmationToken: string) {
    return apiRequest<GmailSendResult>("/api/integrations/gmail/messages", {
      method: "POST",
      body: { confirmationToken },
    });
  },

  previewGmailReply(messageId: string, body: GmailSendDraft) {
    return apiRequest<GmailSendPreview>(
      `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/reply/preview`,
      { method: "POST", body },
    );
  },

  commitGmailReply(messageId: string, confirmationToken: string) {
    return apiRequest<GmailSendResult>(
      `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/reply`,
      { method: "POST", body: { confirmationToken } },
    );
  },

  calendarEvents(range: "today" | "next7" = "next7") {
    return apiRequest<CalendarEventSummary[]>(
      `/api/integrations/google/calendar/events?range=${range}`,
    );
  },

  calendarToday() {
    return apiRequest<CalendarEventSummary[]>(
      "/api/integrations/google/calendar/today",
    );
  },

  calendarUpcoming(days = 7) {
    return apiRequest<CalendarEventSummary[]>(
      `/api/integrations/google/calendar/upcoming?days=${days}`,
    );
  },

  previewCalendarEvent(body: CalendarWriteDraft) {
    return apiRequest<CalendarWritePreview>(
      "/api/integrations/google/calendar/events/preview",
      { method: "POST", body },
    );
  },

  commitCalendarCreate(confirmationToken: string) {
    return apiRequest<CalendarWriteResult>("/api/integrations/google/calendar/events", {
      method: "POST",
      body: { confirmationToken },
    });
  },

  commitCalendarUpdate(eventId: string, confirmationToken: string) {
    return apiRequest<CalendarWriteResult>(
      `/api/integrations/google/calendar/events/${encodeURIComponent(eventId)}`,
      { method: "PATCH", body: { confirmationToken } },
    );
  },

  commitCalendarDelete(eventId: string, confirmationToken: string) {
    return apiRequest<CalendarWriteResult>(
      `/api/integrations/google/calendar/events/${encodeURIComponent(eventId)}?confirmationToken=${encodeURIComponent(confirmationToken)}`,
      { method: "DELETE" },
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

  runWorkflow(id: string, locale: AiLocale) {
    return apiRequest<WorkflowRun>(`/api/workflows/${id}/run`, {
      method: "POST",
      body: { locale },
    });
  },

  workflowRuns(id: string, limit = 10) {
    return apiRequest<WorkflowRun[]>(`/api/workflows/${id}/runs?limit=${limit}`);
  },

  workflowRun(id: string, runId: string) {
    return apiRequest<WorkflowRun>(`/api/workflows/${id}/runs/${runId}`);
  },

  runPrompt(promptId: string, input: string, locale: AiLocale) {
    return apiRequest<RunResult>(`/api/ai/prompts/${encodeURIComponent(promptId)}/run`, {
      method: "POST",
      body: { input, locale },
    });
  },

  runEmployee(id: string, task: string, locale: AiLocale) {
    return apiRequest<RunResult>(`/api/employees/${id}/run`, {
      method: "POST",
      body: { task, locale },
    });
  },

  activity(options: { limit?: number; type?: ActivityRecord["type"]; ref?: string } = {}) {
    const params = new URLSearchParams({ limit: String(options.limit ?? 20) });
    if (options.type) params.set("type", options.type);
    if (options.ref) params.set("ref", options.ref);
    return apiRequest<ActivityRecord[]>(`/api/activity?${params.toString()}`);
  },

  activityStats(timezone: string) {
    return apiRequest<ActivityStats>(`/api/activity/stats?tz=${encodeURIComponent(timezone)}`);
  },

  stripeCheckout() {
    return apiRequest<{ url: string | null; sessionId: string }>("/api/payments/stripe/checkout", {
      method: "POST",
      body: {},
    });
  },

  exportAccount() {
    return apiRequest<unknown>("/api/account/export");
  },

  deleteAccount(confirmEmail: string) {
    return apiRequest<unknown>("/api/account", { method: "DELETE", body: { confirmEmail } });
  },

  agentStatus() {
    return apiRequest<AgentStatus>("/api/agent/status");
  },

  saveAgentKey(provider: AgentProvider, apiKey: string) {
    return apiRequest<AgentStatus>("/api/agent/key", {
      method: "PUT",
      body: { provider, apiKey },
    });
  },

  deleteAgentKey() {
    return apiRequest<AgentStatus>("/api/agent/key", { method: "DELETE" });
  },

  listAgentConversations() {
    return apiRequest<AgentConversation[]>("/api/agent/conversations");
  },

  agentMessages(conversationId: string) {
    return apiRequest<AgentMessage[]>(`/api/agent/conversations/${conversationId}/messages`);
  },

  deleteAgentConversation(conversationId: string) {
    return apiRequest<unknown>(`/api/agent/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },

  sendAgentMessage(body: {
    conversationId?: string;
    message: string;
    timezone: string;
    locale: "en" | "pt" | "es";
  }) {
    return apiRequest<AgentSendResult>("/api/agent/messages", { method: "POST", body });
  },

  confirmAgentAction(actionId: string) {
    return apiRequest<AgentAction>(`/api/agent/actions/${actionId}/confirm`, { method: "POST" });
  },

  cancelAgentAction(actionId: string) {
    return apiRequest<AgentAction>(`/api/agent/actions/${actionId}/cancel`, { method: "POST" });
  },
};

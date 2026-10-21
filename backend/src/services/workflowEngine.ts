import { env } from "../config/env.js";
import { computeNextRun } from "../lib/schedule.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { recentEmailsContext, todayEventsContext } from "./ai/context.js";
import {
  buildUserMessage,
  employeeSystem,
  isPromptTemplateId,
  promptSystem,
  type AiLocale,
} from "./ai/prompts.js";
import { recordActivity } from "./activityService.js";
import { getEmployee } from "./employeeService.js";
import { generateWithQuota } from "./runService.js";
import {
  getWorkflowRow,
  toPublicWorkflow,
  type WorkflowPublic,
  type WorkflowRow,
  type WorkflowStep,
} from "./workflowService.js";

export type RunTrigger = "manual" | "schedule";
export type StepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

export type RunStepResult = {
  id: string;
  type: WorkflowStep["type"];
  status: StepStatus;
  /** Items read by Gmail / Calendar steps. Their content is never stored. */
  count?: number;
  output?: string;
  error?: string;
  errorCode?: string;
  durationMs?: number;
};

export type WorkflowRunPublic = {
  id: string;
  workflowId: string;
  trigger: RunTrigger;
  status: "running" | "succeeded" | "failed";
  steps: RunStepResult[];
  output: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type RunRow = {
  id: string;
  workflow_id: string;
  trigger: RunTrigger;
  status: WorkflowRunPublic["status"];
  steps: unknown;
  output: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

const OUTPUT_MAX = 8000;
const STALE_RUN_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Retention: assistant conversations, run history and activity are purged after these days. */
const RETENTION_DAYS = { conversations: 180, runs: 90, activity: 365 } as const;

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Workflow runs are not available yet", 503, "WORKFLOWS_NOT_READY");
  }
  throw new AppError("Could not complete this request", 400);
}

function toPublicRun(row: RunRow): WorkflowRunPublic {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    trigger: row.trigger,
    status: row.status,
    steps: Array.isArray(row.steps) ? (row.steps as RunStepResult[]) : [],
    output: row.output,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function param(step: WorkflowStep, key: string) {
  const value = step.params?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberParam(step: WorkflowStep, key: string, fallback: number) {
  const value = Number(step.params?.[key]);
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

type RunContext = {
  userId: string;
  workflow: WorkflowPublic;
  locale: AiLocale;
  blocks: string[];
};

async function executeStep(ctx: RunContext, step: WorkflowStep): Promise<Partial<RunStepResult>> {
  switch (step.type) {
    case "gmail.read_recent": {
      const block = await recentEmailsContext(ctx.userId, {
        limit: numberParam(step, "limit", 5),
        query: param(step, "query"),
      });
      ctx.blocks.push(block.text);
      return { count: block.count };
    }
    case "calendar.read_today": {
      const block = await todayEventsContext(ctx.userId);
      ctx.blocks.push(block.text);
      return { count: block.count };
    }
    case "run_prompt": {
      const promptId = param(step, "promptId") ?? "";
      if (!isPromptTemplateId(promptId)) {
        throw new AppError("Choose a prompt for this step", 400, "STEP_INVALID");
      }
      const input = param(step, "input");
      if (!input && ctx.blocks.length === 0) {
        throw new AppError("This step needs input text", 400, "STEP_INVALID");
      }
      const output = await generateWithQuota(
        ctx.userId,
        promptSystem(promptId, ctx.locale),
        buildUserMessage(input ?? "Use the context below.", ctx.blocks),
      );
      ctx.blocks.push(`Result of the previous step:\n${output}`);
      return { output: output.slice(0, OUTPUT_MAX) };
    }
    case "run_employee": {
      const employeeId = step.employeeId ?? ctx.workflow.employeeId;
      if (!employeeId) {
        throw new AppError("Choose an AI employee for this step", 400, "STEP_INVALID");
      }
      const employee = await getEmployee(ctx.userId, employeeId);
      if (employee.status !== "active") {
        throw new AppError("This AI employee is paused", 409, "EMPLOYEE_PAUSED");
      }
      const task =
        param(step, "task") ?? ctx.workflow.description?.trim() ?? ctx.workflow.title;
      const output = await generateWithQuota(
        ctx.userId,
        employeeSystem(employee, ctx.locale),
        buildUserMessage(task, ctx.blocks),
      );
      ctx.blocks.push(`Result of the previous step (${employee.name}):\n${output}`);
      return { output: output.slice(0, OUTPUT_MAX) };
    }
    default:
      throw new AppError("Unknown step", 400, "STEP_INVALID");
  }
}

async function saveProgress(runId: string, steps: RunStepResult[]) {
  await supabaseAdmin.from("workflow_runs").update({ steps }).eq("id", runId);
}

async function executeRun(
  userId: string,
  workflow: WorkflowPublic,
  runId: string,
  locale: AiLocale,
) {
  const started = Date.now();
  const ctx: RunContext = { userId, workflow, locale, blocks: [] };
  const steps: RunStepResult[] = workflow.steps.map((step) => ({
    id: step.id,
    type: step.type,
    status: "pending",
  }));
  let failure: { message: string; code?: string } | null = null;
  let output: string | null = null;

  for (const [index, step] of workflow.steps.entries()) {
    if (failure) {
      steps[index].status = "skipped";
      continue;
    }
    steps[index].status = "running";
    await saveProgress(runId, steps);
    const stepStarted = Date.now();
    try {
      const result = await executeStep(ctx, step);
      steps[index] = { ...steps[index], ...result, status: "succeeded" };
      if (result.output) output = result.output;
    } catch (err) {
      if (!(err instanceof AppError)) console.error("[lunyon-api] workflow step failed:", err);
      failure =
        err instanceof AppError
          ? { message: err.message, code: err.code }
          : { message: "This step failed" };
      steps[index] = {
        ...steps[index],
        status: "failed",
        error: failure.message,
        errorCode: failure.code,
      };
    }
    steps[index].durationMs = Date.now() - stepStarted;
  }

  const status = failure ? "failed" : "succeeded";
  const finishedAt = new Date().toISOString();
  await supabaseAdmin
    .from("workflow_runs")
    .update({ status, steps, output, error: failure?.message ?? null, finished_at: finishedAt })
    .eq("id", runId);
  await supabaseAdmin
    .from("workflows")
    .update({ last_run_at: finishedAt, last_run_status: status })
    .eq("id", workflow.id)
    .eq("user_id", userId);
  await recordActivity(userId, {
    type: "workflow",
    refId: workflow.id,
    subject: workflow.title,
    detail: failure?.message ?? null,
    status,
    durationMs: Date.now() - started,
  });
}

export async function startWorkflowRun(
  userId: string,
  workflowId: string,
  options: { trigger: RunTrigger; locale: AiLocale },
) {
  const workflow = toPublicWorkflow(await getWorkflowRow(userId, workflowId));
  if (workflow.steps.length === 0) {
    throw new AppError("Add at least one step before running", 400, "STEP_INVALID");
  }

  // A run left "running" by a restarted process must not block new runs.
  const stale = await supabaseAdmin
    .from("workflow_runs")
    .update({ status: "failed", error: "The run timed out", finished_at: new Date().toISOString() })
    .eq("workflow_id", workflowId)
    .eq("status", "running")
    .lt("started_at", new Date(Date.now() - STALE_RUN_MS).toISOString());
  if (stale.error) dbError(stale.error);

  const steps: RunStepResult[] = workflow.steps.map((step) => ({
    id: step.id,
    type: step.type,
    status: "pending",
  }));
  const { data, error } = await supabaseAdmin
    .from("workflow_runs")
    .insert({ workflow_id: workflowId, user_id: userId, trigger: options.trigger, steps })
    .select("*")
    .single();
  if (error?.code === "23505") {
    throw new AppError("This workflow is already running", 409, "WORKFLOW_RUNNING");
  }
  if (error) dbError(error);
  const run = data as RunRow;

  // Runs in the background; the client polls the run until it finishes.
  void executeRun(userId, workflow, run.id, options.locale).catch(async (err) => {
    console.error("[lunyon-api] workflow run crashed:", err);
    await supabaseAdmin
      .from("workflow_runs")
      .update({ status: "failed", error: "The run stopped unexpectedly", finished_at: new Date().toISOString() })
      .eq("id", run.id);
  });

  return toPublicRun(run);
}

export async function listWorkflowRuns(userId: string, workflowId: string, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from("workflow_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("workflow_id", workflowId)
    .order("started_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) dbError(error);
  return ((data ?? []) as RunRow[]).map(toPublicRun);
}

export async function getWorkflowRun(userId: string, workflowId: string, runId: string) {
  const { data, error } = await supabaseAdmin
    .from("workflow_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("workflow_id", workflowId)
    .eq("id", runId)
    .maybeSingle();
  if (error) dbError(error);
  if (!data) throw new AppError("Run not found", 404);
  return toPublicRun(data as RunRow);
}

// ---------------------------------------------------------------------------
// Scheduler and maintenance (in-process, every minute)
// ---------------------------------------------------------------------------

const lastLogged = new Map<string, number>();

/** Logs a recurring problem at most once per hour (e.g. migration not applied yet). */
function logThrottled(key: string, message: string) {
  const now = Date.now();
  if ((lastLogged.get(key) ?? 0) > now - 60 * 60 * 1000) return;
  lastLogged.set(key, now);
  console.error(`[lunyon-api] ${message}`);
}

export async function runDueWorkflows(now = new Date()) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("status", "active")
    .eq("trigger", "schedule")
    .lte("next_run_at", now.toISOString())
    .limit(20);
  if (error) {
    logThrottled("due", `scheduler unavailable: ${error.message}`);
    return;
  }

  for (const row of (data ?? []) as WorkflowRow[]) {
    const workflow = toPublicWorkflow(row);
    if (!workflow.schedule || !row.next_run_at) continue;

    // Claim the slot by moving next_run_at; only one instance wins the compare-and-set.
    const next = computeNextRun(workflow.schedule, now).toISOString();
    const claimed = await supabaseAdmin
      .from("workflows")
      .update({ next_run_at: next })
      .eq("id", row.id)
      .eq("next_run_at", row.next_run_at)
      .select("id");
    if (claimed.error || (claimed.data ?? []).length === 0) continue;

    try {
      await startWorkflowRun(row.user_id, row.id, {
        trigger: "schedule",
        locale: workflow.schedule.locale,
      });
    } catch (err) {
      const message = err instanceof AppError ? err.message : "Scheduled run could not start";
      await recordActivity(row.user_id, {
        type: "workflow",
        refId: row.id,
        subject: row.title,
        detail: message,
        status: "failed",
      });
    }
  }
}

export async function runMaintenance(now = new Date()) {
  const iso = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const tasks = [
    supabaseAdmin
      .from("workflow_runs")
      .update({ status: "failed", error: "The run timed out", finished_at: now.toISOString() })
      .eq("status", "running")
      .lt("started_at", iso(STALE_RUN_MS)),
    supabaseAdmin
      .from("agent_actions")
      .update({ status: "expired", confirmation_token_enc: null, updated_at: now.toISOString() })
      .eq("status", "pending")
      .lt("expires_at", now.toISOString()),
    supabaseAdmin
      .from("agent_conversations")
      .delete()
      .lt("updated_at", iso(RETENTION_DAYS.conversations * DAY_MS)),
    supabaseAdmin.from("workflow_runs").delete().lt("started_at", iso(RETENTION_DAYS.runs * DAY_MS)),
    supabaseAdmin
      .from("activity_events")
      .delete()
      .lt("created_at", iso(RETENTION_DAYS.activity * DAY_MS)),
  ];
  const results = await Promise.all(tasks);
  results.forEach((result, index) => {
    if (result.error) logThrottled(`maintenance-${index}`, `maintenance task ${index} failed: ${result.error.message}`);
  });
}

export function startWorkflowScheduler() {
  if (!env.WORKFLOW_SCHEDULER_ENABLED) return;
  let busy = false;
  let lastMaintenance = 0;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await runDueWorkflows();
      if (Date.now() - lastMaintenance > 60 * 60 * 1000) {
        lastMaintenance = Date.now();
        await runMaintenance();
      }
    } catch (err) {
      logThrottled("tick", `scheduler tick failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      busy = false;
    }
  };

  setTimeout(() => void tick(), 10_000).unref();
  setInterval(() => void tick(), 60_000).unref();
}

import { AppError } from "../middleware/errorHandler.js";
import { generateText } from "./agent/models.js";
import { reserveAiUsage } from "./ai/access.js";
import { recentEmailsContext, todayEventsContext } from "./ai/context.js";
import {
  buildUserMessage,
  employeeSystem,
  promptSystem,
  type AiLocale,
  type PromptTemplateId,
} from "./ai/prompts.js";
import { recordActivity, type ActivityPublic } from "./activityService.js";
import { getEmployee, type EmployeePublic } from "./employeeService.js";

export type RunResult = {
  output: string;
  durationMs: number;
  activity: ActivityPublic | null;
};

/** Generates text with one unit of the user's quota; the unit is returned if the call fails. */
export async function generateWithQuota(userId: string, system: string, message: string) {
  const usage = await reserveAiUsage(userId);
  try {
    const output = await generateText(usage.config, system, message);
    if (!output) throw new AppError("The AI returned an empty answer", 502, "AI_EMPTY");
    return output;
  } catch (err) {
    await usage.release();
    throw err;
  }
}

export async function runPromptTemplate(
  userId: string,
  input: { promptId: PromptTemplateId; input: string; locale: AiLocale },
): Promise<RunResult> {
  const started = Date.now();
  const output = await generateWithQuota(
    userId,
    promptSystem(input.promptId, input.locale),
    buildUserMessage(input.input),
  );
  const durationMs = Date.now() - started;
  const activity = await recordActivity(userId, {
    type: "prompt",
    refId: input.promptId,
    subject: input.promptId,
    detail: input.input,
    durationMs,
  });
  return { output, durationMs, activity };
}

/**
 * Optional read-only context for employees with the gmail.read / calendar.read capabilities.
 * A missing Google connection is reported to the model instead of failing the task.
 */
async function employeeContext(userId: string, employee: EmployeePublic) {
  const blocks: string[] = [];
  if (employee.capabilities.includes("calendar.read")) {
    try {
      blocks.push((await todayEventsContext(userId)).text);
    } catch {
      blocks.push("Calendar is not available (Google Calendar is not connected).");
    }
  }
  if (employee.capabilities.includes("gmail.read")) {
    try {
      blocks.push((await recentEmailsContext(userId, { limit: 5 })).text);
    } catch {
      blocks.push("Email is not available (Gmail is not connected).");
    }
  }
  return blocks;
}

export async function runEmployeeTask(
  userId: string,
  input: { employeeId: string; task: string; locale: AiLocale; context?: string[] },
): Promise<RunResult & { employee: EmployeePublic }> {
  const employee = await getEmployee(userId, input.employeeId);
  if (employee.status !== "active") {
    throw new AppError("This AI employee is paused", 409, "EMPLOYEE_PAUSED");
  }

  const started = Date.now();
  const context = [...(input.context ?? []), ...(await employeeContext(userId, employee))];
  const output = await generateWithQuota(
    userId,
    employeeSystem(employee, input.locale),
    buildUserMessage(input.task, context),
  );
  const durationMs = Date.now() - started;
  const activity = await recordActivity(userId, {
    type: "employee",
    refId: employee.id,
    subject: employee.name,
    detail: input.task,
    durationMs,
  });
  return { output, durationMs, activity, employee };
}

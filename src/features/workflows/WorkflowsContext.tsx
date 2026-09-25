import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { normalizeWorkflow, type Workflow, type WorkflowStatus } from "./workflowTypes";

type WorkflowDraft = Omit<Workflow, "id">;

type WorkflowsContextValue = {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;
  persistence: "api";
  refresh: () => Promise<void>;
  addWorkflow: (draft: WorkflowDraft) => Promise<Workflow>;
  updateWorkflow: (id: string, patch: Partial<Workflow>) => Promise<Workflow>;
  duplicateWorkflow: (id: string, title: string) => Promise<Workflow>;
  setStatus: (id: string, status: WorkflowStatus) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
};

const WorkflowsContext = createContext<WorkflowsContextValue | null>(null);

function toPayload(patch: Partial<Workflow>) {
  return {
    title: patch.title ?? undefined,
    description: patch.description,
    trigger: "manual" as const,
    steps: patch.steps,
    employeeId: patch.employeeId,
    status: patch.status,
  };
}

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setWorkflows([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.listWorkflows();
      setWorkflows(rows.map(normalizeWorkflow));
      setError(null);
    } catch (err) {
      setWorkflows([]);
      setError(err instanceof ApiError ? err.message : "load");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addWorkflow = useCallback(async (draft: WorkflowDraft) => {
    const created = normalizeWorkflow(
      await api.createWorkflow({
        title: draft.title?.trim() || "Untitled automation",
        description: draft.description,
        trigger: "manual",
        steps: draft.steps,
        employeeId: draft.employeeId,
        status: draft.status,
      }),
    );
    setWorkflows((current) => [...current, created]);
    return created;
  }, []);

  const updateWorkflow = useCallback(async (id: string, patch: Partial<Workflow>) => {
    const updated = normalizeWorkflow(await api.updateWorkflow(id, toPayload(patch)));
    setWorkflows((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const duplicateWorkflow = useCallback(async (id: string, title: string) => {
    const created = normalizeWorkflow(await api.duplicateWorkflow(id, title));
    setWorkflows((current) => [...current, created]);
    return created;
  }, []);

  const setStatus = useCallback(
    async (id: string, status: WorkflowStatus) => {
      await updateWorkflow(id, { status });
    },
    [updateWorkflow],
  );

  const deleteWorkflow = useCallback(async (id: string) => {
    await api.deleteWorkflow(id);
    setWorkflows((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      workflows,
      loading,
      error,
      persistence: "api" as const,
      refresh,
      addWorkflow,
      updateWorkflow,
      duplicateWorkflow,
      setStatus,
      deleteWorkflow,
    }),
    [
      addWorkflow,
      deleteWorkflow,
      duplicateWorkflow,
      error,
      loading,
      refresh,
      setStatus,
      updateWorkflow,
      workflows,
    ],
  );

  return (
    <WorkflowsContext.Provider value={value}>{children}</WorkflowsContext.Provider>
  );
}

export function useWorkflows() {
  const context = useContext(WorkflowsContext);
  if (!context) {
    throw new Error("useWorkflows must be used within WorkflowsProvider");
  }
  return context;
}

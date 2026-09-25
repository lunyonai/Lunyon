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
import {
  normalizeEmployee,
  type CapabilityId,
  type Employee,
  type EmployeeStatus,
} from "./employeeTypes";

type EmployeeDraft = Omit<Employee, "id" | "workflowIds"> & {
  workflowIds?: string[];
};

type EmployeesContextValue = {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  persistence: "api";
  refresh: () => Promise<void>;
  addEmployee: (draft: EmployeeDraft) => Promise<Employee>;
  updateEmployee: (id: string, patch: Partial<Employee>) => Promise<Employee>;
  duplicateEmployee: (
    id: string,
    displayName: string,
    copySuffix: string,
  ) => Promise<Employee | null>;
  setStatus: (id: string, status: EmployeeStatus) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  toggleCapability: (id: string, capability: CapabilityId) => Promise<void>;
};

const EmployeesContext = createContext<EmployeesContextValue | null>(null);

function toPayload(employee: Partial<Employee>) {
  return {
    name: employee.name ?? undefined,
    role: employee.role ?? undefined,
    description: employee.description,
    purpose: employee.purpose,
    instructions: employee.instructions,
    kind: employee.kind,
    icon: employee.icon,
    status: employee.status,
    capabilities: employee.capabilities,
    extra: employee.extra,
    workflowIds: employee.workflowIds,
  };
}

export function EmployeesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEmployees([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.listEmployees();
      setEmployees(rows.map(normalizeEmployee));
      setError(null);
    } catch (err) {
      setEmployees([]);
      setError(err instanceof ApiError ? err.message : "load");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEmployee = useCallback(async (draft: EmployeeDraft) => {
    const created = normalizeEmployee(
      await api.createEmployee({
        name: draft.name?.trim() || "Untitled employee",
        role: draft.role?.trim() || "Specialist",
        description: draft.description,
        purpose: draft.purpose,
        instructions: draft.instructions,
        kind: draft.kind,
        icon: draft.icon,
        status: draft.status,
        capabilities: draft.capabilities,
        extra: draft.extra,
        workflowIds: draft.workflowIds ?? [],
      }),
    );
    setEmployees((current) => [...current, created]);
    return created;
  }, []);

  const updateEmployee = useCallback(async (id: string, patch: Partial<Employee>) => {
    const updated = normalizeEmployee(await api.updateEmployee(id, toPayload(patch)));
    setEmployees((current) =>
      current.map((item) => (item.id === id ? updated : item)),
    );
    return updated;
  }, []);

  const duplicateEmployee = useCallback(
    async (id: string, displayName: string, copySuffix: string) => {
      const created = normalizeEmployee(
        await api.duplicateEmployee(id, `${displayName}${copySuffix}`),
      );
      setEmployees((current) => [...current, created]);
      return created;
    },
    [],
  );

  const setStatus = useCallback(async (id: string, status: EmployeeStatus) => {
    await updateEmployee(id, { status });
  }, [updateEmployee]);

  const deleteEmployee = useCallback(async (id: string) => {
    await api.deleteEmployee(id);
    setEmployees((current) => current.filter((item) => item.id !== id));
  }, []);

  const toggleCapability = useCallback(
    async (id: string, capability: CapabilityId) => {
      const current = employees.find((item) => item.id === id);
      if (!current) return;
      const has = current.capabilities.includes(capability);
      const capabilities = has
        ? current.capabilities.filter((value) => value !== capability)
        : [...current.capabilities, capability];
      await updateEmployee(id, { capabilities });
    },
    [employees, updateEmployee],
  );

  const value = useMemo(
    () => ({
      employees,
      loading,
      error,
      persistence: "api" as const,
      refresh,
      addEmployee,
      updateEmployee,
      duplicateEmployee,
      setStatus,
      deleteEmployee,
      toggleCapability,
    }),
    [
      addEmployee,
      deleteEmployee,
      duplicateEmployee,
      employees,
      error,
      loading,
      refresh,
      setStatus,
      toggleCapability,
      updateEmployee,
    ],
  );

  return (
    <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeesContext);
  if (!context) {
    throw new Error("useEmployees must be used within EmployeesProvider");
  }
  return context;
}

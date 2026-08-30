import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import PromptLibraryPage from "./features/prompts/PromptLibraryPage";
import WorkflowsPage from "./features/workflows/WorkflowsPage";
import EmployeesPage from "./features/employees/EmployeesPage";

export default function App() {
  return (
   <Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/employees" element={<EmployeesPage />} />
  <Route path="/prompts" element={<PromptLibraryPage />} />
  <Route path="/workflows" element={<WorkflowsPage />} />

  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
  );
}
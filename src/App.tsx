import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import PromptLibraryPage from "./features/prompts/PromptLibraryPage";
import WorkflowsPage from "./features/workflows/WorkflowsPage";
import EmployeesPage from "./features/employees/EmployeesPage";
import LandingPage from "./features/landing/LandingPage";

export default function App() {
  return (
    <Routes>
      {/* Landing page pública */}
      <Route path="/" element={<LandingPage />} />

      {/* Rotas existentes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/prompts" element={<PromptLibraryPage />} />
      <Route path="/workflows" element={<WorkflowsPage />} />

      {/* Fallback: se não encontrar, vai para landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
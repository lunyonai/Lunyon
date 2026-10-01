import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import DashboardPage from "./features/dashboard/DashboardPage";
import PromptLibraryPage from "./features/prompts/PromptLibraryPage";
import WorkflowsPage from "./features/workflows/WorkflowsPage";
import { WorkflowsProvider } from "./features/workflows/WorkflowsContext";
import EmployeesPage from "./features/employees/EmployeesPage";
import EmployeeConfigPage from "./features/employees/EmployeeConfigPage";
import { EmployeesProvider } from "./features/employees/EmployeesContext";
import { NotificationsProvider } from "./features/notifications/NotificationsContext";
import SettingsPage from "./features/settings/SettingsPage";
import LandingPage from "./features/landing/LandingPage";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { unknownPathFallback } from "./i18n/paths";

function UnknownRoute() {
  const { pathname } = useLocation();
  return <Navigate to={unknownPathFallback(pathname)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pt" element={<LandingPage />} />
      <Route path="/es" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/pt/login" element={<LoginPage />} />
      <Route path="/es/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:employeeId"
        element={
          <ProtectedRoute>
            <EmployeeConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prompts"
        element={
          <ProtectedRoute>
            <PromptLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows"
        element={
          <ProtectedRoute>
            <WorkflowsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<UnknownRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <NotificationsProvider>
        <EmployeesProvider>
          <WorkflowsProvider>
            <AppRoutes />
          </WorkflowsProvider>
        </EmployeesProvider>
      </NotificationsProvider>
    </LocaleProvider>
  );
}

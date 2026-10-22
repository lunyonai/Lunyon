import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import AuthCallbackPage from "./features/auth/AuthCallbackPage";
import OAuthReturnHandler from "./features/auth/OAuthReturnHandler";
import RecoveryPage from "./features/auth/RecoveryPage";
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
import CalendarPage from "./features/calendar/CalendarPage";
import MailPage from "./features/mail/MailPage";
import AgentPage from "./features/agent/AgentPage";
import LandingPage from "./features/landing/LandingPage";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { unknownPathFallback } from "./i18n/paths";
import { ThemeProvider } from "./theme/ThemeProvider";

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
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/forgot-password" element={<RecoveryPage />} />
      <Route path="/reset-password" element={<RecoveryPage />} />
      <Route path="/pt/forgot-password" element={<RecoveryPage />} />
      <Route path="/pt/reset-password" element={<RecoveryPage />} />
      <Route path="/es/forgot-password" element={<RecoveryPage />} />
      <Route path="/es/reset-password" element={<RecoveryPage />} />

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
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mail"
        element={
          <ProtectedRoute>
            <MailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AgentPage />
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
      <ThemeProvider>
        <OAuthReturnHandler />
        <NotificationsProvider>
          <EmployeesProvider>
            <WorkflowsProvider>
              <AppRoutes />
            </WorkflowsProvider>
          </EmployeesProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

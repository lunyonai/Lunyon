import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath } from "../../i18n/paths";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { locale } = useLocale();

  if (loading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!user) {
    return <Navigate to={loginPath(locale)} replace />;
  }

  return children;
}

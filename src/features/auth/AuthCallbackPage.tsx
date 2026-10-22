import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath, resetPasswordPath } from "../../i18n/paths";
import { clearOAuthPending, oauthErrorFromParams } from "../../lib/oauthRedirect";

export default function AuthCallbackPage() {
  const { user, loading, recovering } = useAuth();
  const { locale } = useLocale();
  const { search, hash } = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const oauthError = oauthErrorFromParams(search, hash);

  useEffect(() => {
    if (loading || user || recovering || oauthError) return;
    const timer = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [loading, user, recovering, oauthError]);

  if (oauthError) {
    clearOAuthPending();
    return <Navigate to={`${loginPath(locale)}?error=${oauthError}`} replace />;
  }

  if (loading) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (recovering) {
    clearOAuthPending();
    return <Navigate to={resetPasswordPath(locale)} replace />;
  }

  if (user) {
    clearOAuthPending();
    return <Navigate to="/dashboard" replace />;
  }

  if (timedOut) {
    clearOAuthPending();
    return <Navigate to={`${loginPath(locale)}?error=google`} replace />;
  }

  return <div className="min-h-screen bg-canvas" />;
}

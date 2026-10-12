import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath, resetPasswordPath } from "../../i18n/paths";
import {
  clearOAuthPending,
  hasOAuthPending,
  isLandingPath,
  oauthErrorFromParams,
} from "../../lib/oauthRedirect";

/**
 * Completes Google OAuth when Supabase falls back to the Site URL (landing)
 * instead of /auth/callback. Same-origin only.
 */
export default function OAuthReturnHandler() {
  const { user, loading, recovering } = useAuth();
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const oauthError = oauthErrorFromParams(location.search, location.hash);
    if (oauthError) {
      clearOAuthPending();
      if (!location.pathname.endsWith("/login")) {
        navigate(`${loginPath(locale)}?error=${oauthError}`, { replace: true });
      }
      return;
    }

    if (loading) return;

    const params = new URLSearchParams(location.search);
    const hasCode = params.has("code");
    const onLanding = isLandingPath(location.pathname);
    const pending = hasOAuthPending();
    const oauthReturn =
      pending || hasCode || location.pathname === "/auth/callback";

    if (!oauthReturn) return;

    if (recovering) {
      clearOAuthPending();
      if (!location.pathname.endsWith("/reset-password")) {
        navigate(resetPasswordPath(locale), { replace: true });
      }
      return;
    }

    if (user) {
      clearOAuthPending();
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    if (pending && onLanding) {
      const timer = window.setTimeout(() => {
        if (hasOAuthPending()) {
          clearOAuthPending();
          navigate(`${loginPath(locale)}?error=google`, { replace: true });
        }
      }, 12000);
      return () => window.clearTimeout(timer);
    }
  }, [
    user,
    loading,
    recovering,
    location.pathname,
    location.search,
    location.hash,
    locale,
    navigate,
  ]);

  return null;
}

import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import Logo from "./Logo";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import { cardClass, cx, inputClass } from "../../../components/ui/styles";
import { useAuth } from "../../../hooks/useAuth";
import { useLocale } from "../../../i18n/LocaleProvider";
import { forgotPasswordPath } from "../../../i18n/paths";
import { clearOAuthPending } from "../../../lib/oauthRedirect";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle";
const iconInputClass = cx(inputClass, "pl-9");
const linkClass =
  "rounded-sm font-medium text-primary-text underline-offset-4 transition-colors hover:underline " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/** Google "G" brand mark, kept in its official colors in both themes. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const { login, loginWithGoogle, register } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<"login" | "signup">(
    () => (searchParams.get("signup") === "1" ? "signup" : "login"),
  );
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthFlag, setOauthFlag] = useState(() => searchParams.get("error"));
  const busy = loading || googleLoading;
  const oauthMessage =
    oauthFlag === "google_cancelled"
      ? t("login.errors.googleCancelled")
      : oauthFlag === "google"
        ? t("login.errors.googleFailed")
        : "";
  const visibleError = error || oauthMessage;

  useEffect(() => {
    if (!searchParams.get("error")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("error");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  function authMessage(err: unknown) {
    if (err instanceof Error) {
      const code = "code" in err ? String((err as { code?: string }).code) : "";
      const text = err.message.toLowerCase();
      if (err.message === "NO_SESSION") return t("login.errors.noSession");
      if (
        code === "invalid_credentials" ||
        text.includes("invalid login") ||
        text.includes("invalid credentials")
      ) {
        return t("login.errors.invalid");
      }
      if (code === "email_not_confirmed" || text.includes("email not confirmed")) {
        return t("login.errors.unconfirmed");
      }
      if (text.includes("failed to fetch") || text.includes("network request")) {
        return t("login.errors.network");
      }
      if (
        code === "provider_disabled" ||
        text.includes("provider is not enabled") ||
        text.includes("unsupported provider")
      ) {
        return t("login.errors.googleUnavailable");
      }
      if (text.includes("google") || code.startsWith("oauth")) {
        return t("login.errors.googleFailed");
      }
    }
    return t("login.fallbackError");
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    setOauthFlag(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      clearOAuthPending();
      setError(authMessage(err));
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setOauthFlag(null);

    try {
      if (isSignup) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }

      navigate("/dashboard");
    } catch (err: unknown) {
      setError(authMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="w-full max-w-sm px-4 py-10 sm:px-0"
    >
      <motion.div
        variants={item}
        transition={{ duration: 0.4, ease }}
        className={cx(cardClass, "p-6 sm:p-8")}
      >
        <div className="mb-6">
          <Logo size="medium" />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            {isSignup ? t("login.createTitle") : t("login.welcome")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-fg-muted">
            {isSignup ? t("login.createBody") : t("login.welcomeBody")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <Field label={t("login.fullName")} htmlFor={nameId}>
              <div className="relative">
                <UserRound className={iconClass} aria-hidden="true" />

                <input
                  id={nameId}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("login.fullNamePlaceholder")}
                  className={iconInputClass}
                />
              </div>
            </Field>
          )}

          <Field label={t("login.email")} htmlFor={emailId}>
            <div className="relative">
              <Mail className={iconClass} aria-hidden="true" />

              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className={iconInputClass}
              />
            </div>
          </Field>

          <Field label={t("login.password")} htmlFor={passwordId}>
            <div className="relative">
              <LockKeyhole className={iconClass} aria-hidden="true" />

              <input
                id={passwordId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className={iconInputClass}
              />
            </div>
          </Field>

          {!isSignup && (
            <div className="-mt-1 flex justify-end">
              <Link to={forgotPasswordPath(locale)} className={cx(linkClass, "text-sm")}>
                {t("login.forgotPassword")}
              </Link>
            </div>
          )}

          {visibleError && <Alert tone="danger">{visibleError}</Alert>}

          <Button type="submit" variant="primary" size="lg" block disabled={busy} loading={loading}>
            {busy
              ? t("login.loading")
              : isSignup
                ? t("login.createAccount")
                : t("login.signIn")}
            {!busy && <ArrowRight aria-hidden="true" />}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-fg-subtle">{t("login.or")}</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <Button
          variant="secondary"
          size="lg"
          block
          onClick={() => void handleGoogle()}
          disabled={busy}
          loading={googleLoading}
        >
          {!googleLoading && <GoogleIcon />}
          {googleLoading ? t("login.loading") : t("login.google")}
        </Button>

        <p className="mt-6 text-center text-sm text-fg-muted">
          {isSignup ? t("login.alreadyHave") : t("login.newTo")}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            className={linkClass}
          >
            {isSignup ? t("login.signIn") : t("login.createAccount")}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

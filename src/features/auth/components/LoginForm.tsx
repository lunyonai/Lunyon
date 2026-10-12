import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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

export default function LoginForm() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();

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

  const inputClassName =
    "h-11 w-full rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)] px-10 text-sm text-[var(--lunyo-text)] outline-none transition placeholder:text-slate-600 focus:border-[var(--lunyo-primary)]/50 focus:ring-2 focus:ring-[var(--lunyo-primary)]/10";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="w-full max-w-[22rem] px-8 py-10"
    >
      <motion.div
        variants={item}
        transition={{ duration: 0.4, ease }}
        className="mb-9"
      >
        <Logo size="large" />
      </motion.div>

      <motion.div
        variants={item}
        transition={{ duration: 0.4, ease }}
        className="mb-7"
      >
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--lunyo-text)]">
          {isSignup ? t("login.createTitle") : t("login.welcome")}
        </h1>

        <p className="mt-2.5 text-sm leading-6 text-[var(--lunyo-text-muted)]">
          {isSignup ? t("login.createBody") : t("login.welcomeBody")}
        </p>
      </motion.div>

      <motion.div variants={item} transition={{ duration: 0.4, ease }}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("login.fullName")}
              </span>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("login.fullNamePlaceholder")}
                  className={inputClassName}
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("login.email")}
            </span>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className={inputClassName}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("login.password")}
            </span>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className={inputClassName}
              />
            </div>
          </label>

          {!isSignup && (
            <div className="flex justify-end">
              <Link
                to={forgotPasswordPath(locale)}
                className="inline-flex min-h-8 items-center text-sm font-medium text-[var(--lunyo-primary)] underline-offset-4 transition hover:underline hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lunyo-primary)]"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
          )}

          {visibleError && (
              <div
                role="alert"
                className="rounded-[var(--lunyo-radius)] border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {visibleError}
              </div>
            )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? t("login.loading")
              : isSignup
                ? t("login.createAccount")
                : t("login.signIn")}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--lunyo-border)]" />
          <span className="text-[11px] text-slate-600">{t("login.or")}</span>
          <div className="h-px flex-1 bg-[var(--lunyo-border)]" />
        </div>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)]/60 text-sm font-medium text-[var(--lunyo-text)] transition hover:bg-[var(--lunyo-surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? t("login.loading") : t("login.google")}
        </button>

        <p className="mt-7 text-center text-sm text-[var(--lunyo-text-muted)]">
          {isSignup ? t("login.alreadyHave") : t("login.newTo")}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            className="font-medium text-[var(--lunyo-primary)] transition hover:brightness-125"
          >
            {isSignup ? t("login.signIn") : t("login.createAccount")}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { motion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../../../hooks/useAuth";
import { useLocale } from "../../../i18n/LocaleProvider";
import { loginPath, resetPasswordPath } from "../../../i18n/paths";

const ease = [0.22, 1, 0.36, 1] as const;
const RESEND_SECONDS = 60;

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

type Step = "email" | "code" | "password" | "success";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

function authCode(err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: string }).code ?? "");
  }
  return "";
}

function authText(err: unknown) {
  if (err instanceof Error) return err.message.toLowerCase();
  return "";
}

function isUnknownAccount(err: unknown) {
  const code = authCode(err);
  const text = authText(err);
  return (
    code === "user_not_found" ||
    text.includes("user not found") ||
    text.includes("unable to find user")
  );
}

function recoveryMessage(err: unknown, t: (path: string) => string) {
  const code = authCode(err);
  const text = authText(err);
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    text.includes("rate limit")
  ) {
    return t("recovery.errors.rateLimited");
  }
  if (text.includes("failed to fetch") || text.includes("network request")) {
    return t("recovery.errors.backend");
  }
  if (
    code === "otp_expired" ||
    text.includes("otp has expired") ||
    text.includes("token has expired")
  ) {
    return t("recovery.errors.expiredCode");
  }
  if (
    code === "otp_disabled" ||
    text.includes("disable signup") ||
    text.includes("email logins are disabled")
  ) {
    return t("recovery.errors.config");
  }
  if (
    code === "invalid_token" ||
    text.includes("invalid otp") ||
    text.includes("invalid token") ||
    text.includes("token not found")
  ) {
    return t("recovery.errors.invalidCode");
  }
  if (text.includes("same password") || text.includes("should be different")) {
    return t("recovery.errors.updateFailed");
  }
  if (err instanceof Error && err.message === "NO_SESSION") {
    return t("recovery.errors.expiredToken");
  }
  return t("recovery.errors.fallback");
}

export default function RecoveryForm() {
  const { locale, t } = useLocale();
  const {
    recovering,
    resetPassword,
    verifyRecoveryOtp,
    updatePassword,
    completeRecovery,
  } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [codeVerified, setCodeVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (recovering && (step === "email" || step === "code")) {
      setCodeVerified(true);
      setStep("password");
    }
  }, [recovering, step]);

  const inputClassName =
    "h-11 w-full rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)] px-10 text-sm text-[var(--lunyo-text)] outline-none transition placeholder:text-slate-600 focus:border-[var(--lunyo-primary)]/50 focus:ring-2 focus:ring-[var(--lunyo-primary)]/10";

  async function requestReset() {
    const redirectTo = `${window.location.origin}${resetPasswordPath(locale)}`;
    try {
      await resetPassword(email, redirectTo);
    } catch (err) {
      if (isUnknownAccount(err)) return;
      throw err;
    }
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestReset();
      setNotice(t("recovery.genericSent"));
      setCooldown(RESEND_SECONDS);
      setStep("code");
    } catch (err) {
      setError(recoveryMessage(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      await requestReset();
      setNotice(t("recovery.genericSent"));
      setDigits(["", "", "", "", "", ""]);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(recoveryMessage(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError(t("recovery.errors.invalidCode"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyRecoveryOtp(email, code);
      setDigits(["", "", "", "", "", ""]);
      setCodeVerified(true);
      setStep("password");
      setNotice("");
    } catch (err) {
      setError(recoveryMessage(err, t));
      setCodeVerified(false);
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError(t("recovery.errors.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("recovery.errors.mismatch"));
      return;
    }
    if (!codeVerified && !recovering) {
      setError(t("recovery.errors.expiredToken"));
      setStep("email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updatePassword(password);
      await completeRecovery();
      setPassword("");
      setConfirm("");
      setCodeVerified(false);
      setStep("success");
    } catch (err) {
      setError(recoveryMessage(err, t));
    } finally {
      setLoading(false);
    }
  }

  function applyDigits(next: string[]) {
    setDigits(next);
    const filled = next.findIndex((digit) => digit === "");
    const focusIndex = filled === -1 ? 5 : filled;
    inputsRef.current[focusIndex]?.focus();
  }

  function onDigitChange(index: number, value: string) {
    const numeric = value.replace(/\D/g, "");
    if (!numeric) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    const chars = numeric.slice(0, 6 - index).split("");
    const next = [...digits];
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    applyDigits(next);
  }

  function onDigitKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onDigitPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    applyDigits(next);
  }

  const title =
    step === "email"
      ? t("recovery.emailTitle")
      : step === "code"
        ? t("recovery.codeTitle")
        : step === "password"
          ? t("recovery.passwordTitle")
          : t("recovery.successTitle");

  const body =
    step === "email"
      ? t("recovery.emailBody")
      : step === "code"
        ? t("recovery.codeBody", { email: maskEmail(email) })
        : step === "password"
          ? t("recovery.passwordBody")
          : t("recovery.successBody");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="w-full max-w-[22rem] px-8 py-10"
    >
      <motion.div variants={item} transition={{ duration: 0.4, ease }} className="mb-9">
        <Logo size="large" />
      </motion.div>

      <motion.div variants={item} transition={{ duration: 0.4, ease }} className="mb-7">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--lunyo-text)]">
          {title}
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-[var(--lunyo-text-muted)]">{body}</p>
      </motion.div>

      <motion.div variants={item} transition={{ duration: 0.4, ease }}>
        {step === "email" && (
          <form onSubmit={submitEmail} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("login.email")}
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className={inputClassName}
                />
              </div>
            </label>
            {error && (
              <div className="rounded-[var(--lunyo-radius)] border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("login.loading") : t("recovery.continue")}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-3.5">
            {notice && (
              <p className="text-sm leading-6 text-[var(--lunyo-text-muted)]">{notice}</p>
            )}
            <fieldset>
              <legend className="sr-only">{t("recovery.codeLabel")}</legend>
              <div className="flex justify-between gap-1.5">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      inputsRef.current[index] = node;
                    }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={t("recovery.digitLabel", { index: index + 1 })}
                    value={digit}
                    maxLength={1}
                    onChange={(event) => onDigitChange(index, event.target.value)}
                    onKeyDown={(event) => onDigitKeyDown(index, event)}
                    onPaste={onDigitPaste}
                    className="h-12 w-10 rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)] text-center text-lg text-[var(--lunyo-text)] outline-none transition focus:border-[var(--lunyo-primary)]/50 focus:ring-2 focus:ring-[var(--lunyo-primary)]/10"
                  />
                ))}
              </div>
            </fieldset>
            {error && (
              <div className="rounded-[var(--lunyo-radius)] border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("login.loading") : t("recovery.verify")}
            </button>
            <button
              type="button"
              onClick={() => void resendCode()}
              disabled={loading || cooldown > 0}
              className="flex h-11 w-full items-center justify-center rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)]/60 text-sm font-medium text-[var(--lunyo-text)] transition hover:bg-[var(--lunyo-surface)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0
                ? t("recovery.resendWait", { seconds: cooldown })
                : t("recovery.resend")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
                setNotice("");
                setCodeVerified(false);
              }}
              className="w-full text-center text-sm text-[var(--lunyo-text-muted)] transition hover:text-[var(--lunyo-text)]"
            >
              {t("recovery.back")}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("recovery.newPassword")}
              </span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={`${inputClassName} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[var(--lunyo-text)]"
                  aria-label={
                    showPassword ? t("recovery.hidePassword") : t("recovery.showPassword")
                  }
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                {t("recovery.confirmPassword")}
              </span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={`${inputClassName} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[var(--lunyo-text)]"
                  aria-label={
                    showConfirm ? t("recovery.hidePassword") : t("recovery.showPassword")
                  }
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <p className="text-xs text-[var(--lunyo-text-muted)]">
              {t("recovery.passwordHint")}
            </p>
            {error && (
              <div className="rounded-[var(--lunyo-radius)] border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("login.loading") : t("recovery.updatePassword")}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4">
            <Link
              to={loginPath(locale)}
              className="flex h-11 w-full items-center justify-center rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] text-sm font-semibold text-white transition hover:brightness-110"
            >
              {t("recovery.backToSignIn")}
            </Link>
          </div>
        )}

        {step !== "success" && (
          <p className="mt-7 text-center text-sm text-[var(--lunyo-text-muted)]">
            {t("login.alreadyHave")}{" "}
            <Link
              to={loginPath(locale)}
              className="font-medium text-[var(--lunyo-primary)] transition hover:brightness-125"
            >
              {t("login.signIn")}
            </Link>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { motion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import {
  buttonClass,
  cardClass,
  cx,
  hintClass,
  inputClass,
} from "../../../components/ui/styles";
import { useAuth } from "../../../hooks/useAuth";
import { useLocale } from "../../../i18n/LocaleProvider";
import { loginPath, resetPasswordPath, signupPath } from "../../../i18n/paths";
import {
  isValidRecoveryEmail,
  lookupRecoveryEmail,
} from "../../../services/recoveryEmailLookup";

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

const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle";
const iconInputClass = cx(inputClass, "pl-9");
const passwordInputClass = cx(inputClass, "pl-9 pr-10");
const revealButtonClass =
  "absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle " +
  "transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const digitClass =
  "h-12 w-10 rounded-lg border border-line bg-surface text-center text-lg font-medium tabular-nums text-fg shadow-card " +
  "outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15";
const linkClass =
  "rounded-sm font-medium text-primary-text underline-offset-4 transition-colors hover:underline " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

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
  const [notRegistered, setNotRegistered] = useState(false);
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

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

  async function requestReset() {
    const redirectTo = `${window.location.origin}${resetPasswordPath(locale)}`;
    await resetPassword(email, redirectTo);
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setNotRegistered(false);
    if (!isValidRecoveryEmail(email)) {
      setError(t("recovery.errors.invalidEmail"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const lookup = await lookupRecoveryEmail(email);
      if (lookup === "invalid_email") {
        setError(t("recovery.errors.invalidEmail"));
        return;
      }
      if (lookup === "rate_limited") {
        setError(t("recovery.errors.rateLimited"));
        return;
      }
      if (lookup === "unavailable") {
        setError(t("recovery.errors.backend"));
        return;
      }
      if (lookup === "unregistered") {
        setNotRegistered(true);
        setError(t("recovery.errors.notRegistered"));
        return;
      }
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
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p>
        </div>

        {step === "email" && (
          <form onSubmit={submitEmail} className="space-y-4">
            <Field label={t("login.email")} htmlFor={emailId}>
              <div className="relative">
                <Mail className={iconClass} aria-hidden="true" />
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                    if (notRegistered) setNotRegistered(false);
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-email-error" : undefined}
                  className={iconInputClass}
                />
              </div>
            </Field>
            {error && (
              <div id="recovery-email-error">
                <Alert tone="danger">
                  <p>{error}</p>
                  {notRegistered && (
                    <p className="mt-1.5 text-fg-muted">
                      {t("recovery.notRegisteredHint")}{" "}
                      <Link to={signupPath(locale)} className={linkClass}>
                        {t("recovery.createAccount")}
                      </Link>
                    </p>
                  )}
                </Alert>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? t("login.loading") : t("recovery.continue")}
              {!loading && <ArrowRight aria-hidden="true" />}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-4">
            {notice && <Alert tone="info">{notice}</Alert>}
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
                    className={digitClass}
                  />
                ))}
              </div>
            </fieldset>
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? t("login.loading") : t("recovery.verify")}
            </Button>
            <Button
              size="lg"
              block
              onClick={() => void resendCode()}
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0
                ? t("recovery.resendWait", { seconds: cooldown })
                : t("recovery.resend")}
            </Button>
            <Button
              variant="ghost"
              block
              onClick={() => {
                setStep("email");
                setError("");
                setNotice("");
                setCodeVerified(false);
              }}
            >
              {t("recovery.back")}
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="space-y-4">
            <Field label={t("recovery.newPassword")} htmlFor={passwordId}>
              <div className="relative">
                <LockKeyhole className={iconClass} aria-hidden="true" />
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className={revealButtonClass}
                  aria-label={
                    showPassword ? t("recovery.hidePassword") : t("recovery.showPassword")
                  }
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label={t("recovery.confirmPassword")} htmlFor={confirmId}>
              <div className="relative">
                <LockKeyhole className={iconClass} aria-hidden="true" />
                <input
                  id={confirmId}
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className={revealButtonClass}
                  aria-label={
                    showConfirm ? t("recovery.hidePassword") : t("recovery.showPassword")
                  }
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <p className={hintClass}>{t("recovery.passwordHint")}</p>
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? t("login.loading") : t("recovery.updatePassword")}
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4">
            <Link
              to={loginPath(locale)}
              className={buttonClass({ variant: "primary", size: "lg", block: true })}
            >
              {t("recovery.backToSignIn")}
            </Link>
          </div>
        )}

        {step !== "success" && (
          <p className="mt-6 text-center text-sm text-fg-muted">
            {t("login.alreadyHave")}{" "}
            <Link to={loginPath(locale)} className={linkClass}>
              {t("login.signIn")}
            </Link>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

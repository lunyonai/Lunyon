import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";

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

  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        await register(email, password);
      } else {
        await login(email, password);
      }

      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
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
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-2.5 text-sm leading-6 text-[var(--lunyo-text-muted)]">
          {isSignup
            ? "Start reclaiming your time with Lunyo."
            : "Reclaim your time and continue where you left off."}
        </p>
      </motion.div>

      <motion.div variants={item} transition={{ duration: 0.4, ease }}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
                Full name
              </span>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClassName}
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--lunyo-text)]/90">
              Email
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
              Password
            </span>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isSignup ? "new-password" : "current-password"}
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
            {loading ? "Loading..." : isSignup ? "Create account" : "Sign In"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--lunyo-border)]" />
          <span className="text-[11px] text-slate-600">or</span>
          <div className="h-px flex-1 bg-[var(--lunyo-border)]" />
        </div>

        <button
          type="button"
          onClick={() => {
            alert("Google sign-in is coming soon.");
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)]/60 text-sm font-medium text-[var(--lunyo-text)] transition hover:bg-[var(--lunyo-surface)]"
        >
          Continue with Google
        </button>

        <p className="mt-7 text-center text-sm text-[var(--lunyo-text-muted)]">
          {isSignup ? "Already have an account?" : "New to Lunyo?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            className="font-medium text-[var(--lunyo-primary)] transition hover:brightness-125"
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

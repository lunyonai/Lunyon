import { ArrowRight, Globe2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="w-full max-w-sm px-8"
    >
      <div className="mb-12">
        <Logo showTagline={false} compact />
      </div>

      <div className="mb-10">
        <p className="text-sm font-medium text-blue-400">
          {isSignup ? "START FOR FREE" : "WELCOME BACK"}
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {isSignup ? (
            <>
              Build your first
              <br />
              AI employee.
            </>
          ) : (
            <>
              Welcome back to your
              <br />
              AI workspace.
            </>
          )}
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          {isSignup
            ? "Create your workspace and turn repetitive work into intelligent workflows."
            : "Sign in to access your workspace and let your AI team get to work."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignup && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Full name
            </span>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Work email
          </span>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Password
          </span>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </label>

        {!isSignup && (
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-blue-600"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : isSignup
              ? "Create free account"
              : "Continue"}

          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs text-slate-500">OR CONTINUE WITH</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={() => {
          alert("Google Login será implementado na próxima sprint.");
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
      >
        <Globe2 className="h-4 w-4" />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-slate-400">
        {isSignup ? "Already have an account?" : "New to AI Employee?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignup ? "login" : "signup")}
          className="font-semibold text-blue-400 transition hover:text-blue-300"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </button>
      </p>

      <p className="mt-10 text-center text-xs leading-5 text-slate-600">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}
import {
  Bot,
  Check,
  Clock3,
  FileText,
  Mail,
  Sparkles,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Logo from "./Logo";


type DemoAction = "email" | "summary" | null;

const stats = [
  {
    label: "Hours saved",
    value: "124.5",
    detail: "+18.2% this week",
    icon: Clock3,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Active automations",
    value: "08",
    detail: "3 running now",
    icon: Workflow,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    label: "AI employees",
    value: "12",
    detail: "Ready to work",
    icon: Bot,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

const demoContent = {
  email: {
    title: "Client follow-up email",
    label: "Email Assistant",
    text: "Hi Sarah, I wanted to follow up on our conversation and share the updated project timeline. The team has completed the first milestone and we are on track for delivery next Friday.",
  },
  summary: {
    title: "Weekly strategy meeting",
    label: "Meeting Summary",
    text: "Key decisions: prioritize onboarding improvements, launch the new automation flow on Thursday, and review conversion metrics in next Monday's meeting.",
  },
};

export default function HeroPreview() {
  const [activeDemo, setActiveDemo] = useState<DemoAction>(null);
  const content = activeDemo ? demoContent[activeDemo] : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 px-8 py-8 lg:px-12">
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative flex items-center justify-between"
      >
        <Logo />

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">
            All systems operational
          </span>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mt-16 max-w-xl"
      >
        <p className="text-sm font-medium text-blue-400">AI WORKSPACE</p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white lg:text-5xl">
          Your work. <br />
          <span className="text-slate-400">Working for you.</span>
        </h1>

        <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
          Turn repetitive work into intelligent workflows that run while you
          focus on what matters.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.25,
            },
          },
        }}
        className="relative mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <motion.article
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/30 backdrop-blur"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>

                <span className="text-xs font-medium text-emerald-400">
                  Live
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                {stat.value}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-300">
                {stat.label}
              </p>

              <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
            </motion.article>
          );
        })}
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="relative mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Try the AI workspace</p>
            <p className="mt-1 text-xs text-slate-400">
              Pick an action and watch your AI employee work.
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveDemo("email")}
            className="group rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5"
          >
            <Mail className="h-4 w-4 text-blue-400 transition group-hover:scale-110" />
            <p className="mt-3 text-sm font-medium text-white">Generate email</p>
            <p className="mt-1 text-xs text-slate-500">Draft a client follow-up</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveDemo("summary")}
            className="group rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left transition hover:border-violet-500/50 hover:bg-violet-500/5"
          >
            <FileText className="h-4 w-4 text-violet-400 transition group-hover:scale-110" />
            <p className="mt-3 text-sm font-medium text-white">Meeting summary</p>
            <p className="mt-1 text-xs text-slate-500">Turn notes into actions</p>
          </button>
        </div>

        <div className="mt-4 min-h-28 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          {content ? (
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </div>

                <p className="text-xs font-medium text-emerald-400">
                  {content.label} completed
                </p>
              </div>

              <p className="mt-3 text-sm font-medium text-white">
                {content.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {content.text}
              </p>
            </motion.div>
          ) : (
            <div className="flex h-20 items-center justify-center">
              <p className="text-xs text-slate-500">
                Choose an action to start the live demo.
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
import { motion } from "framer-motion";

type TimeTrendProps = {
  days?: { label: string; minutes: number; current?: boolean }[];
};

const defaultDays = [
  { label: "Mon", minutes: 32 },
  { label: "Tue", minutes: 48 },
  { label: "Wed", minutes: 61 },
  { label: "Thu", minutes: 79 },
  { label: "Fri", minutes: 102, current: true },
];

export default function TimeTrend({ days = defaultDays }: TimeTrendProps) {
  const maxMinutes = Math.max(...days.map((day) => day.minutes));

  return (
    <div className="mt-5">
      <div className="flex h-16 items-end gap-3">
        {days.map((day, index) => {
          const heightPercent = Math.max((day.minutes / maxMinutes) * 100, 12);

          return (
            <div
              key={day.label}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-12 w-full items-end justify-center">
                <motion.div
                  initial={{ height: 0, opacity: 0.4 }}
                  animate={{ height: `${heightPercent}%`, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.35 + index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`w-full max-w-6 rounded-sm ${
                    day.current
                      ? "bg-[var(--lunyo-primary)]/70"
                      : "bg-slate-700/70"
                  }`}
                />
              </div>
              <div className="text-center">
                <p
                  className={`text-[10px] font-medium ${
                    day.current
                      ? "text-[var(--lunyo-primary)]/80"
                      : "text-[var(--lunyo-text-muted)]"
                  }`}
                >
                  {day.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {day.minutes}m
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

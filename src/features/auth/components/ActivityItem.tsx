import { Check } from "lucide-react";
import { motion } from "framer-motion";

type ActivityItemProps = {
  title: string;
  time: string;
};

export default function ActivityItem({ title, time }: ActivityItemProps) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 py-1.5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Check
          className="h-3.5 w-3.5 shrink-0 text-[var(--lunyo-success)]/80"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <p className="truncate text-sm text-[var(--lunyo-text)]/85">{title}</p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-[var(--lunyo-text-muted)]">
        {time}
      </span>
    </motion.li>
  );
}

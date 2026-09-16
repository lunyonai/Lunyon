import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Mail,
  Search,
  Users,
} from "lucide-react";

const workers = [
  { id: "email", label: "Email", icon: Mail, x: 18, y: 28 },
  { id: "research", label: "Research", icon: Search, x: 50, y: 12 },
  { id: "meetings", label: "Meetings", icon: Users, x: 82, y: 28 },
  { id: "reports", label: "Reports", icon: FileText, x: 32, y: 72 },
  { id: "analytics", label: "Analytics", icon: BarChart3, x: 68, y: 72 },
] as const;

const connections: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [2, 4],
  [3, 4],
];

export default function EmployeesDemo() {
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveEdge((current) => (current + 1) % connections.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const [fromIdx, toIdx] = connections[activeEdge];
  const from = workers[fromIdx];
  const to = workers[toIdx];

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-[var(--lunyo-text)]">
        Specialized workers, connected
      </p>

      <div
        className="relative h-44 rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/80"
        aria-hidden="true"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {connections.map(([a, b], i) => {
            const wa = workers[a];
            const wb = workers[b];
            const isActive = i === activeEdge;
            return (
              <line
                key={`${a}-${b}`}
                x1={wa.x}
                y1={wa.y}
                x2={wb.x}
                y2={wb.y}
                stroke={
                  isActive
                    ? "rgba(37, 99, 235, 0.45)"
                    : "rgba(148, 163, 184, 0.18)"
                }
                strokeWidth={isActive ? 0.6 : 0.35}
              />
            );
          })}
          <circle
            cx={from.x + (to.x - from.x) * 0.55}
            cy={from.y + (to.y - from.y) * 0.55}
            r="1.2"
            fill="rgba(96, 165, 250, 0.7)"
          />
        </svg>

        {workers.map((worker) => {
          const Icon = worker.icon;
          return (
            <div
              key={worker.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${worker.x}%`, top: `${worker.y}%` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--lunyo-border)] bg-[var(--lunyo-surface)]">
                <Icon className="h-3.5 w-3.5 text-[var(--lunyo-text-muted)]" />
              </div>
              <span className="text-[10px] text-[var(--lunyo-text-muted)]">
                {worker.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-[var(--lunyo-text-muted)]">
        Each capability handles a distinct type of work. Together they keep
        information moving without pulling you back into the details.
      </p>
    </div>
  );
}

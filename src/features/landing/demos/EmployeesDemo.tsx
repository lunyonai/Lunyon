import { useEffect, useState } from "react";
import { BarChart3, FileText, Mail, Search, Users, type LucideIcon } from "lucide-react";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { useLocale } from "../../../i18n/LocaleProvider";

const workers: Array<{ id: "email" | "research" | "meetings" | "reports" | "analytics"; icon: LucideIcon; tone: TileTone; x: number; y: number }> = [
  { id: "email", icon: Mail, tone: "primary", x: 18, y: 26 },
  { id: "research", icon: Search, tone: "cyan", x: 50, y: 14 },
  { id: "meetings", icon: Users, tone: "violet", x: 82, y: 26 },
  { id: "reports", icon: FileText, tone: "orange", x: 30, y: 70 },
  { id: "analytics", icon: BarChart3, tone: "emerald", x: 70, y: 70 },
];

const connections: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [2, 4],
  [3, 4],
  [1, 3],
  [1, 4],
];

export default function EmployeesDemo() {
  const [activeEdge, setActiveEdge] = useState(0);
  const { t } = useLocale();

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveEdge((current) => (current + 1) % connections.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  const [fromIdx, toIdx] = connections[activeEdge];

  return (
    <div className="flex h-full flex-col">
      <div
        className="relative h-52 overflow-hidden rounded-xl border border-line bg-canvas/60"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--ui-tint-violet) 14%, transparent), transparent 70%)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
                stroke={isActive ? "var(--ui-tint-violet)" : "var(--ui-line-strong)"}
                strokeOpacity={isActive ? 0.9 : 0.8}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={isActive ? undefined : "3 3"}
                vectorEffect="non-scaling-stroke"
                style={{ transition: "stroke 400ms, stroke-opacity 400ms" }}
              />
            );
          })}
        </svg>

        {workers.map((worker, index) => {
          const lit = index === fromIdx || index === toIdx;
          return (
            <div
              key={worker.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${worker.x}%`, top: `${worker.y}%` }}
            >
              <span
                className="rounded-xl transition-shadow duration-500"
                style={{
                  boxShadow: lit ? "0 0 0 4px color-mix(in srgb, var(--ui-tint-violet) 18%, transparent), 0 0 24px -2px color-mix(in srgb, var(--ui-tint-violet) 55%, transparent)" : "none",
                }}
              >
                <IconTile icon={worker.icon} tone={worker.tone} size="sm" className="bg-surface" />
              </span>
              <span className="whitespace-nowrap text-[10px] font-medium text-fg-muted">{t(`workforce.${worker.id}`)}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-medium text-fg-subtle">{t("demo.employeesTitle")}</p>
    </div>
  );
}

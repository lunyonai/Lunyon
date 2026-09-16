import { motion, useAnimationFrame, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

type NodeRole = "in" | "worker" | "out";

type DiagramNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  role: NodeRole;
};

type DiagramEdge = {
  from: string;
  to: string;
};

type Layout = {
  viewBox: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  pulseCount: number;
};

const desktopLayout: Layout = {
  viewBox: "0 0 900 520",
  pulseCount: 5,
  nodes: [
    { id: "in", x: 450, y: 48, label: "Incoming work", role: "in" },
    { id: "email", x: 130, y: 176, label: "Email", role: "worker" },
    { id: "research", x: 310, y: 208, label: "Research", role: "worker" },
    { id: "meetings", x: 590, y: 208, label: "Meetings", role: "worker" },
    { id: "reports", x: 770, y: 176, label: "Reports", role: "worker" },
    { id: "followups", x: 250, y: 344, label: "Follow-ups", role: "worker" },
    { id: "analytics", x: 650, y: 344, label: "Analytics", role: "worker" },
    { id: "out", x: 450, y: 468, label: "Work completed", role: "out" },
  ],
  edges: [
    { from: "in", to: "email" },
    { from: "in", to: "research" },
    { from: "in", to: "meetings" },
    { from: "in", to: "reports" },
    { from: "email", to: "research" },
    { from: "research", to: "meetings" },
    { from: "meetings", to: "reports" },
    { from: "email", to: "followups" },
    { from: "research", to: "followups" },
    { from: "meetings", to: "analytics" },
    { from: "reports", to: "analytics" },
    { from: "followups", to: "analytics" },
    { from: "followups", to: "out" },
    { from: "analytics", to: "out" },
  ],
};

const mobileLayout: Layout = {
  viewBox: "0 0 360 620",
  pulseCount: 2,
  nodes: [
    { id: "in", x: 180, y: 36, label: "Incoming work", role: "in" },
    { id: "email", x: 88, y: 150, label: "Email", role: "worker" },
    { id: "research", x: 272, y: 150, label: "Research", role: "worker" },
    { id: "meetings", x: 88, y: 268, label: "Meetings", role: "worker" },
    { id: "reports", x: 272, y: 268, label: "Reports", role: "worker" },
    { id: "followups", x: 88, y: 386, label: "Follow-ups", role: "worker" },
    { id: "analytics", x: 272, y: 386, label: "Analytics", role: "worker" },
    { id: "out", x: 180, y: 520, label: "Work completed", role: "out" },
  ],
  edges: [
    { from: "in", to: "email" },
    { from: "in", to: "research" },
    { from: "email", to: "meetings" },
    { from: "research", to: "reports" },
    { from: "meetings", to: "followups" },
    { from: "reports", to: "analytics" },
    { from: "followups", to: "out" },
    { from: "analytics", to: "out" },
    { from: "email", to: "research" },
    { from: "followups", to: "analytics" },
  ],
};

type Pulse = {
  edgeIndex: number;
  progress: number;
  duration: number;
  variant: "blue" | "cyan";
};

type Ring = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
};

function nodeById(nodes: DiagramNode[], id: string) {
  return nodes.find((node) => node.id === id);
}

function outgoingEdges(layout: Layout, fromId: string) {
  return layout.edges
    .map((edge, index) => ({ edge, index }))
    .filter(({ edge }) => edge.from === fromId);
}

function createPulses(layout: Layout): Pulse[] {
  return Array.from({ length: layout.pulseCount }, (_, index) => ({
    edgeIndex: index % layout.edges.length,
    progress: (index / layout.pulseCount) * 0.7,
    duration: 2.4 + (index % 3) * 0.5,
    variant: index % 2 === 0 ? "blue" : "cyan",
  }));
}

function WorkforceDiagram({ compact }: { compact: boolean }) {
  const layout = compact ? mobileLayout : desktopLayout;
  const layoutRef = useRef(layout);
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { margin: "-12% 0px" });
  const inViewRef = useRef(inView);
  const pulsesRef = useRef<Pulse[]>(createPulses(layout));
  const ringsRef = useRef<Ring[]>([]);
  const activationRef = useRef<Record<string, number>>({});
  const pulseEls = useRef<(SVGCircleElement | null)[]>([]);
  const ringGroupRef = useRef<SVGGElement | null>(null);
  const nodeEls = useRef<Record<string, SVGCircleElement | null>>({});
  const lastTimeRef = useRef(0);

  layoutRef.current = layout;
  inViewRef.current = inView;

  useEffect(() => {
    pulsesRef.current = createPulses(layout);
    ringsRef.current = [];
    activationRef.current = {};
    lastTimeRef.current = 0;
  }, [layout]);

  useAnimationFrame((time) => {
    const currentLayout = layoutRef.current;
    if (reduceMotion || !inViewRef.current || document.hidden) {
      lastTimeRef.current = 0;
      return;
    }

    const last = lastTimeRef.current || time;
    const dt = Math.min((time - last) / 1000, 0.05);
    lastTimeRef.current = time;

    const pulses = pulsesRef.current;
    for (let i = 0; i < pulses.length; i++) {
      const pulse = pulses[i];
      pulse.progress += dt / pulse.duration;

      const edge = currentLayout.edges[pulse.edgeIndex];
      const from = edge ? nodeById(currentLayout.nodes, edge.from) : undefined;
      const to = edge ? nodeById(currentLayout.nodes, edge.to) : undefined;

      if (pulse.progress >= 1 && from && to) {
        activationRef.current[to.id] = 1;
        ringsRef.current.push({ x: to.x, y: to.y, radius: 8, opacity: 0.42 });

        const nextOptions = outgoingEdges(currentLayout, to.id);
        if (nextOptions.length > 0 && Math.random() < 0.45) {
          const next = nextOptions[Math.floor(Math.random() * nextOptions.length)];
          pulse.edgeIndex = next.index;
        } else {
          pulse.edgeIndex = Math.floor(Math.random() * currentLayout.edges.length);
        }
        pulse.progress = 0;
        pulse.duration = 2.2 + Math.random() * 1.4;
      }

      if (from && to) {
        const t = Math.min(pulse.progress, 1);
        const eased = t * t * (3 - 2 * t);
        const el = pulseEls.current[i];
        if (el) {
          el.setAttribute("cx", String(from.x + (to.x - from.x) * eased));
          el.setAttribute("cy", String(from.y + (to.y - from.y) * eased));
          el.setAttribute(
            "fill",
            pulse.variant === "cyan"
              ? "rgba(34, 211, 238, 0.82)"
              : "rgba(96, 165, 250, 0.88)",
          );
        }
      }
    }

    ringsRef.current = ringsRef.current
      .map((ring) => ({
        ...ring,
        radius: ring.radius + dt * 22,
        opacity: ring.opacity - dt * 0.55,
      }))
      .filter((ring) => ring.opacity > 0);

    if (ringGroupRef.current) {
      ringGroupRef.current.replaceChildren();
      for (const ring of ringsRef.current) {
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        circle.setAttribute("cx", String(ring.x));
        circle.setAttribute("cy", String(ring.y));
        circle.setAttribute("r", String(ring.radius));
        circle.setAttribute("fill", "none");
        circle.setAttribute(
          "stroke",
          `rgba(96, 165, 250, ${ring.opacity * 0.7})`,
        );
        circle.setAttribute("stroke-width", "1");
        ringGroupRef.current.appendChild(circle);
      }
    }

    for (const node of currentLayout.nodes) {
      const current = activationRef.current[node.id] ?? 0;
      if (current > 0) {
        activationRef.current[node.id] = Math.max(0, current - dt * 0.85);
      }
      const el = nodeEls.current[node.id];
      if (!el) continue;
      const activation = activationRef.current[node.id] ?? 0;
      const r =
        node.role === "worker" ? 6 + activation * 1.6 : 7 + activation * 1.4;
      el.setAttribute("r", String(r));
      if (node.role === "out") {
        el.setAttribute(
          "fill",
          `rgba(52, 211, 153, ${0.45 + activation * 0.4})`,
        );
      } else {
        el.setAttribute(
          "fill",
          activation > 0.08
            ? `rgba(96, 165, 250, ${0.55 + activation * 0.4})`
            : "rgba(148, 163, 184, 0.42)",
        );
      }
    }
  });

  return (
    <div ref={wrapRef} className="mt-14 w-full overflow-hidden">
      <svg
        viewBox={layout.viewBox}
        className="mx-auto h-auto w-full max-w-4xl"
        role="img"
        aria-label="Specialized AI Employees coordinating incoming work into completed outcomes"
      >
        {layout.edges.map((edge) => {
          const from = nodeById(layout.nodes, edge.from);
          const to = nodeById(layout.nodes, edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(100, 130, 180, 0.28)"
              strokeWidth="1"
            />
          );
        })}

        <g ref={ringGroupRef} />

        {layout.nodes.map((node) => (
          <g key={node.id}>
            <circle
              ref={(el) => {
                nodeEls.current[node.id] = el;
              }}
              cx={node.x}
              cy={node.y}
              r={node.role === "worker" ? 6 : 7}
              fill={
                node.role === "out"
                  ? "rgba(52, 211, 153, 0.45)"
                  : "rgba(148, 163, 184, 0.42)"
              }
            />
            <text
              x={node.x}
              y={node.y + (node.role === "in" ? -16 : 22)}
              textAnchor="middle"
              fill={
                node.role === "out"
                  ? "rgba(52, 211, 153, 0.9)"
                  : "rgba(232, 238, 249, 0.82)"
              }
              fontSize={compact ? 11 : 12}
            >
              {node.label}
            </text>
          </g>
        ))}

        {Array.from({ length: layout.pulseCount }, (_, index) => (
          <circle
            key={`pulse-${index}`}
            ref={(el) => {
              pulseEls.current[index] = el;
            }}
            r="2.4"
            fill="rgba(96, 165, 250, 0.88)"
            opacity={reduceMotion ? 0 : 1}
            cx={layout.nodes[0]?.x}
            cy={layout.nodes[0]?.y}
          />
        ))}
      </svg>
    </div>
  );
}

export default function ConnectedWorkforceSection() {
  const reduceMotion = useReducedMotion();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section className="relative bg-transparent py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--lunyo-text)] md:text-4xl"
        >
          One task becomes a workflow.
          <br />
          Workflows become a workforce.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="mt-5 max-w-xl text-base leading-7 text-[var(--lunyo-text-muted)] sm:text-lg"
        >
          Lunyo coordinates specialized AI Employees that can work across the
          repetitive parts of your day.
        </motion.p>

        <WorkforceDiagram compact={compact} />
      </div>
    </section>
  );
}

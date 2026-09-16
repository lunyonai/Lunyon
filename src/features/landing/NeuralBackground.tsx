import { useEffect, useRef } from "react";

type Preset = "landing" | "login";

type NeuralBackgroundProps = {
  preset?: Preset;
  className?: string;
};

type Node = {
  x: number;
  y: number;
  baseRadius: number;
  importance: number;
  activation: number;
  glow: number;
};

type Edge = {
  from: number;
  to: number;
  length: number;
  brightness: number;
};

type Pulse = {
  edgeIndex: number;
  progress: number;
  speed: number;
  variant: "blue" | "cyan";
  trail: { x: number; y: number }[];
};

type Ring = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
};

type Profile = {
  nodeCount: number;
  hubCount: number;
  maxPulses: number;
  canvasOpacity: number;
  pulseActivity: number;
  continuationChance: number;
};

const HUB_ZONES = [
  { x: 0.18, y: 0.2 },
  { x: 0.82, y: 0.22 },
  { x: 0.5, y: 0.48 },
  { x: 0.22, y: 0.78 },
  { x: 0.78, y: 0.76 },
];

const CONTINUATION_CHANCE = 0.4;

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function getBreakpoint(width: number): "mobile" | "tablet" | "desktop" | "large" {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1440) return "desktop";
  return "large";
}

function getProfile(preset: Preset, width: number): Profile {
  const bp = getBreakpoint(width);

  if (preset === "login") {
    const base: Record<typeof bp, Profile> = {
      mobile: {
        nodeCount: 14,
        hubCount: 4,
        maxPulses: 3,
        canvasOpacity: 0.62,
        pulseActivity: 0.55,
        continuationChance: CONTINUATION_CHANCE,
      },
      tablet: {
        nodeCount: 18,
        hubCount: 5,
        maxPulses: 5,
        canvasOpacity: 0.68,
        pulseActivity: 0.6,
        continuationChance: CONTINUATION_CHANCE,
      },
      desktop: {
        nodeCount: 22,
        hubCount: 5,
        maxPulses: 6,
        canvasOpacity: 0.72,
        pulseActivity: 0.65,
        continuationChance: CONTINUATION_CHANCE,
      },
      large: {
        nodeCount: 22,
        hubCount: 5,
        maxPulses: 7,
        canvasOpacity: 0.72,
        pulseActivity: 0.65,
        continuationChance: CONTINUATION_CHANCE,
      },
    };
    return base[bp];
  }

  const base: Record<typeof bp, Profile> = {
    mobile: {
      nodeCount: 20,
      hubCount: 4,
      maxPulses: 4,
      canvasOpacity: 0.88,
      pulseActivity: 1,
      continuationChance: CONTINUATION_CHANCE,
    },
    tablet: {
      nodeCount: 26,
      hubCount: 5,
      maxPulses: 7,
      canvasOpacity: 0.92,
      pulseActivity: 1,
      continuationChance: CONTINUATION_CHANCE,
    },
    desktop: {
      nodeCount: 32,
      hubCount: 5,
      maxPulses: 10,
      canvasOpacity: 1,
      pulseActivity: 1,
      continuationChance: CONTINUATION_CHANCE,
    },
    large: {
      nodeCount: 32,
      hubCount: 5,
      maxPulses: 12,
      canvasOpacity: 1,
      pulseActivity: 1,
      continuationChance: CONTINUATION_CHANCE,
    },
  };
  return base[bp];
}

function buildGraph(width: number, height: number, profile: Profile) {
  const nodes: Node[] = [];
  const padding = 40;
  const minDist = width < 768 ? 56 : 68;

  for (let i = 0; i < profile.hubCount; i++) {
    const zone = HUB_ZONES[i];
    const jitter = 0.06;
    nodes.push({
      x: width * (zone.x + (Math.random() - 0.5) * jitter),
      y: height * (zone.y + (Math.random() - 0.5) * jitter),
      baseRadius: 3.4,
      importance: 1,
      activation: 0,
      glow: 0,
    });
  }

  let attempts = 0;
  while (nodes.length < profile.nodeCount && attempts < profile.nodeCount * 50) {
    attempts++;
    const x = padding + Math.random() * (width - padding * 2);
    const y = padding + Math.random() * (height - padding * 2);
    const tooClose = nodes.some((n) => dist(n.x, n.y, x, y) < minDist);
    if (!tooClose) {
      nodes.push({
        x,
        y,
        baseRadius: 2 + Math.random() * 0.9,
        importance: 0,
        activation: 0,
        glow: 0,
      });
    }
  }

  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  const neighborCount = width < 768 ? 3 : 4;

  nodes.forEach((node, i) => {
    const neighbors = nodes
      .map((other, j) => ({
        j,
        d: i === j ? Infinity : dist(node.x, node.y, other.x, other.y),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, neighborCount);

    neighbors.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        const a = nodes[i];
        const b = nodes[j];
        edges.push({
          from: i,
          to: j,
          length: dist(a.x, a.y, b.x, b.y),
          brightness: 0,
        });
      }
    });
  });

  return { nodes, edges };
}

function pulseSpeedForEdge(length: number, maxLength: number) {
  const durationMs = 2000 + (length / Math.max(maxLength, 1)) * 2000;
  return 1 / durationMs;
}

function spawnPulse(
  nodes: Node[],
  edges: Edge[],
  existing: Pulse[],
  maxPulses: number,
  maxEdgeLength: number,
  preferredMidX?: number,
  preferredMidY?: number,
  fromNodeIndex?: number,
): Pulse | null {
  if (existing.length >= maxPulses || edges.length === 0) return null;

  let candidates = edges.map((edge, edgeIndex) => {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    let score = Math.random();
    if (fromNodeIndex !== undefined) {
      if (edge.from !== fromNodeIndex && edge.to !== fromNodeIndex) {
        return { edgeIndex, score: -1 };
      }
      score += 2;
    }
    if (preferredMidX !== undefined && preferredMidY !== undefined) {
      const d = dist(midX, midY, preferredMidX, preferredMidY);
      score += d / 400;
    }
    return { edgeIndex, score };
  });

  if (fromNodeIndex !== undefined) {
    candidates = candidates.filter((c) => c.score >= 0);
  }

  candidates.sort((a, b) => b.score - a.score);
  const pick = candidates[Math.floor(Math.random() * Math.min(4, candidates.length))];
  if (!pick) return null;

  const edge = edges[pick.edgeIndex];
  return {
    edgeIndex: pick.edgeIndex,
    progress: 0,
    speed: pulseSpeedForEdge(edge.length, maxEdgeLength),
    variant: Math.random() > 0.82 ? "cyan" : "blue",
    trail: [],
  };
}

function seedPulses(
  nodes: Node[],
  edges: Edge[],
  maxPulses: number,
  maxEdgeLength: number,
  width: number,
  height: number,
) {
  const pulses: Pulse[] = [];
  const zones = [
    { x: width * 0.25, y: height * 0.3 },
    { x: width * 0.75, y: height * 0.35 },
    { x: width * 0.5, y: height * 0.55 },
    { x: width * 0.3, y: height * 0.7 },
    { x: width * 0.7, y: height * 0.65 },
  ];

  for (let i = 0; i < maxPulses; i++) {
    const zone = zones[i % zones.length];
    const pulse = spawnPulse(
      nodes,
      edges,
      pulses,
      maxPulses,
      maxEdgeLength,
      zone.x,
      zone.y,
    );
    if (pulse) {
      pulse.progress = Math.random() * 0.35;
      pulses.push(pulse);
    }
  }
  return pulses;
}

function getOverlayStyle(
  preset: Preset,
  scroll: { y: number; pricingTop: number; ctaTop: number; docHeight: number; vh: number },
) {
  const pricingProgress =
    scroll.pricingTop > 0
      ? Math.min(
          1,
          Math.max(0, (scroll.y + scroll.vh * 0.5 - scroll.pricingTop) / 400),
        )
      : 0;

  const ctaProgress =
    scroll.ctaTop > 0
      ? Math.min(
          1,
          Math.max(0, (scroll.y + scroll.vh * 0.55 - scroll.ctaTop) / 350),
        )
      : 0;

  const pricingSoftness = pricingProgress * 0.12;
  const ctaFade = ctaProgress * 0.35;

  if (preset === "login") {
    return {
      background: `
        linear-gradient(90deg,
          rgba(2, 6, 23, 0.55) 0%,
          rgba(2, 6, 23, 0.42) 38%,
          rgba(2, 6, 23, 0.72) 58%,
          rgba(2, 6, 23, 0.9) 100%
        ),
        linear-gradient(180deg,
          rgba(2, 6, 23, 0.32) 0%,
          transparent 14%,
          transparent 100%
        )
      `,
    };
  }

  return {
    background: `
      linear-gradient(90deg,
        rgba(2, 6, 23, ${0.78 + pricingSoftness * 0.5}) 0%,
        rgba(2, 6, 23, ${0.5 + pricingSoftness * 0.3}) 38%,
        rgba(2, 6, 23, ${0.26 + pricingSoftness * 0.4}) 58%,
        rgba(2, 6, 23, ${0.38 + pricingSoftness * 0.3}) 100%
      ),
      linear-gradient(180deg,
        rgba(2, 6, 23, 0.34) 0%,
        transparent 12%,
        transparent ${58 - pricingProgress * 8}%,
        rgba(2, 6, 23, ${0.18 + pricingSoftness}) ${72 + pricingProgress * 4}%,
        rgba(2, 6, 23, ${0.55 + ctaFade}) ${88 + ctaProgress * 4}%,
        rgba(2, 6, 23, ${0.88 + ctaFade * 0.3}) 100%
      )
    `,
  };
}

export default function NeuralBackground({
  preset = "landing",
  className = "",
}: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scroll = {
      y: 0,
      pricingTop: 0,
      ctaTop: 0,
      docHeight: 0,
      vh: window.innerHeight,
    };

    const state = {
      nodes: [] as Node[],
      edges: [] as Edge[],
      pulses: [] as Pulse[],
      rings: [] as Ring[],
      profile: getProfile(preset, window.innerWidth),
      maxEdgeLength: 1,
      reducedMotion,
      width: 0,
      height: 0,
      rafId: 0,
      lastTime: 0,
      globalPulseScale: 1,
    };

    const updateScrollMetrics = () => {
      scroll.y = window.scrollY;
      scroll.vh = window.innerHeight;
      scroll.docHeight = document.documentElement.scrollHeight;
      const pricingEl = document.getElementById("pricing");
      const ctaEl = document.getElementById("cta");
      scroll.pricingTop = pricingEl?.getBoundingClientRect().top
        ? pricingEl.getBoundingClientRect().top + scroll.y
        : 0;
      scroll.ctaTop = ctaEl?.getBoundingClientRect().top
        ? ctaEl.getBoundingClientRect().top + scroll.y
        : 0;
      if (overlay) {
        overlay.style.background = getOverlayStyle(preset, scroll).background;
      }
    };

    let scrollTimer: number | undefined;
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        updateScrollMetrics();
        scrollTimer = undefined;
      }, 80);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.profile = getProfile(preset, window.innerWidth);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = state.width * dpr;
      canvas.height = state.height * dpr;
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const graph = buildGraph(state.width, state.height, state.profile);
      state.nodes = graph.nodes;
      state.edges = graph.edges;
      state.maxEdgeLength = Math.max(...state.edges.map((e) => e.length), 1);

      if (!state.reducedMotion) {
        state.pulses = seedPulses(
          state.nodes,
          state.edges,
          state.profile.maxPulses,
          state.maxEdgeLength,
          state.width,
          state.height,
        );
      } else {
        state.pulses = [];
      }

      state.rings = [];
      updateScrollMetrics();
    };

    const draw = (now: number) => {
      if (!state.lastTime) state.lastTime = now;
      const dt = Math.min(now - state.lastTime, 48);
      state.lastTime = now;

      const { nodes, edges, width, height, profile } = state;
      ctx.clearRect(0, 0, width, height);

      const pricingInView =
        scroll.pricingTop > 0 &&
        scroll.y + scroll.vh * 0.4 > scroll.pricingTop &&
        scroll.y < scroll.pricingTop + 800;
      const ctaInView =
        scroll.ctaTop > 0 && scroll.y + scroll.vh * 0.5 > scroll.ctaTop;

      state.globalPulseScale =
        profile.pulseActivity *
        (ctaInView ? 0.45 : pricingInView ? 0.72 : 1);

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#07111f");
      bg.addColorStop(0.45, "#020617");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const accent = ctx.createRadialGradient(
        width * 0.72,
        height * 0.28,
        0,
        width * 0.72,
        height * 0.28,
        width * 0.55,
      );
      accent.addColorStop(0, "rgba(37, 99, 235, 0.07)");
      accent.addColorStop(1, "transparent");
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      edges.forEach((edge) => {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        if (!a || !b) return;
        const alpha = 0.14 + edge.brightness * 0.22;
        ctx.strokeStyle = `rgba(100, 130, 180, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (edge.brightness > 0) {
          edge.brightness = Math.max(0, edge.brightness - dt * 0.002);
        }
      });

      for (let i = state.rings.length - 1; i >= 0; i--) {
        const ring = state.rings[i];
        ring.radius += dt * 0.028;
        ring.opacity -= dt * 0.0009;
        if (ring.opacity <= 0) {
          state.rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 165, 250, ${ring.opacity * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!state.reducedMotion) {
        for (let i = state.pulses.length - 1; i >= 0; i--) {
          const pulse = state.pulses[i];
          const edge = edges[pulse.edgeIndex];
          if (!edge) continue;
          const a = nodes[edge.from];
          const b = nodes[edge.to];
          if (!a || !b) continue;

          pulse.progress += pulse.speed * dt;
          const t = smoothstep(Math.min(pulse.progress, 1));
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;

          edge.brightness = Math.min(1, edge.brightness + 0.08);

          pulse.trail.unshift({ x: px, y: py });
          if (pulse.trail.length > 3) pulse.trail.pop();

          const core =
            pulse.variant === "cyan"
              ? "rgba(34, 211, 238, 0.85)"
              : "rgba(96, 165, 250, 0.88)";
          const bloom =
            pulse.variant === "cyan"
              ? "rgba(34, 211, 238, 0.18)"
              : "rgba(37, 99, 235, 0.2)";

          for (let ti = pulse.trail.length - 1; ti >= 1; ti--) {
            const p0 = pulse.trail[ti];
            const p1 = pulse.trail[ti - 1];
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.08 * (1 - ti * 0.25) * state.globalPulseScale})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = bloom;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = core;
          ctx.globalAlpha = state.globalPulseScale;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (pulse.progress >= 1) {
            b.activation = 1;
            b.glow = 1;
            state.rings.push({
              x: b.x,
              y: b.y,
              radius: b.baseRadius + 2,
              opacity: 0.45,
            });

            state.pulses.splice(i, 1);

            if (
              Math.random() < profile.continuationChance &&
              state.pulses.length < profile.maxPulses
            ) {
              const next = spawnPulse(
                nodes,
                edges,
                state.pulses,
                profile.maxPulses,
                state.maxEdgeLength,
                undefined,
                undefined,
                edge.to,
              );
              if (next) state.pulses.push(next);
            } else if (state.pulses.length < profile.maxPulses) {
              const zoneX = width * (0.2 + Math.random() * 0.6);
              const zoneY = height * (0.25 + Math.random() * 0.5);
              const next = spawnPulse(
                nodes,
                edges,
                state.pulses,
                profile.maxPulses,
                state.maxEdgeLength,
                zoneX,
                zoneY,
              );
              if (next) state.pulses.push(next);
            }
          }
        }

        nodes.forEach((node) => {
          if (node.activation > 0) {
            node.activation = Math.max(0, node.activation - dt * 0.0018);
          }
          if (node.glow > 0) {
            node.glow = Math.max(0, node.glow - dt * 0.0016);
          }
        });

        while (state.pulses.length < Math.min(3, profile.maxPulses)) {
          const next = spawnPulse(
            nodes,
            edges,
            state.pulses,
            profile.maxPulses,
            state.maxEdgeLength,
            width * Math.random(),
            height * Math.random(),
          );
          if (!next) break;
          state.pulses.push(next);
        }
      }

      nodes.forEach((node) => {
        const scale = 1 + node.activation * 0.14;
        const r = node.baseRadius * scale;

        if (node.glow > 0.01 || node.activation > 0.01) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 5 * Math.max(node.glow, node.activation), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37, 99, 235, ${0.07 * Math.max(node.glow, node.activation)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle =
          node.activation > 0.05 || node.glow > 0.05
            ? `rgba(96, 165, 250, ${0.55 + Math.max(node.activation, node.glow) * 0.4})`
            : "rgba(148, 163, 184, 0.38)";
        ctx.fill();
      });

      if (!state.reducedMotion) {
        state.rafId = requestAnimationFrame(draw);
      }
    };

    const startLoop = () => {
      if (state.reducedMotion) {
        draw(performance.now());
        return;
      }
      state.rafId = requestAnimationFrame(draw);
    };

    resize();
    startLoop();

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(state.rafId);
      } else if (!state.reducedMotion) {
        state.lastTime = 0;
        state.rafId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, [preset]);

  const defaultOpacity = preset === "login" ? 0.72 : 1;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 ${className}`}
        style={{ opacity: defaultOpacity }}
      />
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
      />
    </>
  );
}

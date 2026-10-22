/** Shared motion presets for the landing page (kept subtle; MotionConfig honors reduced motion). */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Fade/slide-in once when the element scrolls into view. */
export function reveal(delay = 0, distance = 16) {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.55, delay, ease },
  } as const;
}

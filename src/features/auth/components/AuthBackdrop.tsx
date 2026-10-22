import NeuralBackground from "../../landing/NeuralBackground";
import { useTheme } from "../../../theme/themeContext";

/**
 * Background for the login/recovery screens. The neural canvas paints a dark scene, so the
 * light theme gets a calm canvas with a soft primary glow and a faint fading grid instead.
 */
export default function AuthBackdrop() {
  const { resolved } = useTheme();

  if (resolved === "dark") return <NeuralBackground preset="login" />;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 bg-canvas">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 50% -5%, color-mix(in srgb, var(--ui-primary) 8%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--ui-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />
    </div>
  );
}

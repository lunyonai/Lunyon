import { Moon, Sun } from "lucide-react";
import { IconButton } from "../components/ui/Button";
import { useLocale } from "../i18n/LocaleProvider";
import { useTheme } from "./themeContext";

/** Top-bar shortcut; the full light/dark/system choice lives in Settings. */
export default function ThemeToggle() {
  const { t } = useLocale();
  const { resolved, setPreference } = useTheme();
  const Icon = resolved === "dark" ? Sun : Moon;

  return (
    <IconButton
      aria-label={t("app.settings.toggleTheme")}
      title={t("app.settings.toggleTheme")}
      onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
    >
      <Icon />
    </IconButton>
  );
}

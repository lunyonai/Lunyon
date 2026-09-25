import { en, type Messages } from "./en";
import { es } from "./es";
import { pt } from "./pt";
import type { Locale } from "./config";

export const dictionaries: Record<Locale, Messages> = {
  en,
  pt,
  es,
};

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

export function readMessage(
  messages: Messages,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[key];
  }, messages);

  if (typeof value !== "string") return path;
  return interpolate(value, vars);
}

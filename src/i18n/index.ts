// =============================================================================
// src/i18n/index.ts — i18n core
//
// Usage:
//   import { t } from "../i18n";
//   t("panel.title")                                      // → "🎛️ Action Deck"
//   t("settings.groups.alreadyExists", { name: "Work" }) // → '⚠️ "Work" already exists'
// =============================================================================

import type { Locale } from "./locales/en";
import en from "./locales/en";
import ja from "./locales/ja";

// Registered locales
const locales: Record<string, Locale> = { en, ja };

// Detect the active locale from Obsidian's moment instance
function detectLocale(): string {
  try {
    // Obsidian exposes locale info through window.moment
    const moment = (window as { moment?: { locale?: () => string } }).moment;
    const lang = moment?.locale?.() ?? "en";
    // Normalize formats like "ja-JP" → "ja"
    const base = lang.split("-")[0].toLowerCase();
    return locales[base] ? base : "en";
  } catch {
    return "en";
  }
}

// Recursive helper that resolves a dot-notation key path
type NestedValue = string | Record<string, unknown>;

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: NestedValue = obj;
  for (const key of keys) {
    if (typeof current !== "object" || current === null) return undefined;
    current = current[key] as NestedValue;
  }
  return typeof current === "string" ? current : undefined;
}

// Variable interpolation: "Hello {name}" + { name: "World" } → "Hello World"
function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/**
 * Returns the translated string for the given key.
 *
 * @param key  Dot-notation key (e.g. "settings.groups.addBtn")
 * @param vars Variable map for interpolation (e.g. { name: "Work" })
 * @returns    Translated string, falling back to English then the raw key
 */
export function t(key: string, vars?: Record<string, string>): string {
  const locale = detectLocale();
  const dict = locales[locale] as unknown as Record<string, unknown>;
  const enDict = en as unknown as Record<string, unknown>;

  // Priority: current locale → English fallback → raw key
  const value = getByPath(dict, key)
    ?? getByPath(enDict, key)
    ?? key;

  return interpolate(value, vars);
}

/**
 * Returns the currently active locale code (e.g. "en", "ja").
 */
export function currentLocale(): string {
  return detectLocale();
}

/**
 * Dynamically registers a new locale (for future extension).
 * @example addLocale("zh", zhTranslations)
 */
export function addLocale(code: string, translations: Locale): void {
  locales[code] = translations;
}

// Typed key union for editor autocompletion (TypeScript 4.1+ template literal types)
// When you write t("settings.buttons.addBtn"), the editor will suggest valid keys
export type TranslationKey = DotPaths<Locale>;

type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends Record<string, unknown>
      ? DotPaths<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`
    : never;
}[keyof T];

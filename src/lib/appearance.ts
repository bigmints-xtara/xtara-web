// Temporary release policy; saved preferences and dark styling remain intact.
export const appearanceSelectionEnabled = false;

export type Appearance = "light" | "dark" | "system";

// Session-only state shared by settings and the root OS-preference listener.
// The saved preference is always loaded from the authenticated API.
let appearance: Appearance = "system";
let revision = 0;

export function normalizeAppearance(value: unknown): Appearance {
  return value === "light" || value === "dark" ? value : "system";
}

export function syncAppearance(): void {
  if (typeof window === "undefined") return;
  const dark = appearanceSelectionEnabled && (appearance === "dark" || (
    appearance === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
  ));
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function applyTheme(value: unknown): void {
  appearance = normalizeAppearance(value);
  revision += 1;
  syncAppearance();
}

export function appearanceRevision(): number {
  return revision;
}

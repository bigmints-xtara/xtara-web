// Launch only reviewed regional-language journeys.
export const locales = ["en", "ml", "hi", "ta"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "xtara_locale";
export const localeStorageKey = "xtara_locale";

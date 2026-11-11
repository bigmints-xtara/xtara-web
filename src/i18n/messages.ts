import en from "@/content/en.json";
import hi from "@/content/hi.json";
import ml from "@/content/ml.json";
import ta from "@/content/ta.json";
import type { Locale } from "./config";

export type Messages = Omit<typeof en, "terms"> & Partial<Pick<typeof en, "terms">>;

export const defaultMessages = en;

const messagesByLocale: Record<Locale, Messages> = {
  en,
  hi,
  ml,
  ta,
};

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale.en;
}

"use client";

import { useId } from "react";
import { Languages } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locales, type Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/language-provider";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslations();
  const selectId = useId();
  const label = t("languageSwitcher.label");
  const shortLocale = locale === "ml" ? "മല" : locale === "hi" ? "HI" : locale === "ta" ? "த" : "EN";

  return (
    <div className="flex items-center">
      <label htmlFor={selectId} className="sr-only">{label}</label>
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger
          id={selectId}
          size="sm"
          aria-label={label}
          className="h-10 w-[78px] rounded-full border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 shadow-none transition-colors hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-primary/30 sm:w-[84px]"
        >
          <Languages aria-hidden="true" className="size-4 text-slate-500" />
          <span aria-hidden="true">{shortLocale}</span>
          <SelectValue className="sr-only" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(`languageSwitcher.options.${loc}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

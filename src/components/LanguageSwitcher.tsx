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
          size="default"
          aria-label={label}
          className="h-11 w-auto min-w-24 gap-2 rounded-full border-transparent bg-transparent px-3 text-sm font-medium text-foreground shadow-none transition-colors hover:border-border hover:bg-muted focus-visible:ring-primary/30"
        >
          <Languages aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span aria-hidden="true">{shortLocale}</span>
          <span className="sr-only"><SelectValue /></span>
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

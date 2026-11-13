"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/language-provider";

export function OrganizationLoading() {
  const { t } = useTranslations();
  return <main aria-busy="true" className="mx-auto max-w-7xl px-5 py-10">
    <div role="status" className="flex items-center gap-3 text-muted-foreground">
      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />{t("organizationNavigation.loading")}
    </div>
    <div aria-hidden="true" className="mt-8 space-y-6 motion-safe:animate-pulse">
      <div className="h-36 rounded-3xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-24 rounded-2xl bg-muted" />)}</div>
      <div className="h-64 rounded-2xl bg-muted" />
    </div>
  </main>;
}

export function OrganizationError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslations();
  return <main className="mx-auto max-w-xl px-5 py-16">
    <h1 className="text-2xl font-semibold">{t("organizationNavigation.error")}</h1>
    <p role="alert" className="mt-4 text-muted-foreground">{message}</p>
    <Button className="mt-6" onClick={onRetry}>{t("organizationNavigation.retry")}</Button>
  </main>;
}

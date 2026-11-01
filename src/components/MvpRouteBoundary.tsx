"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/language-provider";
import { isMvpDeferredRoute, mvpNavigationCopy } from "@/lib/mvp-navigation";

export default function MvpRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale } = useTranslations();
  if (!isMvpDeferredRoute(pathname)) return children;
  const copy = mvpNavigationCopy[locale];
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="mx-auto max-w-2xl px-5 py-16 pb-28">
      <h1 className="text-2xl font-semibold">{copy.unavailable}</h1>
      <p className="mt-4 text-muted-foreground">{copy.unavailableHelp}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/dashboard">{copy.returnToDirection}</Link></Button>
        <Button asChild variant="outline"><Link href="/explore">{copy.exploreCareers}</Link></Button>
      </div>
    </main>
  </div>;
}

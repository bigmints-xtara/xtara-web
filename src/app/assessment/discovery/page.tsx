"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, ChevronDown, Compass,
} from "lucide-react";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/language-provider";
import { useAuth } from "@/context/AuthContext";
import {
  assessmentV2StorageKey,
  getDistinctAreaReasons,
  getAssessmentV2Catalog,
  localizeDiscoveryResult,
  parseDiscoveryResult,
} from "@/lib/assessment-v2";
import { loadDirectionPlan, saveDirectionPlan, switchCareerDirection } from "@/lib/direction";
import { saveDirectionToApi } from "@/lib/direction-api";

function subscribeToLocalResult(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("xtara:assessment-result-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("xtara:assessment-result-changed", onChange);
  };
}

export default function DiscoveryResultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const catalog = getAssessmentV2Catalog(locale);
  const rawResult = useSyncExternalStore(
    subscribeToLocalResult,
    () => localStorage.getItem(assessmentV2StorageKey),
    () => null,
  );
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const result = useMemo(
    () => storedResult ? localizeDiscoveryResult(storedResult, locale) : null,
    [locale, storedResult],
  );
  const reasonsByArea = useMemo(
    () => getDistinctAreaReasons(result?.areas ?? []),
    [result?.areas],
  );

  if (!result || !storedResult) {
    return (
      <div className="min-h-screen bg-[#f7fafc]"><Header />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <Compass className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-5 text-2xl font-semibold text-primary">{catalog.result.emptyTitle}</h1>
          <Button asChild className="mt-6 rounded-full"><Link href="/assessment">{catalog.ui.title}</Link></Button>
        </main>
      </div>
    );
  }

  const pursueArea = async (areaId: string) => {
    const plan = switchCareerDirection(loadDirectionPlan(), areaId);
    saveDirectionPlan(plan);
    if (user && !user.isAnonymous) {
      try {
        saveDirectionPlan(await saveDirectionToApi(plan));
      } catch {
        // Keep the selected area locally until account sync is available again.
      }
    }
    router.push(`/explore/areas/${areaId}`);
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground"><Header />
      <main className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-5xl">{catalog.result.title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{catalog.result.description}</p>
          </div>

          <section className="mt-8 sm:mt-10" aria-label={catalog.result.areasLabel}>
            <h2 className="sr-only">{catalog.result.areasLabel}</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {result.areas.map((area) => (
                <Card key={area.id} className="border-primary/10 bg-white shadow-none"><CardContent className="flex h-full flex-col p-6 sm:p-7">
                  <h3 className="text-2xl font-semibold text-primary">{area.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{area.description}</p>
                  {reasonsByArea[area.id]?.length ? <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-sm font-semibold text-primary">{catalog.result.why}</p><ul className="mt-3 space-y-3">{reasonsByArea[area.id].map((reason) => <li key={reason} className="flex gap-3 text-sm leading-6 text-slate-600"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />{reason}</li>)}</ul></div> : null}
                  <Button type="button" className="mt-7 min-h-12 w-full justify-between rounded-xl" aria-label={`${catalog.result.viewArea}: ${area.title}`} onClick={() => pursueArea(area.id)}>{catalog.result.viewArea}<ArrowRight className="h-4 w-4" /></Button>
                </CardContent></Card>
              ))}
            </div>
          </section>

          <div className="mt-8 border-y border-primary/10 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div><h2 className="font-semibold text-primary">{catalog.result.reflectionTitle}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{catalog.result.reflectionDescription}</p></div>
            <Link href="/assessment" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline sm:mt-0 sm:shrink-0">{catalog.result.edit}<ArrowRight className="h-4 w-4" /></Link>
          </div>

          <details className="group mt-8 rounded-2xl border border-primary/10 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left sm:p-6">
              <span><span className="block font-semibold text-primary">{catalog.result.detailsTitle}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{catalog.result.detailsDescription}</span></span>
              <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-8 border-t border-primary/10 p-5 sm:p-6 lg:grid-cols-3">
              {result.signals.length ? <section aria-labelledby="patterns-title"><h2 id="patterns-title" className="font-semibold text-primary">{catalog.result.patternsTitle}</h2><ul className="mt-4 space-y-4">{result.signals.map((signal) => <li key={signal.id}><h3 className="text-sm font-semibold text-slate-800">{signal.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{signal.description}</p></li>)}</ul></section> : null}
              {result.traits.length ? <section aria-labelledby="traits-title"><h2 id="traits-title" className="font-semibold text-primary">{catalog.result.traitsTitle}</h2><ul className="mt-4 space-y-4">{result.traits.map((trait) => <li key={trait.id}><h3 className="text-sm font-semibold text-slate-800">{trait.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{trait.description}</p></li>)}</ul></section> : null}
              {result.contextSummary.family || result.contextSummary.weaknesses.length ? <section aria-labelledby="context-title"><h2 id="context-title" className="font-semibold text-primary">{catalog.result.contextTitle}</h2>{result.contextSummary.family ? <p className="mt-4 text-sm leading-6 text-slate-600">{result.contextSummary.family}</p> : null}{result.contextSummary.weaknesses.length ? <ul className="mt-4 space-y-3">{result.contextSummary.weaknesses.map((summary) => <li key={summary} className="text-sm leading-6 text-slate-600">{summary}</li>)}</ul> : null}</section> : null}
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}

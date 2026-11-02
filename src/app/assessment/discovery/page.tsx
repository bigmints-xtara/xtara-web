"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, ChevronDown, Compass,
} from "lucide-react";

import styles from '@/components/journey/journey.module.css';
import JourneySteps from '@/components/journey/JourneySteps';
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
  const [saveError, setSaveError] = useState(false);
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
    setSaveError(false);
    try {
      saveDirectionPlan(user && !user.isAnonymous ? await saveDirectionToApi(plan) : plan);
      router.push(`/explore/areas/${areaId}`);
    } catch {
      setSaveError(true);
    }
  };

  return (
    <div className={styles.surface}><Header />
      <main className={styles.shell}>
        <JourneySteps step={1} locale={locale} />
        <div className="mx-auto max-w-6xl">
          <div className={styles.resultsHeader}><div>
            <h1 className={styles.heading}>{catalog.result.title}</h1>
            <p className={styles.intro}>{catalog.result.description}</p>
          </div><span className={styles.compass} aria-hidden="true"><Compass size={52} strokeWidth={1.3} /></span></div>

          {saveError ? <p role="alert">{catalog.ui.errorTitle} {catalog.ui.retry}</p> : null}
          <section className="mt-8 sm:mt-10" aria-label={catalog.result.areasLabel}>
            <h2 className="sr-only">{catalog.result.areasLabel}</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              {result.areas.map((area) => (
                <Card key={area.id} className={styles.resultCard}><CardContent className={styles.resultBody}>
                  <span className={styles.motif} aria-hidden="true"><Compass size={26} strokeWidth={1.5} /></span>
                  <h3 className="text-2xl font-semibold text-primary">{area.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{area.description}</p>
                  {area.roles.length ? (
                    <ul className="mt-5 space-y-2" aria-label={`${area.title} careers`}>
                      {area.roles.slice(0, 3).map((career) => (
                        <li key={career.id} className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          {career.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {reasonsByArea[area.id]?.length ? <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-sm font-semibold text-primary">{catalog.result.why}</p><ul className="mt-3 space-y-3">{reasonsByArea[area.id].map((reason) => <li key={reason} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />{reason}</li>)}</ul></div> : null}
                  <Button type="button" className="mt-7 min-h-12 w-full justify-between rounded-xl" aria-label={`${catalog.result.viewArea}: ${area.title}`} onClick={() => pursueArea(area.id)}>{catalog.result.viewArea}<ArrowRight className="h-4 w-4" /></Button>
                </CardContent></Card>
              ))}
            </div>
          </section>

          <div className="mt-8 border-y border-primary/10 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div><h2 className="font-semibold text-primary">{catalog.result.reflectionTitle}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{catalog.result.reflectionDescription}</p></div>
            <Link href="/assessment" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline sm:mt-0 sm:shrink-0">{catalog.result.edit}<ArrowRight className="h-4 w-4" /></Link>
          </div>

          <details className="group mt-8 rounded-2xl border border-primary/10 bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left sm:p-6">
              <span><span className="block font-semibold text-primary">{catalog.result.detailsTitle}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{catalog.result.detailsDescription}</span></span>
              <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-8 border-t border-primary/10 p-5 sm:p-6 lg:grid-cols-3">
              {result.signals.length ? <section aria-labelledby="patterns-title"><h2 id="patterns-title" className="font-semibold text-primary">{catalog.result.patternsTitle}</h2><ul className="mt-4 space-y-4">{result.signals.map((signal) => <li key={signal.id}><h3 className="text-sm font-semibold text-foreground">{signal.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.description}</p></li>)}</ul></section> : null}
              {result.traits.length ? <section aria-labelledby="traits-title"><h2 id="traits-title" className="font-semibold text-primary">{catalog.result.traitsTitle}</h2><ul className="mt-4 space-y-4">{result.traits.map((trait) => <li key={trait.id}><h3 className="text-sm font-semibold text-foreground">{trait.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{trait.description}</p></li>)}</ul></section> : null}
              {result.contextSummary.family || result.contextSummary.weaknesses.length ? <section aria-labelledby="context-title"><h2 id="context-title" className="font-semibold text-primary">{catalog.result.contextTitle}</h2>{result.contextSummary.family ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{result.contextSummary.family}</p> : null}{result.contextSummary.weaknesses.length ? <ul className="mt-4 space-y-3">{result.contextSummary.weaknesses.map((summary) => <li key={summary} className="text-sm leading-6 text-muted-foreground">{summary}</li>)}</ul> : null}</section> : null}
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}

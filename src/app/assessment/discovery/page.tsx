"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ChevronDown, ChevronRight, Compass, Ellipsis,
} from "lucide-react";

import { ExplorerScene, explorerTone } from '@/components/careers/explorer/ExplorerScene';
import { useCareerExplorer } from '@/components/careers/explorer/useCareerExplorer';
import { journeyCopy } from '@/components/careers/explorer/journey-copy';
import { resolveExplorerDirection } from '@/lib/career-direction-imagery';
import explorer from '@/components/careers/ExploreCareers.module.css';
import design from '@/components/journey/ExplorerJourney.module.css';
import styles from '@/components/journey/journey.module.css';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const resultsCopy = {
  en: { heading: "Choose a direction", explore: "Explore", details: "Details", insights: "Assessment insights", all: "View all careers", more: "More options" },
  ml: { heading: "ഒരു ദിശ തിരഞ്ഞെടുക്കൂ", explore: "കൂടുതൽ അറിയാം", details: "വിശദാംശങ്ങൾ", insights: "അസസ്‌മെന്റ് കണ്ടെത്തലുകൾ", all: "എല്ലാ കരിയറുകളും കാണാം", more: "കൂടുതൽ ഓപ്ഷനുകൾ" },
  hi: { heading: "एक दिशा चुनें", explore: "देखें", details: "जानकारी", insights: "आकलन की जानकारी", all: "सभी करियर देखें", more: "और विकल्प" },
  ta: { heading: "ஒரு திசையைத் தேர்ந்தெடுங்கள்", explore: "ஆராயுங்கள்", details: "விவரங்கள்", insights: "மதிப்பீட்டுக் குறிப்புகள்", all: "அனைத்துத் தொழில்களையும் பாருங்கள்", more: "மேலும் விருப்பங்கள்" },
} as const;

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
  const copy = resultsCopy[locale];
  const { data: publicExplorer } = useCareerExplorer(locale);
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

  if (!result?.areas.length || !storedResult) {
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
      router.push(`/assessment/careers/${areaId}`);
    } catch {
      setSaveError(true);
    }
  };

  return (
    <div className={styles.surface}><Header />
      <main className={`${explorer.explorer} ${design.shell} ${design.resultsShell}`}>
        <div className="mx-auto max-w-6xl">
          <header className={design.intro}>
            <h1 className={design.heading}>{copy.heading}</h1>
          </header>

          {saveError && <p role="alert">{catalog.ui.errorTitle} {catalog.ui.retry}</p>}
          <section className={design.recommendations} aria-label={catalog.result.areasLabel}>
            {result.areas.map((area, index) => {
              const direction = resolveExplorerDirection(publicExplorer?.directions, area.id);
              const featured = index === 0;
              const reasons = reasonsByArea[area.id] ?? [];
              const catalogueHref = `/explore?${new URLSearchParams({ direction: direction?.id ?? area.id, step: 'roles' })}`;

              const select = () => void pursueArea(area.id);

              return (
                <article key={area.id} className={design.recommendation} data-featured={featured}
                  style={explorerTone(direction?.presentation)} aria-labelledby={`result-${area.id}`}>
                  <div className={design.recommendationArt}>
                    <ExplorerScene illustration={direction?.illustration} placeholder={journeyCopy[locale].illustration}
                      bubble decorative sizes={featured ? '(max-width: 600px) 104px, 320px' : '64px'} />
                  </div>
                  <div className={design.recommendationCopy}>
                    <h2 id={`result-${area.id}`}>
                      {featured ? area.title : (
                        <button type="button" className={design.directionPick} onClick={select}>
                          <span>{area.title}</span><ChevronRight size={17} aria-hidden="true" />
                        </button>
                      )}
                    </h2>
                    <div className={design.actions}>
                      {featured ? (
                        <Button type="button" className={design.action} aria-label={`${copy.explore}: ${area.title}`} onClick={select}>
                          {copy.explore}<ArrowRight size={16} aria-hidden="true" />
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className={design.resultsMenu}
                            aria-label={`${copy.more}: ${area.title}`}>
                            <Ellipsis size={20} aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={design.catalogueMenu}>
                          <DropdownMenuItem asChild><Link href={catalogueHref}>{copy.all}</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {!!(area.description || reasons.length || area.roles.length) && (
                      <details className={design.evidence}>
                        <summary>{copy.details}</summary>
                        {area.description && <p className={design.directionDescription}>{area.description}</p>}
                        {reasons.length > 0 && (
                          <div className={design.directionReasons}>
                            <h3>{catalog.result.why}</h3>
                            <ul className={design.reasons}>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
                          </div>
                        )}
                        {area.roles.length > 0 && (
                          <ul className={design.exampleCareers} aria-label={`${area.title} careers`}>
                            {area.roles.slice(0, 3).map(career => <li key={career.id}>{career.title}</li>)}
                          </ul>
                        )}
                      </details>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <Link href="/assessment" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            {catalog.result.edit}<ArrowRight size={16} aria-hidden="true" />
          </Link>

          {(result.signals.length > 0 || result.traits.length > 0 || result.contextSummary.family || result.contextSummary.weaknesses.length > 0) && (
            <details className="group mt-4 rounded-xl border border-primary/10 bg-card">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 text-left text-sm font-semibold text-primary">
                {copy.insights}
              <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="grid gap-8 border-t border-primary/10 p-5 sm:p-6 lg:grid-cols-3">
                {result.signals.length ? <section aria-labelledby="patterns-title"><h2 id="patterns-title" className="font-semibold text-primary">{catalog.result.patternsTitle}</h2><ul className="mt-4 space-y-4">{result.signals.map((signal) => <li key={signal.id}><h3 className="text-sm font-semibold text-foreground">{signal.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.description}</p></li>)}</ul></section> : null}
                {result.traits.length ? <section aria-labelledby="traits-title"><h2 id="traits-title" className="font-semibold text-primary">{catalog.result.traitsTitle}</h2><ul className="mt-4 space-y-4">{result.traits.map((trait) => <li key={trait.id}><h3 className="text-sm font-semibold text-foreground">{trait.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{trait.description}</p></li>)}</ul></section> : null}
                {result.contextSummary.family || result.contextSummary.weaknesses.length ? <section aria-labelledby="context-title"><h2 id="context-title" className="font-semibold text-primary">{catalog.result.contextTitle}</h2>{result.contextSummary.family ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{result.contextSummary.family}</p> : null}{result.contextSummary.weaknesses.length ? <ul className="mt-4 space-y-3">{result.contextSummary.weaknesses.map((summary) => <li key={summary} className="text-sm leading-6 text-muted-foreground">{summary}</li>)}</ul> : null}</section> : null}
              </div>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}

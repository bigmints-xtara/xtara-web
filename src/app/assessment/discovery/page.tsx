"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ChevronDown, Compass, Ellipsis,
} from "lucide-react";

import { ExplorerScene, explorerTone } from '@/components/careers/explorer/ExplorerScene';
import { useCareerExplorer } from '@/components/careers/explorer/useCareerExplorer';
import { journeyCopy } from '@/components/careers/explorer/journey-copy';
import { resolveExplorerDirection } from '@/lib/career-direction-imagery';
import explorer from '@/components/careers/ExploreCareers.module.css';
import design from '@/components/journey/ExplorerJourney.module.css';
import styles from '@/components/journey/journey.module.css';
import JourneySteps from '@/components/journey/JourneySteps';
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

const browseCopy = {
  en: { all: "View all careers in this direction", more: "More options" },
  ml: { all: "ഈ ദിശയിലെ എല്ലാ കരിയറുകളും കാണാം", more: "കൂടുതൽ ഓപ്ഷനുകൾ" },
  hi: { all: "इस दिशा के सभी करियर देखें", more: "और विकल्प" },
  ta: { all: "இந்தத் திசையில் உள்ள அனைத்துத் தொழில்களையும் பாருங்கள்", more: "மேலும் விருப்பங்கள்" },
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
  const browse = browseCopy[locale];
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
          <div className={design.resultsProgress}><JourneySteps step={1} locale={locale} /></div>
          <header className={design.intro}>
            <h1 className={design.heading}>{{ en: "Choose a Career Direction to explore.", ml: "അറിയാൻ ഒരു കരിയർ ദിശ തിരഞ്ഞെടുക്കൂ.", hi: "खोजने के लिए एक करियर दिशा चुनें।", ta: "ஆராய ஒரு தொழில் திசையைத் தேர்ந்தெடுங்கள்." }[locale]}</h1>
            <p className={styles.intro}>{catalog.result.description}</p>
          </header>

          {saveError && <p role="alert">{catalog.ui.errorTitle} {catalog.ui.retry}</p>}
          <section className={design.recommendations} aria-label={catalog.result.areasLabel}>
            {result.areas.map((area, index) => {
              const direction = resolveExplorerDirection(publicExplorer?.directions, area.id);
              const featured = index === 0;
              const reasons = reasonsByArea[area.id] ?? [];
              const evidence = <ul className={design.reasons}>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>;
              const catalogueHref = `/explore?${new URLSearchParams({ direction: direction?.id ?? area.id, step: 'roles' })}`;

              return (
                <article key={area.id} className={design.recommendation} data-featured={featured}
                  style={explorerTone(direction?.presentation)} aria-labelledby={`result-${area.id}`}>
                  <div className={design.recommendationArt}>
                    <ExplorerScene illustration={direction?.illustration} placeholder={journeyCopy[locale].illustration}
                      bubble decorative sizes={featured ? '(max-width: 600px) 104px, 320px' : '64px'} />
                  </div>
                  <div className={design.recommendationCopy}>
                    <h2 id={`result-${area.id}`}>{area.title}</h2>
                    <p>{area.description}</p>
                    <div className={design.actions}>
                      <Button type="button" className={design.action} aria-label={`${catalog.result.viewArea}: ${area.title}`}
                        variant={featured ? 'default' : 'outline'} onClick={() => void pursueArea(area.id)}>
                        {catalog.result.viewArea}<ArrowRight size={16} aria-hidden="true" />
                      </Button>
                      <Link className={design.browseLink} href={catalogueHref}>
                        {browse.all}<ArrowRight size={16} aria-hidden="true" />
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className={design.resultsMenu}
                            aria-label={`${browse.more}: ${area.title}`}>
                            <Ellipsis size={20} aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={design.catalogueMenu}>
                          <DropdownMenuItem asChild><Link href={catalogueHref}>{browse.all}</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {reasons.length > 0 && (
                      <details className={design.evidence}><summary>{catalog.result.why}</summary>{evidence}</details>
                    )}
                    {area.roles.length > 0 && (
                      <ul className={design.exampleCareers} aria-label={`${area.title} careers`}>
                        {area.roles.slice(0, 3).map(career => <li key={career.id}>{career.title}</li>)}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
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

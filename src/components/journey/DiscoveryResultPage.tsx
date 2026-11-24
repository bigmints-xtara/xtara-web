"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, CircleCheck, Compass,
} from "lucide-react";

import VisualCarousel from "@/components/careers/explorer/VisualCarousel";
import { ExplorerScene, explorerTone } from '@/components/careers/explorer/ExplorerScene';
import { useCareerExplorer } from '@/components/careers/explorer/useCareerExplorer';
import { journeyCopy } from '@/components/careers/explorer/journey-copy';
import { resolveExplorerDirection } from '@/lib/career-direction-imagery';
import explorer from '@/components/careers/ExploreCareers.module.css';
import design from '@/components/journey/ExplorerJourney.module.css';
import styles from '@/components/journey/journey.module.css';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
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
import { getDirectionFromApi, saveDirectionToApi } from "@/lib/direction-api";
import { discoveryCacheOwnerKey, markDiscoveryCacheOwner } from "@/lib/discovery-cache-owner";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import { hydrateDiscoveryFromAccount } from "@/lib/discovery-save";

const resultsCopy = {
  en: {
    heading: "Choose a direction",
    title: "Your career starting points",
    completed: "Assessment complete",
    lead: "Your answers pointed to these career directions. Start with one that interests you and see the Dream Careers you could explore.",
    choose: "Choose this direction",
    examples: "Careers you could explore",
    insights: "Assessment insights",
    all: "View all careers",
  },
  ml: {
    heading: "ഒരു ദിശ തിരഞ്ഞെടുക്കൂ",
    title: "കരിയർ അന്വേഷണത്തിന് ഒരു തുടക്കം",
    completed: "അസസ്‌മെന്റ് പൂർത്തിയായി",
    lead: "നിങ്ങളുടെ ഉത്തരങ്ങൾ ഈ കരിയർ മേഖലകളിലേക്കാണ് വിരൽ ചൂണ്ടുന്നത്. താൽപ്പര്യമുള്ള ഒരു മേഖലയിൽ നിന്ന് തുടങ്ങി അതിലെ സ്വപ്ന കരിയറുകളെ പരിചയപ്പെടൂ.",
    choose: "ഈ ദിശ തിരഞ്ഞെടുക്കൂ",
    examples: "പരിചയപ്പെടാവുന്ന കരിയറുകൾ",
    insights: "അസസ്‌മെന്റ് കണ്ടെത്തലുകൾ",
    all: "എല്ലാ കരിയറുകളും കാണാം",
  },
  hi: {
    heading: "एक दिशा चुनें",
    title: "आपके करियर की शुरुआत",
    completed: "आकलन पूरा हुआ",
    lead: "आपके जवाब इन करियर दिशाओं की ओर इशारा करते हैं। जो दिशा दिलचस्प लगे, उससे शुरू करें और उसमें अपने ड्रीम करियर खोजें।",
    choose: "यह दिशा चुनें",
    examples: "करियर जिन्हें आप जान सकते हैं",
    insights: "आकलन की जानकारी",
    all: "सभी करियर देखें",
  },
  ta: {
    heading: "ஒரு திசையைத் தேர்ந்தெடுங்கள்",
    title: "உங்கள் தொழில் தேடலின் தொடக்கம்",
    completed: "மதிப்பீடு முடிந்தது",
    lead: "உங்கள் பதில்கள் இந்தத் தொழில் திசைகளைக் காட்டுகின்றன. உங்களுக்கு ஆர்வமுள்ள ஒரு திசையிலிருந்து தொடங்கி, அதில் உள்ள கனவுத் தொழில்களைப் பாருங்கள்.",
    choose: "இந்தத் திசையைத் தேர்ந்தெடுக்கவும்",
    examples: "நீங்கள் அறிந்துகொள்ளக்கூடிய தொழில்கள்",
    insights: "மதிப்பீட்டுக் குறிப்புகள்",
    all: "அனைத்துத் தொழில்களையும் பாருங்கள்",
  },
} as const;

function subscribeToLocalResult(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("xtara:assessment-result-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("xtara:assessment-result-changed", onChange);
  };
}

export default function DiscoveryResultPage({ choosing = false }: { choosing?: boolean }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const owner = user && !user.isAnonymous ? user.uid : null;
  const { locale } = useTranslations();
  const catalog = getAssessmentV2Catalog(locale);
  const copy = resultsCopy[locale];
  const { data: publicExplorer } = useCareerExplorer(locale);
  const rawResult = useSyncExternalStore(
    subscribeToLocalResult,
    () => localStorage.getItem(discoveryCacheOwnerKey) === owner
      ? localStorage.getItem(assessmentV2StorageKey)
      : null,
    () => null,
  );
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const result = useMemo(
    () => storedResult ? localizeDiscoveryResult(storedResult, locale) : null,
    [locale, storedResult],
  );
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const scope = useRef(owner);
  scope.current = owner;
  const [readback, setReadback] = useState<{ owner: string; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reasonsByArea = useMemo(
    () => getDistinctAreaReasons(result?.areas ?? []),
    [result?.areas],
  );

  useEffect(() => {
    if (loading || !owner || storedResult?.areas.length) return;
    let active = true;
    hydrateDiscoveryFromAccount().then(() => {
      if (active) setReadback({ owner, failed: false });
    }).catch(() => {
      if (active) setReadback({ owner, failed: true });
    });
    return () => { active = false; };
  }, [attempt, loading, owner, storedResult]);

    const waiting = loading || (owner !== null && !storedResult && readback?.owner !== owner);
  const loadFailed = owner !== null && !storedResult && readback?.owner === owner && readback.failed;
  if (waiting || loadFailed || !result?.areas.length || !storedResult) {
    return (
      <div className={styles.surface}><Header />
        <main className={`${explorer.explorer} ${design.shell} ${design.resultsShell}`}>
          <div className={design.resultStatus} aria-busy={waiting}>
            <Compass className={design.statusIcon} aria-hidden="true" />
            {waiting ? <p role="status">{catalog.ui.loading}</p> : loadFailed ? (
              <>
                <h1 role="alert">{catalog.ui.errorTitle}</h1>
                <Button onClick={() => {
                  setReadback(null);
                  setAttempt(value => value + 1);
                }}>{catalog.ui.retry}</Button>
              </>
            ) : (
              <>
                <h1>{catalog.result.emptyTitle}</h1>
                <Button asChild><Link href="/assessment">{catalog.ui.startAssessment}</Link></Button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  const publishedCareers = new Map(publicExplorer?.careers?.map(career => [career.id, career]));

  const pursueArea = async (areaId: string) => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const current = owner ? await getDirectionFromApi(owner) : loadDirectionPlan();
      if (scope.current !== owner) return;
      const plan = switchCareerDirection(current, areaId);
      const saved = owner ? await saveDirectionToApi(plan, owner) : plan;
      if (scope.current !== owner) return;
      if (owner) markDiscoveryCacheOwner(owner);
      saveDirectionPlan(saved);
      router.push(`/assessment/careers/${encodeURIComponent(areaId)}`);
    } catch {
      if (scope.current === owner) setSaveError(true);
    } finally {
      if (scope.current === owner) setSaving(false);
    }
  };

  return (
    <div className={styles.surface}><Header />
      <main className={`${explorer.explorer} ${design.shell} ${design.resultsShell}`}>
        <div className={choosing ? "site-frame" : design.resultFrame}>
          {choosing && <Link className={styles.overviewLink} href="/dashboard"><ArrowLeft size={16} />{mvpNavigationCopy[locale].myDirection}</Link>}
          <header className={choosing ? design.intro : design.resultIntro}>
            {!choosing && <p className={design.completion}><CircleCheck size={18} aria-hidden="true" />{copy.completed}</p>}
            <h1 className={design.heading}>{choosing ? copy.heading : copy.title}</h1>
            {!choosing && <p className={design.resultLead}>{copy.lead}</p>}
          </header>

          {saveError && <p role="alert">{catalog.ui.errorTitle} {catalog.ui.retry}</p>}
          {choosing ? <VisualCarousel items={result.areas.map(area => ({ id: area.id, title: area.title === area.id ? resolveExplorerDirection(publicExplorer?.directions, area.id)?.title || area.title : area.title }))} variant="direction" label={catalog.result.areasLabel}
            previous={journeyCopy[locale].previous} next={journeyCopy[locale].next} hint={journeyCopy[locale].swipe}
            renderItem={(index, active) => {
              const area = result.areas[index];
              const direction = resolveExplorerDirection(publicExplorer?.directions, area.id);
              const title = area.title === area.id ? direction?.title || area.title : area.title;
              return <div className={explorer.choiceBody} style={explorerTone(direction?.presentation)}>
                <ExplorerScene illustration={direction?.illustration} placeholder={journeyCopy[locale].illustration} decorative />
                <div className={explorer.cardCopy}><h2>{title}</h2><p>{area.description || direction?.summary}</p>
                  <Button variant="surface" className={explorer.cardAction} disabled={saving} style={{ visibility: active ? "visible" : "hidden" }}
                    aria-label={copy.choose + ": " + title} onClick={() => void pursueArea(owner ? direction?.id ?? area.id : area.id)}>
                    {copy.choose}<ArrowRight aria-hidden="true" size={16} />
                  </Button>
                </div>
              </div>;
            }} /> : (
          <section className={design.recommendations} aria-label={catalog.result.areasLabel}>
            {result.areas.map((area, index) => {
              const direction = resolveExplorerDirection(publicExplorer?.directions, area.id);
              const title = area.title === area.id ? direction?.title || area.title : area.title;
              const description = area.description || direction?.summary;
              const featured = index === 0;
              const reasons = reasonsByArea[area.id] ?? [];
              const roleIds = area.roleIds.length ? area.roleIds : direction?.careerIds ?? [];
              const roles = area.roles.length ? area.roles : roleIds.flatMap(id => {
                const career = publishedCareers.get(id);
                return career ? [career] : [];
              });
              const catalogueHref = `/explore?${new URLSearchParams({ direction: direction?.id ?? area.id, step: 'roles' })}`;

              return (
                <article key={area.id} className={design.recommendation} data-featured={featured}
                  style={explorerTone(direction?.presentation)} aria-labelledby={`result-${area.id}`}>
                  <div className={design.recommendationHeader}>
                    <div className={design.recommendationArt}>
                      <ExplorerScene illustration={direction?.illustration} placeholder={journeyCopy[locale].illustration}
                        bubble decorative sizes="(max-width: 600px) 80px, 132px" />
                    </div>
                    <h2 id={`result-${area.id}`}>{title}</h2>
                  </div>
                  <div className={design.recommendationCopy}>
                    {description && <p className={design.directionDescription}>{description}</p>}
                    {(reasons.length > 0 || roles.length > 0) && <div className={design.recommendationSupport}>
                      {reasons.length > 0 && (
                        <div className={design.recommendationDetails}>
                          <h3>{catalog.result.why}</h3>
                          <ul className={design.reasons}>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
                        </div>
                      )}
                      {roles.length > 0 && (
                        <div className={design.recommendationDetails}>
                          <h3>{copy.examples}</h3>
                          <ul className={design.exampleCareers} aria-label={`${title} · ${copy.examples}`}>
                            {roles.slice(0, 3).map(career => <li key={career.id}>{career.title}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>}
                  </div>
                  <div className={design.actions}>
                    <Button type="button" variant={featured ? "default" : "outline"} className={design.action}
                      aria-label={`${copy.choose}: ${title}`}
                      onClick={() => void pursueArea(owner ? direction?.id ?? area.id : area.id)} disabled={saving}>
                      {copy.choose}<ArrowRight size={16} aria-hidden="true" />
                    </Button>
                    <Link className={design.resultLink} href={catalogueHref} aria-label={`${copy.all}: ${title}`}>
                      {copy.all}<ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
          )}

          {!choosing && <Link href="/assessment" className={design.reviewAnswers}>
            {catalog.result.edit}<ArrowRight size={16} aria-hidden="true" />
          </Link>}

          {!choosing && (result.signals.length > 0 || result.traits.length > 0 || result.contextSummary.family || result.contextSummary.weaknesses.length > 0) && (
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

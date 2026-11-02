"use client";

import DirectionImage from "@/components/journey/DirectionImage";
import styles from '@/components/journey/journey.module.css';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Compass,
  Ellipsis,
  MessageCircleMore,
} from "lucide-react";

import SlideshowOverlay from "@/components/career-path/SlideshowOverlay";
import WeeklyPlanCard from "@/components/home/WeeklyPlanCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { getAssessmentV2Catalog, assessmentV2StorageKey, localizeDiscoveryResult, parseDiscoveryResult } from "@/lib/assessment-v2";
import { getCareerRole } from "@/lib/career-knowledge";
import {
  type CareerConversationCareer,
  generateCareerConversationSlides,
} from "@/lib/career-slides-utils";
import { dashboardCopy } from "@/lib/dashboard-copy";
import { hydrateDiscoveryFromAccount } from "@/lib/discovery-save";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  subscribeToDirection,
  toggleDirectionAction,
  type DirectionActionId,
} from "@/lib/direction";
import { saveDirectionToApi } from "@/lib/direction-api";
import {
  getMyCareerPathExperience,
  recommendationHref,
  recordRecommendationEvent,
  type MyCareerPathExperience,
} from "@/lib/experience-api";
import { AchievementsService } from "@/lib/firebase/achievements-service";
import { getDirectionCourseQueries } from "@/lib/pathway-recommendations";
import type { CuratedDreamCareer } from "@/types/curated-career";

import { MVP_NAVIGATION_ENABLED, mvpNavigationCopy } from "@/lib/mvp-navigation";

type RewardSummary = { points: number; medals: number; level: string };

export default function UserDashboard() {
  const { user, userProfile } = useAuth();
  const { locale } = useTranslations();
  const text = dashboardCopy[locale];
  const [accountLoad, setAccountLoad] = useState<{ owner?: string; error: boolean }>({ error: false });
  const [retryAccount, setRetryAccount] = useState(0);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [rewards, setRewards] = useState<RewardSummary>({ points: 0, medals: 0, level: "Starter" });
  const [experience, setExperience] = useState<MyCareerPathExperience | null>(null);
  const impressedRecommendations = useRef(new Set<string>());
  const rawResult = useSyncExternalStore(subscribeToDiscovery, () => localStorage.getItem(assessmentV2StorageKey), () => null);
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, () => null);
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const result = useMemo(() => storedResult ? localizeDiscoveryResult(storedResult, locale) : null, [locale, storedResult]);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);
  const focusedDirection = result?.areas.find((area) => area.id === plan?.areaId) ?? null;
  const selectedCareers = useMemo(() => {
    const graph = storedResult?.catalogSnapshot;
    if (!graph) return focusedDirection?.roles.filter((career) => plan?.dreamCareerIds.includes(career.id)) ?? [];
    const direction = graph.directions.find((item) => item.id === plan?.areaId);
    return (plan?.dreamCareerIds ?? []).flatMap((id) => {
      const career = graph.roles.find((item) => item.id === id);
      if (!career || !direction?.roleIds.includes(id) || !career.futureDirectionIds.includes(direction.id)) return [];
      const translation = career.translations[locale] || career.translations.en;
      return [{ id, title: translation.title, summary: translation.summary }];
    });
  }, [storedResult, focusedDirection, plan, locale]);
  const curatedCareers = storedResult?.catalogSnapshot?.roles ?? [];
  const courseQueries = storedResult && focusedDirection
    ? getDirectionCourseQueries(storedResult, focusedDirection.id).slice(0, 6)
    : [];
  const userId = user?.uid;
  const isAnonymous = user?.isAnonymous;

  useEffect(() => {
    if (!userId || isAnonymous) return;
    let active = true;
    setAccountLoad({ error: false });
    hydrateDiscoveryFromAccount()
      .then(() => { if (active) setAccountLoad({ owner: userId, error: false }); })
      .catch(() => { if (active) setAccountLoad({ owner: userId, error: true }); });
    return () => { active = false; };
  }, [userId, isAnonymous, retryAccount]);

  useEffect(() => {
    if (MVP_NAVIGATION_ENABLED || !userId || isAnonymous) return;
    let active = true;
    const service = new AchievementsService();
    Promise.all([service.getTotalPoints(userId), service.getMedalData(userId), service.getTierData(userId)])
      .then(([points, medals, tier]) => {
        if (active) setRewards({ points, medals: medals.total, level: tier?.name || "Starter" });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isAnonymous, userId]);

  useEffect(() => {
    if (MVP_NAVIGATION_ENABLED || !userId || isAnonymous) {
      return;
    }
    let active = true;
    getMyCareerPathExperience(locale)
      .then((next) => {
        if (!active) return;
        setExperience(next);
        const recommendationId = next.nextBest?.id;
        if (recommendationId && !impressedRecommendations.current.has(recommendationId)) {
          impressedRecommendations.current.add(recommendationId);
          void recordRecommendationEvent("impression", recommendationId).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isAnonymous, locale, rawPlan, userId]);

  if (userId && !isAnonymous && accountLoad.owner !== userId) return <div className="p-8" role="status">{getAssessmentV2Catalog(locale).ui.loading}</div>;
  if (accountLoad.error) return <div className="p-8"><p role="alert">{getAssessmentV2Catalog(locale).ui.errorTitle}</p><Button onClick={() => setRetryAccount((value) => value + 1)}>{getAssessmentV2Catalog(locale).ui.retry}</Button></div>;

  if (!result) return <EmptyState title={text.noPlan} description={text.noPlanDescription} action={text.start} href="/assessment" />;
  if (!focusedDirection) return <EmptyState title={text.chooseDirection} description={text.chooseDirectionDescription} action={text.reviewDirections} href="/assessment/discovery" />;

  const name = userProfile?.fullName || user?.displayName || "Student";
  const greeting = text.greeting.replace("{name}", name.split(" ")[0]);
  const fallbackGoals = ([
    ["learn", text.learnStep], ["try", text.tryStep], ["discuss", text.discussStep],
  ] as Array<[DirectionActionId, string]>).map(([id, title]) => ({
    id,
    title,
    completed: Boolean(plan?.actions[id]),
    recommended: false,
  }));
  const progressGoals = experience?.progress.goals ?? fallbackGoals;
  const completedSteps = experience?.progress.completed ?? progressGoals.filter((step) => step.completed).length;
  const totalSteps = experience?.progress.total ?? 3;
  const stepsDone = text.stepsDone.replace("{done}", String(completedSteps)).replace("{total}", String(totalSteps));
  const conversationCareers = selectedCareers.map((career) => conversationCareer(
    career.id,
    career.title,
    career.summary,
    locale,
    curatedCareers,
  ));
  const conversationSlides = generateCareerConversationSlides({
    locale,
    directionTitle: focusedDirection.title,
    careers: conversationCareers,
    strengths: result.signals.map((signal) => text.skillLabels[signal.id] ?? signal.title),
    courses: courseQueries,
  });

  const updateStep = async (actionId: DirectionActionId) => {
    if (!plan) return;
    if (experience && actionId !== "discuss") return;
    const next = toggleDirectionAction(plan, actionId);
    saveDirectionPlan(next);
    if (user && !user.isAnonymous) {
      try {
        saveDirectionPlan(await saveDirectionToApi(next));
        setExperience(await getMyCareerPathExperience(locale));
      } catch { /* Local progress remains available. */ }
    }
  };

  const openNextBest = () => {
    const recommendation = experience?.nextBest;
    if (!recommendation) return;
    void recordRecommendationEvent("start", recommendation.id).catch(() => undefined);
    if (recommendation.action.type === "confirm_discussion") void updateStep("discuss");
  };

  return (
    <main className={styles.dashboard}>
      <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">{MVP_NAVIGATION_ENABLED ? mvpNavigationCopy[locale].myDirection : text.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{text.nextStepsDescription}</p>

      <section
        data-testid="career-direction-hero"
        className={styles.dashboardHero}
        aria-labelledby="career-direction-title"
      >
        <DirectionImage directionId={focusedDirection.id} />
        <div className="relative p-6 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-secondary">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{text.careerDirection}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label={`${text.changeDirection}; ${text.editDreamCareers}`}
                >
                  <Ellipsis className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild>
                  <Link href="/assessment/discovery" className="flex items-start gap-3 py-3">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-normal leading-5">{text.changeDirection}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/explore/areas/${focusedDirection.id}`} className="flex items-start gap-3 py-3">
                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-normal leading-5">{selectedCareers.length ? text.editDreamCareers : text.chooseDreamCareers}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h2 id="career-direction-title" className="mt-8 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {focusedDirection.title}
          </h2>
          {focusedDirection.description.trim() ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7">{focusedDirection.description}</p>
          ) : null}
        </div>
      </section>

      <section className="mt-7" aria-labelledby="dream-careers-title">
        <h2 id="dream-careers-title" className="text-xl font-semibold tracking-[-0.02em] text-primary sm:text-2xl">{text.dreamCareers}</h2>
        {selectedCareers.length ? (
          <ol data-testid="dream-career-list" className={styles.savedCareers}>
            {selectedCareers.map((career, index) => (
              <li key={career.id}>
                <Link
                  href={`/dream-careers/${career.id}?from=dashboard`}
                  className={`${styles.dashboardCareer} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-sm font-semibold">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className={styles.careerTitle}>{career.title}</span>{MVP_NAVIGATION_ENABLED ? <span className={styles.careerSummary}>{career.summary}</span> : null}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <Button asChild className="mt-4 rounded-full"><Link href={`/explore/areas/${focusedDirection.id}`}>{text.chooseDreamCareers}</Link></Button>
        )}
      </section>

      {MVP_NAVIGATION_ENABLED ? <section className={styles.dashboardBrowse}>
        <p>{mvpNavigationCopy[locale].description}</p><Link href="/explore">{mvpNavigationCopy[locale].exploreCareers}<ArrowRight size={18} aria-hidden="true" /></Link>
      </section> : null}

      {selectedCareers.length ? (
        <>
      {!MVP_NAVIGATION_ENABLED ? <section className="mt-8" aria-label={text.progress}>
        <WeeklyPlanCard />
      </section> : null}

      <section id="next-steps" className={`mt-8 grid scroll-mt-24 gap-5 ${MVP_NAVIGATION_ENABLED ? styles.conversation : "lg:grid-cols-[minmax(0,1fr)_19rem]"}`}>
            {!MVP_NAVIGATION_ENABLED ? <Card className="border-primary/10 shadow-none"><CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold text-primary">{text.myNextSteps}</h2><p className="mt-2 text-sm text-muted-foreground">{stepsDone}</p></div><span className="text-2xl font-semibold text-primary">{completedSteps}/{totalSteps}</span></div>
              {experience?.nextBest ? (
                <div className="mt-6 rounded-2xl bg-secondary/25 p-4" data-testid="next-best-recommendation">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.nextBest}</p>
                  <h3 className="mt-2 text-base font-semibold text-primary">{experience.nextBest.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{experience.nextBest.reason}</p>
                  {recommendationHref(experience.nextBest) ? (
                    <Button asChild size="sm" className="mt-4 rounded-full">
                      <Link href={recommendationHref(experience.nextBest)!} onClick={openNextBest}>{text.open}<ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="mt-4 rounded-full" onClick={openNextBest}>{text.confirmDiscussion}</Button>
                  )}
                </div>
              ) : null}
              <div className="mt-6 space-y-3">
                {progressGoals.map((step) => {
                  const content = <><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.completed ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>{step.completed ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span><span className={step.completed ? "text-sm text-muted-foreground line-through" : "text-sm font-medium text-foreground"}>{step.title}</span></>;
                  return step.id === "discuss" && !step.completed ? (
                    <button key={step.id} type="button" aria-pressed={false} onClick={() => updateStep(step.id)} className="flex w-full items-center gap-3 rounded-2xl border border-primary/10 p-4 text-left hover:border-primary/30">{content}</button>
                  ) : (
                    <div key={step.id} className="flex w-full items-center gap-3 rounded-2xl border border-primary/10 p-4 text-left">{content}</div>
                  );
                })}
              </div>
            </CardContent></Card> : null}
            <Card className="border-0 bg-secondary/20 shadow-none"><CardContent className="flex h-full flex-col p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary"><MessageCircleMore className="h-5 w-5" /></span>
              <h2 className="mt-5 text-lg font-semibold text-primary">{text.careerConversation}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.careerConversationHelp}</p>
              <Button className="mt-6 w-full rounded-full lg:mt-auto" onClick={() => setConversationOpen(true)}>{text.start}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardContent></Card>
          </section> : null}

          {!MVP_NAVIGATION_ENABLED ? <section className="mt-8" aria-labelledby="career-achievements-title">
            <Card className="border-0 bg-secondary/20 shadow-none"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.rewards}</p><h2 id="career-achievements-title" className="mt-2 text-xl font-semibold text-primary">{text.viewRewards}</h2></div>
              <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80"><RewardValue value={rewards.points.toLocaleString()} label={text.points} /><RewardValue value={String(rewards.medals)} label={text.medals} /><RewardValue value={localizeRewardLevel(rewards.level, locale)} label={text.level} compact /></div>
              <Button asChild className="rounded-full"><Link href="/achievements">{text.viewRewards}<ArrowRight className="h-4 w-4" /></Link></Button>
            </CardContent></Card>
          </section>
        </>
      ) : null}

      <SlideshowOverlay isOpen={conversationOpen} onClose={() => setConversationOpen(false)} slides={conversationSlides} />
    </main>
  );
}

function RewardValue({ value, label, compact = false }: { value: string; label: string; compact?: boolean }) {
  return <div className="rounded-xl bg-slate-50 px-2 py-3"><p className={`${compact ? "text-sm capitalize" : "text-lg"} truncate font-semibold text-primary`}>{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>;
}

function EmptyState({ title, description, action, href }: { title: string; description: string; action: string; href: string }) {
  return <main className="mx-auto max-w-4xl px-5 py-16 text-center"><Compass className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-5 text-3xl font-semibold text-primary">{title}</h1><p className="mx-auto mt-3 max-w-xl text-muted-foreground">{description}</p><Button asChild className="mt-7 rounded-full"><Link href={href}>{action}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></main>;
}

function conversationCareer(id: string, title: string, summary: string, locale: "en" | "ml" | "hi" | "ta", curatedCareers: CuratedDreamCareer[]): CareerConversationCareer {
  const fallback = getCareerRole(locale, id);
  const curated = curatedCareers.find((career) => career.id === id || career.slug === id);
  const translation = curated?.translations[locale] || curated?.translations.en;
  return {
    title: translation?.title || fallback?.title || title,
    summary: translation?.summary || fallback?.summary || summary,
    dailyWork: translation?.dailyWork?.length ? translation.dailyWork : fallback?.dailyWork || [],
    workSetting: translation?.workSetting || fallback?.workSetting || "",
    preparation: translation?.pathway || fallback?.pathway || "Compare current study routes and entry requirements.",
    tryThis: translation?.tryThis || fallback?.tryThis || "Try one small related activity and discuss what you learned.",
    difficultParts: translation?.tradeoffs?.length ? translation.tradeoffs : fallback?.tradeoffs || [],
    salaryRange: curated?.salaryRange || fallback?.salaryRange,
    growthOutlook: curated?.growthOutlook || fallback?.growthOutlook,
  };
}

function subscribeToDiscovery(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("xtara:assessment-result-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("xtara:assessment-result-changed", onChange);
  };
}

function localizeRewardLevel(level: string, locale: "en" | "ml" | "hi" | "ta"): string {
  if (locale === "en") return level;
  const names = {
    ml: { starter: "തുടക്കം", bronze: "ബ്രോൺസ്", silver: "സിൽവർ", gold: "ഗോൾഡ്" },
    hi: { starter: "शुरुआत", bronze: "ब्रॉन्ज़", silver: "सिल्वर", gold: "गोल्ड" },
    ta: { starter: "தொடக்கம்", bronze: "வெண்கலம்", silver: "வெள்ளி", gold: "தங்கம்" },
  } as const;
  return names[locale][level.toLowerCase() as keyof typeof names[typeof locale]] ?? level;
}

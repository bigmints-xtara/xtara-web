"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

import styles from '@/components/journey/journey.module.css';
import launchpad from '@/components/launchpad/launchpad.module.css';
import { launchpadCopy } from '@/components/launchpad/copy';
import Header from "@/components/Header";
import AssessmentEngine from "@/components/assessment/AssessmentEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import {
  assessmentV2StorageKey,
  assessmentStageStorageKey,
  readAssessmentDraft,
  getAssessmentV2Catalog,
  getAssessmentStageQuestion,
  parseAssessmentDraft,
  parseDiscoveryResult,
  parseAssessmentStage,
  parseOptionalAssessmentStage,
  saveAssessmentDraft,
  saveDiscoveryResult,
} from "@/lib/assessment-v2";
import { getPendingOrganizationJoin } from "@/lib/pending-organization-join";
import { normalizeAssessmentAnswers } from "@/lib/assessment-selection";
import { evaluateAssessmentOnServer, getActiveAssessmentDefinition, type ActiveAssessmentDefinition } from "@/lib/assessment-api";
import { savePendingAssessmentToAccount } from "@/lib/discovery-save";
import type { AssessmentAnswers } from "@/types/assessment";

const subscribeToAssessmentDraft = () => () => undefined;

export default function AssessmentPage() {
  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentJourney />
    </Suspense>
  );
}

function AssessmentJourney() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const rawStage = useSyncExternalStore(
    subscribeToAssessmentStage,
    () => localStorage.getItem(assessmentStageStorageKey),
    () => null,
  );
  const stage = parseOptionalAssessmentStage(rawStage);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [activeDefinition, setActiveDefinition] = useState<ActiveAssessmentDefinition | null>(null);
  const [definitionFailed, setDefinitionFailed] = useState(false);
  const [definitionAttempt, setDefinitionAttempt] = useState(0);
  const catalog = getAssessmentV2Catalog(locale);
  const rawResult = useSyncExternalStore(
    subscribeToAssessmentDraft,
    () => localStorage.getItem(assessmentV2StorageKey),
    () => null,
  );
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const effectiveStage = stage ?? storedResult?.stage ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!effectiveStage) {
      setActiveDefinition(null);
      return () => { cancelled = true; };
    }
    setActiveDefinition(null);
    setDefinitionFailed(false);
    getActiveAssessmentDefinition(effectiveStage, locale)
      .then((definition) => {
        if (definition.stage !== effectiveStage || definition.locale !== locale) throw new Error("Assessment definition did not match your grade and language");
        if (!cancelled) setActiveDefinition(definition);
      })
      .catch(() => {
        if (!cancelled) setDefinitionFailed(true);
      });
    return () => { cancelled = true; };
  }, [effectiveStage, locale, definitionAttempt]);
  const questions = useMemo(() => activeDefinition?.stage === effectiveStage && activeDefinition.locale === locale
    ? activeDefinition.questions
    : [getAssessmentStageQuestion(locale)], [activeDefinition, effectiveStage, locale]);
  const ui = { ...catalog.ui, ...Object.fromEntries(Object.entries(activeDefinition?.ui ?? {}).filter(([key, value]) => key in catalog.ui && typeof value === 'string')) };
  const rawDraft = useSyncExternalStore(
    subscribeToAssessmentDraft,
    () => effectiveStage ? readAssessmentDraft(effectiveStage) ?? "{}" : "{}",
    () => null,
  );
  const draft = useMemo(
    () => {
      if (rawDraft === null) return null;
      const savedDraft = parseAssessmentDraft(rawDraft);
      const answers = Object.keys(savedDraft).length > 0
        ? savedDraft
        : effectiveStage && storedResult?.stage === effectiveStage
          ? storedResult.answers
          : {};
      const withStage = effectiveStage && !answers.currentGrade ? { ...answers, currentGrade: effectiveStage } : answers;
      return normalizeAssessmentAnswers(questions, withStage);
    },
    [effectiveStage, questions, rawDraft, storedResult],
  );
  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState("");

  const handleComplete = async (answers: AssessmentAnswers) => {
    setProcessing(true);
    setProcessingError("");
    try {
      const completedStage = parseAssessmentStage(typeof answers.currentGrade === "string" ? answers.currentGrade : effectiveStage);
      saveAssessmentDraft(completedStage, answers);
      if (!activeDefinition || activeDefinition.stage !== completedStage || activeDefinition.locale !== locale) {
        throw new Error(ui.errorTitle);
      }
      const result = await evaluateAssessmentOnServer({
        definitionId: activeDefinition.id,
        version: activeDefinition.version,
        stage: completedStage, locale, answers,
      });
      if (!result.areas.length) throw new Error(ui.errorTitle);
      saveDiscoveryResult(result);
      if (user && !user.isAnonymous) {
        if (!await savePendingAssessmentToAccount(user.uid)) throw new Error(ui.errorTitle);
      }
      const pendingJoinCode = getPendingOrganizationJoin();
      router.push(pendingJoinCode
        ? `/join/${encodeURIComponent(pendingJoinCode)}`
        : `/assessment/discovery?stage=${completedStage}`);
    } catch (error) {
      setProcessing(false);
      setProcessingError(error instanceof Error ? error.message : ui.errorTitle);
    }
  };

  if (draft === null) return <AssessmentLoading />;

  if (!introDismissed && !effectiveStage) {
    return <AssessmentIntro catalog={catalog} onStart={() => setIntroDismissed(true)} />;
  }

  if (processingError || definitionFailed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-2xl font-semibold text-primary">{ui.errorTitle}</h1>
        <p role="alert" className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{processingError || ui.errorTitle}</p>
        <button type="button" onClick={() => { setProcessingError(""); if (definitionFailed) setDefinitionAttempt((attempt) => attempt + 1); }} className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white">
          {ui.retry}
        </button>
      </div>
    );
  }

  if (effectiveStage && (!activeDefinition || activeDefinition.stage !== effectiveStage || activeDefinition.locale !== locale)) return <AssessmentLoading />;

  if (processing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <h1 className="mt-6 text-2xl font-semibold text-primary">{ui.processingTitle}</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{ui.processingDescription}</p>
      </div>
    );
  }

  return (
    <div className={styles.surface}>
      <Header />
      <main className={launchpad.assessmentLayout}>
        <aside className={launchpad.assessmentAside}><div className={launchpad.eyebrow}>{catalog.ui.title}</div><h2>{launchpadCopy[locale].assessmentTitle}</h2><p>{launchpadCopy[locale].assessmentHelp}</p></aside>
        <AssessmentEngine
          key={locale}
          questions={questions}
          initialAnswers={draft}
          labels={ui}
          onAnswersChange={(answers) => {
            const selectedStage = parseOptionalAssessmentStage(typeof answers.currentGrade === "string" ? answers.currentGrade : null);
            if (selectedStage) {
              localStorage.setItem(assessmentStageStorageKey, selectedStage);
              window.dispatchEvent(new Event("xtara:assessment-stage-changed"));
            }
            saveAssessmentDraft(selectedStage ?? effectiveStage ?? "grade8", answers);
          }}
          onComplete={handleComplete}
          onExit={() => router.push("/")}
        />
      </main>
    </div>
  );
}

function AssessmentIntro({ catalog, onStart }: { catalog: ReturnType<typeof getAssessmentV2Catalog>; onStart: () => void }) {
  return (
    <div className={styles.surface}>
      <Header />
      <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl items-center px-4 py-6 sm:py-12">
        <Card className="w-full overflow-hidden border-primary/10 bg-card shadow-none">
          <CardContent className="p-6 sm:p-10">
            <Badge variant="secondary" className="border border-primary/10 bg-primary/5 text-primary">
              {catalog.ui.eyebrow}
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.035em] text-primary sm:text-5xl">
              {catalog.ui.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {catalog.ui.description}
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm leading-6 text-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <span>{catalog.ui.privacy}</span>
            </div>
            <Button type="button" size="lg" className="mt-7 min-h-12 w-full rounded-xl sm:w-auto" onClick={onStart}>
              {catalog.ui.startAssessment}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function subscribeToAssessmentStage(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === assessmentStageStorageKey) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("xtara:assessment-stage-changed", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("xtara:assessment-stage-changed", onChange);
  };
}

function AssessmentLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  );
}

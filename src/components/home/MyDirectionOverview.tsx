"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MessageCircleMore, Sparkles } from "lucide-react";
import CareerConversation from "@/components/career-path/CareerConversation";
import { ExplorerScene, explorerTone } from "@/components/careers/explorer/ExplorerScene";
import { resolveCareerArtwork } from "@/components/careers/explorer/career-artwork";
import { useCareerExplorer } from "@/components/careers/explorer/useCareerExplorer";
import { resolveExplorerDirection } from "@/lib/career-direction-imagery";
import DirectionImage from "@/components/journey/DirectionImage";
import styles from "@/components/journey/journey.module.css";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { dashboardCopy } from "@/lib/dashboard-copy";
import { savedCareerCopy } from "@/components/careers/saved-career-copy";
import { savedCareerHref } from "@/lib/study-options";
import type { DirectionOverview } from "@/lib/direction-api";
import { directionOverviewCopy } from "@/lib/direction-overview-copy";
import DashboardExploreBanner from "./DashboardExploreBanner";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";

export default function MyDirectionOverview({ direction, locale, greeting, hasAssessment, canEditCareers }: {
  direction: DirectionOverview;
  locale: Locale;
  greeting: string;
  hasAssessment: boolean;
  canEditCareers: boolean;
}) {
  const [conversationOpen, setConversationOpen] = useState(false);
  const text = dashboardCopy[locale];
  const copy = directionOverviewCopy[locale];
  const careerText = savedCareerCopy[locale];
  const { data: catalogue } = useCareerExplorer(locale);
  const presentation = resolveExplorerDirection(catalogue?.directions, direction.id)?.presentation;
  const changeHref = hasAssessment ? "/explore?choose=direction" : "/assessment";
  const editHref = canEditCareers ? `/assessment/careers/${encodeURIComponent(direction.id)}` : changeHref;
  const hasGuidance = direction.guidance.length > 0;
  const hasCareers = direction.careers.length > 0;

  return (
    <main className={`${styles.dashboard} ${styles.studentDashboard}`}>
      {greeting && <p className="text-sm font-medium text-muted-foreground">{greeting}</p>}
      <h1 className="mt-1 text-primary">{mvpNavigationCopy[locale].myDirection}</h1>

      <section data-testid="career-direction-hero" className={styles.directionStrip} style={explorerTone(presentation)} aria-labelledby="career-direction-title">
        <DirectionImage directionId={direction.id} />
        <div className={styles.stripCopy}>
          <div className={styles.overviewEyebrow}><Compass size={20} aria-hidden="true" />{text.careerDirection}</div>
          <h2 id="career-direction-title">{direction.title}</h2>
          {direction.summary.trim() ? <p>{direction.summary}</p> : null}
          <Link href={changeHref} className={styles.overviewLink}>
            {hasAssessment ? text.changeDirection : text.startAssessment}<ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="dream-careers-title">
        <div className={styles.overviewSectionHeading}>
          <div>
            <h2 id="dream-careers-title" className="text-2xl font-semibold tracking-[-0.02em] text-primary">{text.dreamCareers}</h2>
            <p>{hasCareers ? text.dreamCareersDescription : text.chooseCareersDescription}</p>
          </div>
          {hasCareers && canEditCareers ? <Link className={styles.overviewLink} href={editHref}>{text.editDreamCareers}<ArrowRight size={17} aria-hidden="true" /></Link> : null}
        </div>
        {hasCareers ? (
          <ol data-testid="dream-career-list" className={styles.savedCareerRows}>
            {direction.careers.map((career) => {
              const href = savedCareerHref(career.id);
              const publishedCareer = catalogue?.careers.find(item => item.id === career.id);
              const artwork = resolveCareerArtwork(catalogue, publishedCareer, direction.id);


              return (
                <li key={career.id} className={styles.savedCareerRow}>
                  <Link href={href} className={styles.savedCareerAction}>
                    <div className={styles.savedArt} aria-hidden="true">
                      <ExplorerScene illustration={artwork.illustration} decorative placeholder="" sizes="96px" />
                    </div>
                    <span className="min-w-0">
                      <span className={styles.careerTitle}>{career.title}</span>
                      {career.summary.trim() && <span className={styles.careerSummary}>{career.summary}</span>}
                    </span>
                    <span className={styles.openCareer}>{careerText.open}<ArrowRight size={16} aria-hidden="true" /></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : <Button asChild className="mt-4"><Link href={editHref}>{canEditCareers ? text.chooseDreamCareers : hasAssessment ? text.reviewDirections : text.startAssessment}</Link></Button>}
      </section>

      {direction.reasons.length > 0 || hasGuidance || direction.reflectionPrompt ? (
        <div className={styles.overviewDetails}>
          {direction.reasons.length > 0 ? (
            <section className={styles.overviewPanel} aria-labelledby="direction-reasons">
              <h2 id="direction-reasons"><Sparkles size={21} aria-hidden="true" />{copy.why}</h2>
              <p>{copy.whyHelp}</p>
              <ul>{direction.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </section>
          ) : null}
          {hasGuidance || direction.reflectionPrompt ? (
            <section className={styles.overviewPanel} aria-labelledby="direction-guidance">
              <h2 id="direction-guidance"><Compass size={21} aria-hidden="true" />{hasGuidance ? copy.guidance : copy.reflection}</h2>
              {hasGuidance ? <ul>{direction.guidance.map((item, index) => <li key={index}>{item}</li>)}</ul> : null}
              {direction.reflectionPrompt ? <div className={styles.overviewReflection}>
                {hasGuidance ? <h3>{copy.reflection}</h3> : null}<p>{direction.reflectionPrompt}</p>
              </div> : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {hasCareers ? (
        <section id="next-steps" className={styles.overviewConversation} aria-labelledby="direction-conversation">
          <MessageCircleMore size={24} aria-hidden="true" />
          <div><h2 id="direction-conversation">{text.careerConversation}</h2><p>{text.careerConversationHelp}</p></div>
          <Button onClick={() => setConversationOpen(true)}>{copy.conversation}<ArrowRight size={17} aria-hidden="true" /></Button>
        </section>
      ) : null}

      <DashboardExploreBanner locale={locale} />
      {conversationOpen ? <CareerConversation isOpen onClose={() => setConversationOpen(false)} careerIds={direction.careers.map((career) => career.id)} /> : null}
    </main>
  );
}

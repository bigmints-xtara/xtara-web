"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MessageCircleMore, Sparkles } from "lucide-react";
import CareerConversation from "@/components/career-path/CareerConversation";
import DirectionImage from "@/components/journey/DirectionImage";
import styles from "@/components/journey/journey.module.css";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { dashboardCopy } from "@/lib/dashboard-copy";
import type { DirectionOverview } from "@/lib/direction-api";
import { directionOverviewCopy } from "@/lib/direction-overview-copy";
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
  const navigation = mvpNavigationCopy[locale];
  const changeHref = hasAssessment ? "/assessment/discovery" : "/assessment";
  const editHref = canEditCareers ? `/assessment/careers/${direction.id}` : changeHref;
  const hasGuidance = direction.guidance.length > 0;
  const hasCareers = direction.careers.length > 0;

  return (
    <main className={styles.dashboard}>
      <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
      <h1 className="mt-1 text-primary">{navigation.myDirection}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{copy.intro}</p>

      <section data-testid="career-direction-hero" className={`${styles.dashboardHero} ${styles.directionOverviewHero}`} aria-labelledby="career-direction-title">
        <DirectionImage directionId={direction.id} />
        <div className="p-6 sm:p-10">
          <div className={styles.overviewEyebrow}><Compass size={20} aria-hidden="true" />{text.careerDirection}</div>
          <h2 id="career-direction-title">{direction.title}</h2>
          {direction.summary.trim() ? <p className="mt-4 max-w-2xl text-base leading-7">{direction.summary}</p> : null}
          <Link href={changeHref} className={styles.overviewLink}>
            {hasAssessment ? text.changeDirection : text.startAssessment}<ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
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

      <section className="mt-10" aria-labelledby="dream-careers-title">
        <div className={styles.overviewSectionHeading}>
          <div>
            <h2 id="dream-careers-title" className="text-2xl font-semibold tracking-[-0.02em] text-primary">{text.dreamCareers}</h2>
            <p>{hasCareers ? text.dreamCareersDescription : text.chooseCareersDescription}</p>
          </div>
          {hasCareers && canEditCareers ? <Link className={styles.overviewLink} href={editHref}>{text.editDreamCareers}<ArrowRight size={17} aria-hidden="true" /></Link> : null}
        </div>
        {hasCareers ? (
          <ol data-testid="dream-career-list" className={styles.savedCareers}>
            {direction.careers.map((career, index) => (
              <li key={career.id}>
                <Link href={`/dream-careers/${career.id}?from=dashboard`} className={`${styles.dashboardCareer} ${styles.overviewCareer}`}>
                  <span className={styles.overviewIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className={styles.careerTitle}>{career.title}</span>
                    {career.summary.trim() ? <span className={styles.careerSummary}>{career.summary}</span> : null}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : <Button asChild className="mt-4"><Link href={editHref}>{canEditCareers ? text.chooseDreamCareers : hasAssessment ? text.reviewDirections : text.startAssessment}</Link></Button>}
      </section>

      {hasCareers ? (
        <section id="next-steps" className={styles.overviewConversation} aria-labelledby="direction-conversation">
          <MessageCircleMore size={24} aria-hidden="true" />
          <div><h2 id="direction-conversation">{text.careerConversation}</h2><p>{text.careerConversationHelp}</p></div>
          <Button onClick={() => setConversationOpen(true)}>{copy.conversation}<ArrowRight size={17} aria-hidden="true" /></Button>
        </section>
      ) : null}

      <section className={styles.dashboardBrowse}>
        <div><h2 className="mb-1 text-lg font-semibold">{copy.explore}</h2><p>{navigation.description}</p></div>
        <Link href="/explore" className={styles.overviewLink}>{navigation.exploreCareers}<ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
      {conversationOpen ? <CareerConversation isOpen onClose={() => setConversationOpen(false)} careerIds={direction.careers.map((career) => career.id)} /> : null}
    </main>
  );
}

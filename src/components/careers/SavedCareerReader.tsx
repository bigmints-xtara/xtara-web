'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { getCareerOverview } from '@/lib/career-overview-api';
import { XtaraApiError } from '@/lib/api/client';
import type { CareerOverview } from '@/types/career-overview';
import SavedCareerSections from './SavedCareerSections';
import { savedCareerCopy } from './saved-career-copy';
import { studyOptionsCopy } from './study-options-copy';

type Question = { id: string; title: string; content: ReactNode };
type Section = { id: string; title: string; content: ReactNode };

function facts(values: string[]) {
  return <ul className="list-disc space-y-2 ps-5 marker:text-primary">{values.map(value => <li key={value}>{value}</li>)}</ul>;
}

function Questions({ items }: { items: Question[] }) {
  return items.map(item => <section key={item.id} id={`guide-question-${item.id}`} className="scroll-mt-24">
    <h3 className="mb-2 text-base font-semibold text-foreground">{item.title}</h3>{item.content}
  </section>);
}

export default function SavedCareerReader({ careerId, locale, intro, about = [], path = [], now = [], college, guideSources, fallbackText, guideInEnglish = false, grade }: {
  careerId: string; locale: Locale; intro: string; about?: Question[]; path?: Question[]; now?: Question[];
  college: ReactNode; guideSources?: ReactNode; fallbackText?: string; guideInEnglish?: boolean; grade?: string;
}) {
  const copy = savedCareerCopy[locale];
  const queryClient = useQueryClient();
  const [overview, setOverview] = useState<CareerOverview | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    queryClient.fetchQuery({
      queryKey: ['career-overview', careerId, locale], queryFn: ({ signal }) => getCareerOverview(careerId, signal, locale),
      staleTime: 300_000, retry: false, meta: { authScope: 'public' },
    }).then(value => {
      if (controller.signal.aborted) return;
      setOverview(value);
      setStatus('ready');
    }).catch(error => {
      if (!controller.signal.aborted) setStatus(error instanceof XtaraApiError && error.status === 404 ? 'missing' : 'failed');
    });
    return () => controller.abort();
  }, [careerId, locale, attempt, queryClient]);
  const sources = (ids: string[]) => {
    const links = overview?.sources.filter(source => ids.includes(source.id) && /^https:\/\//i.test(source.url));
    return links?.length ? <details className="mt-2 text-sm"><summary className="w-fit cursor-pointer font-semibold text-primary">{copy.sources}</summary>
      <ul>{links.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="inline-block py-2 underline">{source.label}</a></li>)}</ul>
    </details> : null;
  };
  const work: Question[] = about.filter(item => item.id !== 'earnings');
  const professionalTopics = new Set(['first-job-bridge', 'career-progression', 'employers', 'opportunities']);
  const isProfessional = (item: Question) => professionalTopics.has(item.id)
    || (careerId === 'ai-governance-specialist' && item.id.endsWith('legacy-entry-routes'));
  const preparation = path.filter(item => !isProfessional(item));
  const progression = path.filter(isProfessional);
  const practice = now;
  const activities = overview?.whatYouDo.activities.filter(value => value !== intro) ?? [];
  const sections: Section[] = [];
  if (activities.length || overview?.workplaces.length || work.length) {
    const fallbackWork = work.filter(item =>
      !(activities.length && (item.id === 'what-you-do' || item.id.endsWith('legacy-daily-work'))) &&
      !(overview?.workplaces.length && item.id.endsWith('legacy-work-setting')));
    sections.push({ id: 'about-career', title: copy.work, content: <>
      {activities.length > 0 && facts(activities)}
      {Boolean(overview?.workplaces.length) && <p>{overview?.workplaces.join(' · ')}</p>}
      <Questions items={fallbackWork} />
    </> });
  }
  const phases = (['grades8To10', 'afterGrade10', 'afterGrade12'] as const).flatMap((key, index) => {
    const items = overview?.studyPaths[key] ?? [];
    return items.length ? [{ key, label: copy.stages[index], items }] : [];
  });
  const studentPhase = grade === 'grade12' ? 'afterGrade12' : grade === 'grade11' || grade === 'grade10' ? 'afterGrade10' : 'grades8To10';
  sections.push({ id: 'how-to-get-there', title: copy.study, content: <>
    {phases.length > 1 && <div className="flex flex-wrap gap-x-4">{phases.map(phase =>
      <a key={phase.key} className={`inline-flex min-h-11 items-center text-sm text-primary underline ${phase.key === studentPhase ? 'font-bold' : ''}`} href={`#study-${phase.key}`}>{phase.label}</a>)}</div>}
    {phases.map(phase => <section id={`study-${phase.key}`} key={phase.key} className="scroll-mt-24">
      <h3 className="font-semibold text-foreground">{phase.label}</h3>
      <ul className="mt-2 space-y-3">{phase.items.map(item => <li key={item.id} className="border-s-2 border-border ps-3">
        {(item.title || item.pathwayTitle) && <strong className="text-foreground">{item.title || item.pathwayTitle}</strong>}
        <p>{item.description}</p>{item.geography && <p className="text-sm">{item.geography}</p>}{sources(item.sourceIds)}
      </li>)}</ul>
    </section>)}
    {preparation.length > 0 && <Questions items={preparation} />}
    {!phases.length && !preparation.length && (status === 'ready' || status === 'missing') && <p>{copy.school}</p>}
    {!preparation.length && status === 'loading' && <p role="status">{copy.loading}</p>}
    {status === 'failed' && <div role="status"><p>{copy.error}</p><Button variant="link" className="min-h-11" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>{studyOptionsCopy[locale].retry}</Button></div>}
  </> });
  sections.push({ id: 'courses-and-colleges', title: copy.colleges, content: college });
  if (practice.length || overview?.skills.length) sections.push({ id: 'what-you-can-do-now', title: copy.skills, content: <>
    {overview && overview.skills.length > 0 && facts(overview.skills)}
    <Questions items={practice.filter(item => !(overview?.skills.length && (item.id === 'skills' || item.id.endsWith('legacy-skills-to-build'))))} />
  </> });
  if (progression.length || overview?.jobRoles.length) sections.push({ id: 'career-progression', title: copy.progression, content: <>
    {overview?.jobRoles.map(role => <section key={role.id}><h3 className="font-semibold text-foreground">{role.label}</h3><p>{role.description}</p>
      {role.jobTitles.length > 0 && <p>{role.jobTitles.join(' · ')}</p>}{sources(role.sourceIds)}</section>)}
    <Questions items={progression} />
  </> });
  const pay = overview?.earnings;
  if (pay?.status === 'available') sections.push({ id: 'pay-outlook', title: copy.pay, content: <><p>{pay.description}</p><p className="text-sm">{[pay.geography, pay.experience, pay.measure, pay.population, pay.asOf].filter(Boolean).join(' · ')}</p>{sources(pay.sourceIds)}</> });
  return <SavedCareerSections sections={sections} locale={locale} englishFallback={guideInEnglish || overview?.translationFallback} fallbackText={fallbackText}>{guideSources}</SavedCareerSections>;
}

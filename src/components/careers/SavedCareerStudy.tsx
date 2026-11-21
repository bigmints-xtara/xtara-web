'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { CareerStudyPreview, StudyOffering } from '@/lib/study-options';
import { collegeOfferingHref, isStudyOptionsCareer, savedCareerHref, studyOfferingAnchor, studyOptionsHref } from '@/lib/study-options';
import type { DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';
import { studyOptionsCopy } from './study-options-copy';

export default function SavedCareerStudy({ careerId, locale, study, guide, loading, failed, onRetry }: {
  careerId: string;
  locale: Locale;
  study?: CareerStudyPreview;
  guide: DreamCareerStudentGuideResponse | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const text = studyOptionsCopy[locale];
  const href = savedCareerHref(careerId);
  const browse = study?.browse ?? isStudyOptionsCareer(careerId);
  const coverage = guide?.coverage.byQuestion.coursesAndColleges?.status;
  const guideOfferings: StudyOffering[] = coverage === 'available' || coverage === 'partial'
    ? (guide?.resolved.courseOptions.items ?? []).map(option => ({
      offeringId: option.id, title: option.courseTitle, institutionId: option.institution.id,
      institutionName: option.institution.name, city: option.institution.city, state: option.institution.state, match: option.match,
    })) : [];
  const offerings = study?.offerings ?? guideOfferings;
  const unavailable = study ? study.status === 'temporarily_unavailable'
    : failed || guide?.resolved.courseOptions.status === 'mapping_unavailable'
      || guide?.relationshipErrors.some(error => error.subsection === 'courseOptions');
  const offersHref = studyOptionsHref(careerId, href);
  const restored = useRef('');
  useEffect(() => {
    const target = location.hash.slice(1);
    if (!target.startsWith('study-offering-') || restored.current === target) return;
    const row = document.getElementById(target);
    if (row) {
      row.scrollIntoView?.({ block: 'center' });
      row.querySelector('a')?.focus({ preventScroll: true });
      restored.current = target;
    }
  }, [offerings]);

  return <div className="grid min-w-0 gap-3">
    {offerings.length > 0 && <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4">
      {offerings.map(offering => <li key={offering.offeringId} id={studyOfferingAnchor(offering.offeringId)} className="scroll-mt-24">
        <Link className="group flex min-h-14 items-center justify-between gap-3 py-4 focus-visible:outline-2 focus-visible:outline-ring"
          href={collegeOfferingHref(offering, `${href}#${studyOfferingAnchor(offering.offeringId)}`)}>
          <span className="grid min-w-0 gap-1 break-words">
            <span className="text-base font-semibold text-primary group-hover:underline">{offering.title}</span>
            <span>{offering.institutionName}</span>
            <span className="text-sm text-muted-foreground">{[offering.city, offering.state, text[offering.match]].filter(Boolean).join(' · ')}</span>
          </span>
          <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-primary" />
        </Link>
      </li>)}
    </ul>}
    {unavailable ? <div role="status"><p>{text.unavailable}</p><button className="min-h-11 font-semibold text-primary underline" onClick={onRetry}>{text.retry}</button></div>
      : !offerings.length && loading ? <p role="status">{text.loading}</p>
      : !offerings.length && (study || !browse) ? <p>{study?.status === 'no_results' ? text.noResults : text.noMapping}</p> : null}
    {browse && <Link href={study?.status === 'no_results' ? `${offersHref}&state=all` : offersHref} className="inline-flex min-h-11 w-fit max-w-full items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <GraduationCap size={18} aria-hidden="true" className="shrink-0" />{study?.status === 'no_results' ? text.broaden : text.action}<ArrowRight size={16} aria-hidden="true" className="shrink-0" />
    </Link>}
  </div>;
}

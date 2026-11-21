'use client';

import { Button } from "@/components/ui/button";
import SavedOfferingLink from './SavedOfferingLink';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { CareerStudyPreview, StudyOffering } from '@/lib/study-options';
import { isStudyOptionsCareer, savedCareerHref, studyOptionsHref } from '@/lib/study-options';
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
  return <div className="grid min-w-0 gap-3">
    {offerings.length > 0 && <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4">
      {offerings.map(offering => <li key={offering.offeringId}><SavedOfferingLink careerId={careerId} offering={offering} label={text[offering.match]} /></li>)}
    </ul>}
    {unavailable ? <div role="status"><p>{text.unavailable}</p><Button variant="link" className="min-h-11" onClick={onRetry}>{text.retry}</Button></div>
      : !offerings.length && loading ? <p role="status">{text.loading}</p>
      : !offerings.length && (study || !browse) ? <p>{study?.status === 'no_results' ? text.noResults : text.noMapping}</p> : null}
    {browse && <Link href={study?.status === 'no_results' ? `${offersHref}&state=all` : offersHref} className="inline-flex min-h-11 w-fit max-w-full items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <GraduationCap size={18} aria-hidden="true" className="shrink-0" />{study?.status === 'no_results' ? text.broaden : text.action}<ArrowRight size={16} aria-hidden="true" className="shrink-0" />
    </Link>}
  </div>;
}

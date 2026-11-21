'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { collegeOfferingHref, savedCareerHref, studyOfferingAnchor, type StudyOffering } from '@/lib/study-options';

export default function SavedOfferingLink({ careerId, offering, label }: { careerId: string; offering: StudyOffering; label: string }) {
  const anchor = studyOfferingAnchor(offering.offeringId);
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (location.hash !== '#' + anchor) return;
    link.current?.scrollIntoView?.({ block: 'center' });
    link.current?.focus({ preventScroll: true });
  }, [anchor]);
  return <Link ref={link} id={anchor} onNavigate={() => {
    // Keep the exact row as the source entry for the browser's Back action.
    window.history.replaceState(window.history.state, '', '#' + anchor);
  }} className="group flex min-h-14 scroll-mt-24 items-center justify-between gap-3 py-4 focus-visible:outline-2 focus-visible:outline-ring"
    href={collegeOfferingHref(offering, `${savedCareerHref(careerId)}#${anchor}`)}>
    <span className="grid min-w-0 gap-1 break-words">
      <span className="text-base font-semibold text-primary group-hover:underline">{offering.title}</span>
      <span>{offering.institutionName}</span>
      <span className="text-sm text-muted-foreground">{[offering.city, offering.state, label].filter(Boolean).join(' · ')}</span>
    </span>
    <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-primary" />
  </Link>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { xtaraApi } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

interface ReadinessReport {
  totals: { careers: number; published: number; ready: number };
  notice: string;
  records: Array<{
    id: string; title: string; status: string; ready: boolean;
    gradeCoverage: string[]; localeCoverage: string[];
    sourceReview: { total: number; reviewed: number; pending: number; undated: number; expired: number };
    blockers: string[]; publicationErrors: string[];
    jurisdictionCoverage: { required: number; verified: number; status: string };
  }>;
}

export default function MvpReadinessPage() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true;
    xtaraApi.get<ReadinessReport>('/admin/career-catalog/mvp-readiness')
      .then((result) => { if (active) setReport(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  const records = report?.records.filter((record) => `${record.title} ${record.id}`.toLowerCase().includes(query.trim().toLowerCase())) || [];
  return <main className="mx-auto max-w-6xl space-y-6 p-4 text-foreground sm:p-8">
    <header><h1 className="text-2xl font-semibold">MVP catalogue readiness</h1>
      <p className="mt-2 text-sm text-muted-foreground">Grades 8–12 · English, Malayalam, Hindi and Tamil · All Indian states and union territories</p>
    </header>
    <div className="rounded-xl border bg-card p-4 text-sm">
      Content is managed in Xtara Admin and served through the API to web and Flutter. This report reads the stored catalogue; it does not change publication status.
      <p className="mt-2 text-muted-foreground">GX10 can prepare evidence and translation drafts. Source accuracy, grade suitability, translations and state-specific pathways still need review.</p>
    </div>
    {error ? <div role="alert" className="space-y-3"><p>We could not load the admin catalogue. Check your access and try again.</p><Button onClick={() => { setError(false); setReport(null); setAttempt((value) => value + 1); }}>Try again</Button></div> : !report ? <p role="status">Loading catalogue readiness…</p> : <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[
        ['Stored careers', report.totals.careers], ['Currently published', report.totals.published], ['Verified for this MVP', report.totals.ready],
      ].map(([label, count]) => <div key={label} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{count}</p></div>)}</div>
      <p className="text-sm text-muted-foreground">{report.notice} Text presence is not proof of translation completeness. State and per-language review attestations are not yet recorded by the content contract.</p>
      <label className="block text-sm font-medium">Find a career<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 block w-full max-w-lg rounded-lg border bg-background p-3" /></label>
      {!records.length ? <p role="status">{report.records.length ? 'No careers match your search.' : 'No careers are stored in this catalogue yet.'}</p> : <ul className="space-y-4">
        {records.map((record) => <li key={record.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{record.title}</h2><p className="text-sm text-muted-foreground">{record.id} · {record.status}</p></div>
            <Button asChild variant="outline"><Link href={`/admin/dream-careers/${encodeURIComponent(record.id)}`}>Review content</Link></Button></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="font-medium">Grade guidance present</dt><dd>{record.gradeCoverage.map((grade) => grade.replace('grade', '')).join(', ') || 'None recorded'}</dd></div>
            <div><dt className="font-medium">Language content present</dt><dd>{record.localeCoverage.join(', ') || 'None recorded'}</dd></div>
            <div><dt className="font-medium">Sources marked reviewed</dt><dd>{record.sourceReview.reviewed} / {record.sourceReview.total}; {record.sourceReview.expired} expired</dd></div>
          </dl>
          <details className="mt-4"><summary className="cursor-pointer font-medium">{record.blockers.length} launch gaps</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{record.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
            {record.publicationErrors.length ? <p className="mt-3 text-sm text-muted-foreground">The guide also has {record.publicationErrors.length} publication validation errors. Open the content editor to repair and validate it.</p> : null}
          </details>
        </li>)}
      </ul>}
    </>}
  </main>;
}

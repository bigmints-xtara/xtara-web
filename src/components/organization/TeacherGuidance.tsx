"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Compass, MessageCircle, Search } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import { teacherGuidanceCopy } from '@/lib/teacher-guidance-copy';
import type { AssessmentInsight, OrganizationDashboard, OrganizationMember } from '@/lib/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NavigationPending from './NavigationPending';

export function TeacherStudentList({ students, attentionOnly = false }: { students: OrganizationMember[]; attentionOnly?: boolean }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  const [query, setQuery] = useState('');
  const [onlyNext, setOnlyNext] = useState(attentionOnly);
  const [expanded, setExpanded] = useState(!attentionOnly);
  const filtered = students.filter(student => (!onlyNext || student.guidance?.needsAttention) && student.displayName.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <Card className="shadow-none">
    <CardHeader><CardTitle>{attentionOnly ? c.attention : c.all}</CardTitle><p className="text-sm leading-6 text-muted-foreground">{c.attentionNote}</p></CardHeader>
    <CardContent className="space-y-4">
      {!attentionOnly && <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><span className="sr-only">{c.search}</span><Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder={c.search} /></label><div className="flex flex-wrap gap-2"><Button variant={!onlyNext ? 'default' : 'outline'} aria-pressed={!onlyNext} onClick={() => setOnlyNext(false)}>{c.all}</Button><Button variant={onlyNext ? 'default' : 'outline'} aria-pressed={onlyNext} onClick={() => setOnlyNext(true)}>{c.needsAttention}</Button></div></div>}
      <ul className="divide-y">{filtered.slice(0, expanded ? undefined : 6).map(student => {
        const guidance = student.guidance ? c.guidance[student.guidance.code] : c.guidanceUnavailable;
        return <li key={student.id}><Link href={`/organization/students/${encodeURIComponent(student.id)}`} className="group flex items-start gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><span aria-hidden="true" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{student.displayName.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="font-semibold">{student.displayName}</p><p className="mt-1 text-sm font-medium text-primary">{guidance[0]}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{guidance[1]}</p><span className="mt-2 inline-flex items-center gap-2 text-xs font-medium">{c.open}<NavigationPending /></span></div><ArrowRight aria-hidden="true" className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" /></Link></li>;
      })}</ul>
      {!filtered.length && <p role="status" className="rounded-xl bg-muted p-5 text-sm leading-6">{query ? c.noMatches : c.noAttention}</p>}
      {!expanded && filtered.length > 6 && <Button variant="outline" onClick={() => setExpanded(true)}>{c.needsAttention} · {filtered.length}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
      {attentionOnly && <Button asChild variant="ghost"><Link href="/organization/learners">{c.viewAll}<ArrowRight className="ml-2 h-4 w-4" /><NavigationPending /></Link></Button>}
    </CardContent>
  </Card>;
}

export function TeacherOverview({ dashboard }: { dashboard: OrganizationDashboard }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  const total = dashboard.summary.activeStudents;
  return <section className="mt-7 space-y-6">
    <div><h2 className="text-2xl font-semibold">{c.home}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{c.intro}</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[[c.students, total], [c.assessed, dashboard.summary.assessmentCompleted], [c.pending, dashboard.summary.awaitingAssessment], [c.followUp, dashboard.summary.followUpNeeded]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-card p-5"><p className="text-3xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>)}</div>
    <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]"><TeacherStudentList students={dashboard.students} attentionOnly /><Card className="shadow-none"><CardHeader><CardTitle>{c.classInterests}</CardTitle><p className="text-sm leading-6 text-muted-foreground">{c.classNote}</p></CardHeader><CardContent><ul className="space-y-5">{dashboard.cohortInsights.map(item => <li key={item.id}><div className="mb-2 flex items-start justify-between gap-4 text-sm"><span>{item.title}</span><span className="shrink-0 font-semibold tabular-nums">{item.count} / {total}</span></div><div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${total ? Math.min(100, item.count / total * 100) : 0}%` }} /></div></li>)}</ul>{!dashboard.cohortInsights.length && <p className="text-sm text-muted-foreground">{c.noCohort}</p>}<p className="mt-6 border-t pt-4 text-xs leading-5 text-muted-foreground">{c.privacy.replace('{count}', String(dashboard.privacyThreshold))}</p></CardContent></Card></div>
  </section>;
}

function EvidenceChart({ title, items, kind }: { title: string; items: AssessmentInsight[]; kind: 'areas' | 'signals' }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  return <Card className="shadow-none"><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><ul className="space-y-5">{items.map(item => {
    const known = kind === 'areas' ? item.evidence === 'early' || item.evidence === 'developing' : item.evidence === 'noticed' || item.evidence === 'repeated';
    const strong = item.evidence === 'developing' || item.evidence === 'repeated';
    return <li key={item.id} className="rounded-xl border p-4"><div className="flex gap-3"><Compass aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span className="font-medium">{item.title}</span></div>{known && <div className="mt-4 flex gap-1.5" aria-hidden="true">{[0, 1].map(index => <span key={index} className={`h-2 flex-1 rounded-full ${known && (index === 0 || strong) ? 'bg-primary/70' : 'bg-muted'}`} />)}</div>}<p className="mt-2 text-sm text-muted-foreground">{known && item.evidence ? c[item.evidence] : c.unknown}</p></li>;
  })}</ul>{!items.length && <p className="text-sm text-muted-foreground">{c.noEvidence}</p>}</CardContent></Card>;
}

export function StudentAssessmentVisuals({ student }: { student: OrganizationMember }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  const summary = student.assessmentSummary;
  const progress = student.directionProgress;
  const guidance = student.guidance ? c.guidance[student.guidance.code] : c.guidanceUnavailable;
  const steps = [
    { title: c.assessment, done: student.assessmentStatus === 'completed', shared: true },
    { title: c.direction, done: Boolean(progress?.areaId), shared: student.sharing?.direction ?? Boolean(progress) },
    { title: c.careers, done: Boolean(progress?.selectedCareerCount), shared: student.sharing?.direction ?? Boolean(progress) },
    { title: c.activity, done: Boolean(progress?.completedActions), shared: student.sharing?.actions ?? (progress?.completedActions != null) },
  ];
  const date = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value)) : null;
  return <div className="mt-6 space-y-6">
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6" aria-label={c.next}><div className="flex items-center gap-2 text-sm font-medium text-primary"><MessageCircle className="h-4 w-4" />{c.next}</div><h2 className="mt-2 text-xl font-semibold">{guidance[0]}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{guidance[1]}</p></section>
    <section aria-labelledby="assessment-results"><div className="mb-5"><h2 id="assessment-results" className="text-xl font-semibold">{c.results}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{c.evidenceNote}</p>{date(summary?.completedAt) && <p className="mt-2 text-xs text-muted-foreground">{c.saved} {date(summary?.completedAt)}</p>}</div>{summary ? <div className="grid gap-5 md:grid-cols-2"><EvidenceChart title={c.directions} items={summary.areas || []} kind="areas" /><EvidenceChart title={c.strengths} items={summary.signals || []} kind="signals" /></div> : <div className="rounded-xl border border-dashed p-6"><p className="font-medium">{student.assessmentStatus === 'pending' ? c.pending : c.noResults}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{student.sharing?.assessment ? c.guidance.assessment_pending[2] : c.sharingLimited}</p></div>}</section>
    <Card className="shadow-none"><CardHeader><CardTitle className="text-xl">{c.progress}</CardTitle></CardHeader><CardContent><ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <li key={step.title} className="rounded-xl border p-4"><span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full ${step.done && step.shared ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step.done && step.shared ? <Check className="h-4 w-4" /> : index + 1}</span><p className="mt-3 text-sm font-medium">{step.title}</p><p className="mt-1 text-xs text-muted-foreground">{!step.shared ? c.notShared : step.done ? c.completed : c.next}</p></li>)}</ol>{progress && <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">{[[c.careerCount, progress.selectedCareerCount], [c.actionCount, progress.completedActions ?? c.notShared], [c.review, date(progress.reviewOn) || '—']].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>)}</dl>}</CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle className="text-xl">{c.conversation}</CardTitle></CardHeader><CardContent><div className="grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-semibold text-primary">{c.ask}</h3><blockquote className="mt-3 border-l-2 border-primary/30 pl-4 text-lg leading-8">{guidance[3]}</blockquote></div><div><h3 className="text-sm font-semibold text-primary">{c.agree}</h3><p className="mt-3 text-sm leading-7">{guidance[2]}</p></div></div><div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">{c.revisit}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c.revisitNote}</p></div></CardContent></Card>
  </div>;
}

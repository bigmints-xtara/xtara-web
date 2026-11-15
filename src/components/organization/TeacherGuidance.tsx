"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Compass, MessageCircle, Search, Sprout, Sparkles } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import { teacherGuidanceCopy } from '@/lib/teacher-guidance-copy';
import type { AssessmentInsight, OrganizationDashboard, OrganizationMember } from '@/lib/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NavigationPending from './NavigationPending';
import Image from 'next/image';
import { getCareerDirectionImage } from '@/lib/career-direction-imagery';
import { TeacherConversationFeed, useConversationCopy } from '@/components/guidance/ConversationJournal';
import styles from '@/components/guidance/guidance.module.css';

export function TeacherStudentList({ students, attentionOnly = false }: { students: OrganizationMember[]; attentionOnly?: boolean }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  const [query, setQuery] = useState('');
  const [onlyNext, setOnlyNext] = useState(attentionOnly);
  const [expanded, setExpanded] = useState(!attentionOnly);
  const filtered = students.filter(student => (!onlyNext || student.guidance?.needsAttention) && student.displayName.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <section className={`${styles.garden} ${styles.paper}`}>
    <div className="mb-5"><h2 className={styles.sectionHeading}>{attentionOnly ? c.attention : c.all}</h2><p className={styles.intro}>{c.attentionNote}</p></div>
    <div className="space-y-4">
      {!attentionOnly && <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><span className="sr-only">{c.search}</span><Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder={c.search} /></label><div className="flex flex-wrap gap-2"><Button variant={!onlyNext ? 'default' : 'outline'} aria-pressed={!onlyNext} onClick={() => setOnlyNext(false)}>{c.all}</Button><Button variant={onlyNext ? 'default' : 'outline'} aria-pressed={onlyNext} onClick={() => setOnlyNext(true)}>{c.needsAttention}</Button></div></div>}
      <ul className={styles.studentList}>{filtered.slice(0, expanded ? undefined : 6).map(student => {
        const guidance = student.guidance ? c.guidance[student.guidance.code] : c.guidanceUnavailable;
        return <li key={student.id}><Link href={`/organization/students/${encodeURIComponent(student.id)}`} className={styles.studentLink}><span aria-hidden="true" className={styles.avatar}>{student.displayName.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="font-semibold">{student.displayName}</p><p className="mt-1 text-sm font-medium text-primary">{guidance[0]}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{guidance[1]}</p><span className="mt-2 inline-flex items-center gap-2 text-xs font-medium">{c.open}<NavigationPending /></span></div><ArrowRight aria-hidden="true" className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" /></Link></li>;
      })}</ul>
      {!filtered.length && <p role="status" className="rounded-xl bg-muted p-5 text-sm leading-6">{query ? c.noMatches : !students.length ? c.noStudents : students.some(student => !student.guidance) ? c.guidanceUnavailable[1] : c.noAttention}</p>}
      {!expanded && filtered.length > 6 && <Button variant="outline" onClick={() => setExpanded(true)}>{c.needsAttention} · {filtered.length}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
      {attentionOnly && <Button asChild variant="ghost"><Link href="/organization/learners">{c.viewAll}<ArrowRight className="ml-2 h-4 w-4" /><NavigationPending /></Link></Button>}
    </div>
  </section>;
}

export function TeacherOverview({ dashboard }: { dashboard: OrganizationDashboard }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  const { c: journal } = useConversationCopy();
  const total = dashboard.summary.activeStudents;
  return <section className={`${styles.garden} mt-7 space-y-8`}>
    <header className={styles.hero}><div><p className={styles.eyebrow}><Sprout size={18} />{journal.connected}</p><h2>{journal.classGarden}</h2><p>{journal.classGardenIntro}</p></div><div className={styles.sun}><strong>{total}</strong><span>{c.students}</span></div></header>
    <div className={styles.statLine}>{[[c.assessed, dashboard.summary.assessmentCompleted], [c.pending, dashboard.summary.awaitingAssessment], [c.followUp, dashboard.summary.followUpNeeded]].map(([label, value]) => <p key={label}><strong>{value}</strong>{label}</p>)}</div>
    <div className={styles.overviewGrid}><TeacherStudentList students={dashboard.students} attentionOnly /><TeacherConversationFeed /></div>
    <section aria-labelledby="class-interests"><h2 id="class-interests" className={styles.sectionHeading}>{c.classInterests}</h2><p className={styles.intro}>{c.classNote}</p><div className={styles.classIslands}>{dashboard.cohortInsights.map(item => { const image = getCareerDirectionImage(item.id); return <article key={item.id} className={styles.classIsland}>{image ? <Image src={image} alt="" width={220} height={150} /> : <Compass aria-hidden="true" size={60} className="mx-auto my-6" />}<p>{item.title}</p><div aria-hidden="true" className={styles.track}><span style={{ width: `${total ? Math.min(100, item.count / total * 100) : 0}%` }} /></div><small>{item.count} / {total} {c.students}</small></article>; })}</div>{!dashboard.cohortInsights.length && <p className={styles.intro}>{c.noCohort}</p>}<p className={`${styles.intro} mt-5 text-xs`}>{c.privacy.replace('{count}', String(dashboard.privacyThreshold))}</p></section>
  </section>;
}

function EvidenceChart({ title, items, kind }: { title: string; items: AssessmentInsight[]; kind: 'areas' | 'signals' }) {
  const { locale } = useTranslations();
  const c = teacherGuidanceCopy(locale);
  return <section><h3 className={styles.sectionHeading}>{title}</h3><div className={kind === 'areas' ? styles.islands : styles.strengths}>{items.map(item => {
    const known = kind === 'areas' ? item.evidence === 'early' || item.evidence === 'developing' : item.evidence === 'noticed' || item.evidence === 'repeated';
    const strong = item.evidence === 'developing' || item.evidence === 'repeated';
    const image = kind === 'areas' ? getCareerDirectionImage(item.id) : null;
    return <article key={item.id} className={kind === 'areas' ? styles.island : styles.strength}>{image ? <Image src={image} alt="" width={240} height={180} /> : <Sparkles aria-hidden="true" size={kind === 'areas' ? 48 : 20} className="mx-auto" />}<div><h3>{item.title}</h3><p className={styles.evidence}>{known && <><i data-filled /><i data-filled={strong} /></>}{known && item.evidence ? c[item.evidence] : c.unknown}</p></div></article>;
  })}</div>{!items.length && <p className={styles.intro}>{c.noEvidence}</p>}</section>;
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
  return <div className={`${styles.garden} mt-8 space-y-10`}>
    <section className={`${styles.paper} bg-[var(--mint)]`} aria-label={c.next}><div className="flex items-center gap-2 text-sm font-medium text-primary"><MessageCircle className="h-4 w-4" />{c.next}</div><h2 className="mt-2 text-xl font-semibold">{guidance[0]}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{guidance[1]}</p></section>
    <section aria-labelledby="assessment-results"><div className="mb-5"><h2 id="assessment-results" className="text-xl font-semibold">{c.results}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{c.evidenceNote}</p>{date(summary?.completedAt) && <p className="mt-2 text-xs text-muted-foreground">{c.saved} {date(summary?.completedAt)}</p>}</div>{summary ? <div className={styles.map}><div className={styles.mapCenter}><span className={styles.avatar}>{student.displayName.slice(0,1)}</span><span>{student.displayName}</span></div><div className="space-y-8"><EvidenceChart title={c.directions} items={summary.areas || []} kind="areas" /><EvidenceChart title={c.strengths} items={summary.signals || []} kind="signals" /></div></div> : <div className="rounded-xl border border-dashed p-6"><p className="font-medium">{student.assessmentStatus === 'pending' ? c.pending : c.noResults}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{student.sharing?.assessment ? c.guidance.assessment_pending[2] : c.sharingLimited}</p></div>}</section>
    <Card className={`${styles.paper} shadow-none`}><CardHeader><CardTitle className="text-xl">{c.progress}</CardTitle></CardHeader><CardContent><ol className={styles.growth}>{steps.map((step, index) => <li key={step.title} data-done={step.done && step.shared}><span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full ${step.done && step.shared ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step.done && step.shared ? <Check className="h-4 w-4" /> : index + 1}</span><p className="mt-3 text-sm font-medium">{step.title}</p><p className="mt-1 text-xs text-muted-foreground">{!step.shared ? c.notShared : step.done ? c.completed : c.next}</p></li>)}</ol>{progress && <dl className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">{[[c.careerCount, progress.selectedCareerCount], [c.actionCount, progress.completedActions ?? c.notShared], [c.review, date(progress.reviewOn) || '—']].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>)}</dl>}</CardContent></Card>
    <Card className={`${styles.paper} shadow-none`}><CardHeader><CardTitle className="text-xl">{c.conversation}</CardTitle></CardHeader><CardContent><div className="grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-semibold text-primary">{c.ask}</h3><blockquote className="mt-3 border-l-2 border-primary/30 pl-4 text-lg leading-8">{guidance[3]}</blockquote></div><div><h3 className="text-sm font-semibold text-primary">{c.agree}</h3><p className="mt-3 text-sm leading-7">{guidance[2]}</p></div></div><div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">{c.revisit}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c.revisitNote}</p></div></CardContent></Card>
  </div>;
}

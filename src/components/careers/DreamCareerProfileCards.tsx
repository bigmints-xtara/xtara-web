import {
  BadgeIndianRupee,
  BookOpenCheck,
  BriefcaseBusiness,
  ExternalLink,
  GraduationCap,
  Landmark,
  Lightbulb,
  ListChecks,
  Route,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { DreamCareerDetailProfileV3 } from '@/types/dream-career-detail-profile';

type Props = {
  profile: DreamCareerDetailProfileV3;
  locale: 'en' | 'ml' | 'hi' | 'ta';
};

export default function DreamCareerProfileCards({ profile, locale }: Props) {
  const regulation = profile.requirements.regulation;
  return <>
    {locale !== 'en' ? (
      <Card className="border-amber-200 bg-amber-50/70 shadow-none dark:border-amber-800/50 dark:bg-amber-950/25 lg:col-span-3">
        <CardContent className="p-5 text-sm leading-6 text-amber-950/80 dark:text-amber-100/80">
          This detailed, source-backed profile is currently available in English. The translated career summary above remains available in your selected language.
        </CardContent>
      </Card>
    ) : null}

    <ProfileCard icon={BriefcaseBusiness} title="What the work is really like" span={2}>
      <p>{profile.work.summary}</p>
      <p className="mt-3 font-medium text-foreground">Why it matters</p>
      <p className="mt-1">{profile.work.whyItMatters}</p>
      <ItemList items={profile.work.activities.map((activity) => (
        <span key={activity.id}><strong className="text-foreground">{activity.title}</strong> · {activity.description} <SmallTag>{label(activity.frequency)}</SmallTag></span>
      ))} />
    </ProfileCard>

    <ProfileCard icon={Wrench} title="Work settings">
      {profile.work.settings.map((setting) => <div key={setting.id} className="rounded-xl bg-muted/40 p-4">
        <p className="font-medium text-foreground">{setting.environment}</p>
        <p className="mt-2">{setting.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">{setting.workModes.map((mode) => <Badge key={mode} variant="secondary">{label(mode)}</Badge>)}</div>
        <p className="mt-3 text-xs">Schedule: {label(setting.schedule)} · Travel: {label(setting.travel)}</p>
      </div>)}
    </ProfileCard>

    <ProfileCard icon={Route} title="Education pathways" span={3}>
      <div className="grid gap-4 xl:grid-cols-2">{profile.educationPathways.map((pathway) => <div key={pathway.id} className="rounded-2xl border border-primary/10 p-5">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{pathway.title}</h3><Badge variant="outline">{label(pathway.routeType)}</Badge></div>
        <p className="mt-2">{pathway.description}</p>
        <ol className="mt-4 space-y-3">{pathway.timeline.map((stage) => <li key={stage.id} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{stage.order}</span><span><strong className="text-foreground">{stage.title}</strong><span className="mt-1 block">{stage.description}</span>{stage.streamOptions.length ? <span className="mt-2 block text-xs">Streams: {stage.streamOptions.map((stream) => `${label(stream.stream)} · ${label(stream.relevance)}${stream.subjects.length ? ` (${stream.subjects.join(', ')})` : ''}`).join(' | ')}{stage.streamOptions.map((stream, index) => <span key={`${stream.stream}-${index}`} className="mt-1 block text-muted-foreground">{stream.notes}</span>)}</span> : null}{stage.qualificationExamples.length ? <span className="mt-1 block text-xs">Examples: {stage.qualificationExamples.join(' · ')}</span> : null}{stage.typicalDurationMonths ? <span className="mt-1 block text-xs">Typical duration: {range(stage.typicalDurationMonths)} months</span> : null}</span></li>)}</ol>
        {pathway.entranceExams.length ? <><p className="mt-5 font-medium text-foreground">Entrance and selection</p><ItemList items={pathway.entranceExams.map((exam) => `${exam.name} · ${label(exam.requirement)} · affects ${label(exam.scoreUse)}${exam.benchmarks.length ? ` · ${exam.benchmarks.length} dated benchmark${exam.benchmarks.length === 1 ? '' : 's'}` : ''}`)} /></> : null}
      </div>)}</div>
    </ProfileCard>

    <ProfileCard icon={Sparkles} title="Skills to build" span={2}>
      <div className="grid gap-3 sm:grid-cols-2">{profile.skills.map((skill) => <div key={skill.id} className="rounded-xl bg-muted/40 p-4"><div className="flex flex-wrap gap-2"><strong className="text-foreground">{skill.name}</strong><Badge variant="secondary">{label(skill.importance)}</Badge></div><p className="mt-2">{skill.howUsed}</p><p className="mt-2 text-xs">{label(skill.category)}</p></div>)}</div>
    </ProfileCard>

    <ProfileCard icon={TrendingUp} title="Career timeline">
      <p className="mb-3">{profile.careerTimeline.summary}</p>
      <div className="space-y-3">{profile.careerTimeline.stages.map((stage) => {
        const sourceUnranked = stage.level === 'varies' || stage.track === 'varies';
        const title = stage.level === 'varies' ? stage.commonTitles[0] : label(stage.level);
        const otherTitles = stage.level === 'varies' ? stage.commonTitles.slice(1) : stage.commonTitles;
        return <div key={stage.id} className="rounded-xl border border-primary/10 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-foreground">{stage.order}. {title}</strong>{stage.typicalExperienceYears ? <span className="text-xs">{range(stage.typicalExperienceYears)} years</span> : null}</div><p className="mt-1 text-xs">{[sourceUnranked ? 'Source label only; seniority and track are not standardized' : label(stage.track), ...otherTitles].filter(Boolean).join(' · ')}</p><p className="mt-2">{stage.responsibilities}</p>{stage.progressionSignals.length ? <ItemList items={stage.progressionSignals} /> : null}</div>;
      })}</div>
    </ProfileCard>

    <ProfileCard icon={BadgeIndianRupee} title="Education costs, earnings and payback" span={3}>
      <div className="grid gap-4 lg:grid-cols-3">
        <FinancialColumn title="Government and private fees" items={profile.financials.educationCosts.map((item) => ({ title: `${item.institutionName} · ${formatMoney(item.amount)} ${label(item.feePeriod)}`, body: `${item.programName} · ${label(item.institutionType)} · ${label(item.feeCategory)} · as of ${item.asOf}`, detail: `${educationCostDurationNote(item)} ${item.admissionRoute.description} Score effects: ${item.admissionRoute.scoreEffects.map(label).join(', ')}. Published fee changes with score: ${item.admissionRoute.publishedFeeChangesWithScore ? 'yes' : 'no'}. Includes: ${item.includes.join(', ')}. Excludes: ${item.excludes.join(', ')}.` }))} />
        <FinancialColumn title="Earnings evidence" items={profile.financials.earnings.map((item) => ({ title: `${formatMoney(item.amount)} per year`, body: `${item.geography} · ${label(item.careerStage)} · ${label(item.basis)} · as of ${item.asOf}`, detail: item.evidenceNotes?.join(' ') }))} />
        <FinancialColumn title="Simple gross payback" items={profile.financials.returnOnEducation.map((item) => ({ title: `${range(item.paybackMonths)} months`, body: `Living costs ${item.includesLivingCosts ? 'included' : 'not included'} · Foregone earnings ${item.includesForegoneEarnings ? 'included' : 'not included'}`, detail: item.assumptions.join(' ') }))} />
      </div>
    </ProfileCard>

    <ProfileCard icon={TrendingUp} title="Job outlook" span={2}>
      {profile.outlook.map((item, index) => <div key={`${item.geography}-${index}`} className="rounded-xl bg-muted/40 p-4"><div className="flex flex-wrap items-center gap-2"><strong className="text-foreground">{item.geography}</strong><Badge variant="secondary">{label(item.trend)}</Badge><span className="text-xs">{item.fromYear}–{item.toYear}</span></div><p className="mt-2">{item.summary}</p>{item.metrics.length ? <p className="mt-2 text-xs">{item.metrics.map((metric) => `${metric.name}: ${metric.value} ${label(metric.unit)}`).join(' · ')}</p> : null}</div>)}
    </ProfileCard>

    <ProfileCard icon={Landmark} title="Regulation, exams and licences">
      <p><strong className="text-foreground">{regulation.jurisdiction}</strong> · {label(regulation.status)}</p>
      <p className="mt-2">{regulation.notes}</p>
      {regulation.authorities.length ? <ItemList items={regulation.authorities.map((authority) => <a key={authority.officialUrl} className="font-medium text-primary hover:underline" href={authority.officialUrl} target="_blank" rel="noreferrer">{authority.name}<ExternalLink className="ml-1 inline h-3 w-3" /></a>)} /> : null}
      {profile.requirements.governmentExams.length ? <><p className="mt-4 font-medium text-foreground">Government exams</p><ExamList items={profile.requirements.governmentExams} /></> : <p className="mt-3 text-xs">No role-wide government exam is listed. Recruitment routes can still have their own requirements.</p>}
      {profile.requirements.licences.length ? <><p className="mt-4 font-medium text-foreground">Licences</p><ItemList items={profile.requirements.licences.map((item) => `${item.name} · ${label(item.requirement)} · ${item.authority}`)} /></> : null}
    </ProfileCard>

    <ProfileCard icon={BookOpenCheck} title="Specializations">
      <div className="space-y-3">{profile.specializations.map((item) => <div key={item.id}><strong className="text-foreground">{item.title}</strong><p className="mt-1">{item.description}</p></div>)}</div>
    </ProfileCard>

    <ProfileCard icon={ListChecks} title="Trade-offs" span={2}>
      <div className="grid gap-3 sm:grid-cols-2">{profile.tradeoffs.map((item) => <div key={item.id} className="rounded-xl bg-muted/40 p-4"><div className="flex flex-wrap gap-2"><strong className="text-foreground">{label(item.category)}</strong><Badge variant="outline">{label(item.impact)} impact</Badge></div><p className="mt-2">{item.description}</p></div>)}</div>
    </ProfileCard>

    <ProfileCard icon={Users} title="Notable people">
      {profile.notablePeople.length ? <div className="space-y-3">{profile.notablePeople.map((person) => <a key={person.id} href={person.profileUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-primary/10 p-4 hover:border-primary/30"><strong className="text-foreground">{person.name}</strong><span className="ml-2 text-xs">{person.country} · {label(person.relationship)}</span><p className="mt-2">{person.knownFor}</p><p className="mt-2 text-xs">Why this example matters: {person.whyRelevant}</p></a>)}</div> : <p>No source-backed public example has been approved for this profile yet.</p>}
    </ProfileCard>

    <ProfileCard icon={Lightbulb} title={profile.tryThis.title} span={2} accent>
      <p>{profile.tryThis.purpose}</p><p className="mt-3 text-xs">{profile.tryThis.durationMinutes} minutes · {label(profile.tryThis.cost)}</p>
      <p className="mt-4 font-medium text-foreground">Steps</p><ItemList items={profile.tryThis.steps} />
      <p className="mt-4 font-medium text-foreground">Think about</p><ItemList items={profile.tryThis.reflectionQuestions} />
      {profile.tryThis.safetyNotes.length ? <p className="mt-4 text-xs">Safety: {profile.tryThis.safetyNotes.join(' ')}</p> : null}
    </ProfileCard>

    <ProfileCard icon={GraduationCap} title="Related study and careers">
      <p className="font-medium text-foreground">Course searches</p><div className="mt-2 flex flex-wrap gap-2">{profile.courseQueries.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div>
      {profile.relatedCareerIds.length ? <><p className="mt-4 font-medium text-foreground">Related careers</p><div className="mt-2 flex flex-wrap gap-2">{profile.relatedCareerIds.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></> : null}
    </ProfileCard>

    <ProfileCard icon={ShieldCheck} title="Evidence used for this profile" span={3}>
      <p>Time-sensitive facts can change. Open the evidence and verify current admissions, pay, regulation and recruitment requirements before deciding.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{profile.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-primary/10 p-4 hover:border-primary/30"><strong className="text-foreground">{source.title}</strong><p className="mt-1">{source.organization}</p><p className="mt-2 text-xs">{source.geography} · verified {source.verifiedAt}</p></a>)}</div>
      <p className="mt-4 text-xs">Curated from cited evidence on {profile.provenance.authorship.authoredAt.slice(0, 10)}. Xtara Factory only validated, normalized, checksummed, and packaged this structured record.</p>
    </ProfileCard>
  </>;
}

function ProfileCard({ icon: Icon, title, children, span = 1, accent = false }: { icon: typeof BriefcaseBusiness; title: string; children: React.ReactNode; span?: 1 | 2 | 3; accent?: boolean }) {
  const spanClass = span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : '';
  return <Card className={`${spanClass} shadow-none ${accent ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/25' : 'border-primary/10 bg-card'}`}><CardContent className="p-6 text-sm leading-6 text-muted-foreground sm:p-8"><div className="flex items-center gap-3 text-primary"><Icon className="h-5 w-5" /><h2 className="text-lg font-semibold">{title}</h2></div><div className="mt-4">{children}</div></CardContent></Card>;
}

function ItemList({ items }: { items: React.ReactNode[] }) {
  return <ul className="mt-3 space-y-2">{items.map((item, index) => <li className="flex gap-2" key={index}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>)}</ul>;
}

function ExamList({ items }: { items: DreamCareerDetailProfileV3['requirements']['governmentExams'] }) {
  return <ItemList items={items.map((exam) => <span key={`${exam.name}-${exam.officialUrl}`}><a className="font-medium text-primary hover:underline" href={exam.officialUrl} target="_blank" rel="noreferrer">{exam.name}</a> · {label(exam.requirement)} · {exam.appliesTo}</span>)} />;
}

function FinancialColumn({ title, items }: { title: string; items: Array<{ title: string; body: string; detail?: string }> }) {
  return <div className="rounded-2xl border border-primary/10 p-5"><h3 className="font-semibold text-foreground">{title}</h3><div className="mt-3 space-y-4">{items.map((item, index) => <div key={index}><p className="font-medium text-foreground">{item.title}</p><p className="mt-1">{item.body}</p>{item.detail ? <p className="mt-1 text-xs">{item.detail}</p> : null}</div>)}</div></div>;
}

function educationCostDurationNote(item: DreamCareerDetailProfileV3['financials']['educationCosts'][number]) {
  const evidence = item.durationEvidence || 'program_duration';
  if (evidence === 'not_published' || item.durationMonths === null) return 'Course duration was not published in the reviewed fee source.';
  if (evidence === 'fee_coverage_period') return `Fee coverage period: ${range(item.durationMonths)} months; this is not the course duration.`;
  return `Indicative duration from the reviewed source: ${range(item.durationMonths)} months; actual completion can vary.`;
}

function SmallTag({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 whitespace-nowrap text-xs text-muted-foreground">({children})</span>;
}

function range(value: { min: number; max: number }) {
  return value.min === value.max ? String(value.min) : `${value.min}–${value.max}`;
}

function formatMoney(value: { currency: 'INR'; min: number; max: number }) {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: value.currency, maximumFractionDigits: 0 });
  return value.min === value.max ? formatter.format(value.min) : `${formatter.format(value.min)}–${formatter.format(value.max)}`;
}

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

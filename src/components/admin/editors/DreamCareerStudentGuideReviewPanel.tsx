'use client';

import { useState, type ReactNode } from 'react';
import { BookOpenCheck, Languages } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CuratedDreamCareer } from '@/types/curated-career';
import {
  resolveDreamCareerStudentGuideTranslation,
  type DreamCareerGuideLocale,
  type DreamCareerStudentGuideV1,
} from '@/types/dream-career-student-guide';

const LOCALES: Array<{ id: DreamCareerGuideLocale; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'ta', label: 'Tamil' },
];

export default function DreamCareerStudentGuideReviewPanel({ career }: { career: CuratedDreamCareer }) {
  const [locale, setLocale] = useState<DreamCareerGuideLocale>('en');
  if (!career.studentGuide) return null;

  const guides: Partial<Record<DreamCareerGuideLocale, DreamCareerStudentGuideV1>> = {
    en: career.studentGuide,
  };
  for (const item of LOCALES) {
    if (item.id === 'en') continue;
    const translation = career.studentGuideTranslations?.[item.id];
    if (translation) guides[item.id] = resolveDreamCareerStudentGuideTranslation(career.studentGuide, translation);
  }
  const guide = guides[locale];
  const completeness = career.contentCompleteness;
  const pendingSources = career.studentGuide.sources.filter((source) => source.reviewStatus === 'pending').length;

  return (
    <section className="space-y-5 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5" data-testid="student-guide-admin-review">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-5 text-primary" />
            <h2 className="font-semibold">Student Guide</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Lifecycle-managed guide content. Review every available chapter, translation, evidence source, and known gap here. Changes arrive as a new content version; this form does not flatten the guide into legacy summary fields.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {completeness ? <Badge variant="outline">Guide {completeness.studentGuide}</Badge> : null}
          {completeness ? <Badge variant="outline">Translations {completeness.translations}</Badge> : null}
          <Badge variant={pendingSources ? 'secondary' : 'outline'}>
            {pendingSources ? `${pendingSources} source${pendingSources === 1 ? '' : 's'} pending review` : career.studentGuide.sources.length ? 'Sources marked reviewed' : 'No sources recorded'}
          </Badge>
        </div>
      </div>

      <div aria-label="Student Guide language" className="grid gap-2 sm:grid-cols-4" role="group">
        {LOCALES.map((item) => {
          const available = Boolean(guides[item.id]);
          return (
            <button
              aria-pressed={locale === item.id}
              className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium ${locale === item.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-foreground'} disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={!available}
              key={item.id}
              onClick={() => setLocale(item.id)}
              type="button"
            >
              <span>{item.label}</span>
              <Languages className="size-4" />
            </button>
          );
        })}
      </div>

      {guide ? <StudentGuideDocument guide={guide} /> : (
        <div className="rounded-lg border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          This translation is not available yet. English remains the canonical guide.
        </div>
      )}

      {completeness?.pendingFields.length ? (
        <details className="rounded-lg border bg-background p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Known content gaps ({completeness.pendingFields.length})</summary>
          <ul className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
            {completeness.pendingFields.map((field) => <li className="font-mono text-xs" key={field}>{field}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function StudentGuideDocument({ guide }: { guide: DreamCareerStudentGuideV1 }) {
  const about = guide.aboutCareer;
  const path = guide.howToGetThere;
  const now = guide.whatYouCanDoNow;

  return (
    <div className="space-y-5" data-guide-locale={guide.locale}>
      <ReviewChapter number="01" title="About the career">
        <ReviewText label="What you do" value={about.whatYouDo} />
        <ReviewCollection label="Activities" items={about.activities.map((activity) => (
          <ReviewItem key={activity.id} title={activity.title} meta={evidence(activity.sourceIds)}>{activity.description}</ReviewItem>
        ))} />
        <ReviewCollection label="A day in the life" items={[...about.dayInLife].sort((left, right) => left.order - right.order).map((moment) => (
          <ReviewItem key={moment.id} title={`${moment.timeLabel} · ${moment.title}`} meta={evidence(moment.sourceIds)}>{moment.description}</ReviewItem>
        ))} />
        <ReviewText label="Why it matters" value={about.whyItMatters} />
        <ReviewCollection label="Earnings" items={about.earnings.map((earning) => (
          <ReviewItem
            key={earning.id}
            title={`${formatMoney(earning.amountMin)}–${formatMoney(earning.amountMax)} per ${earning.period}`}
            meta={`${earning.careerStage} · ${earning.geography} · as of ${earning.asOf} · ${evidence(earning.sourceIds)}`}
          />
        ))} />
        <ReviewCollection label="Notable people" items={about.notablePeople.map((person) => (
          <ReviewItem key={person.id} title={person.name} meta={evidence(person.sourceIds)}>{person.whyRelevant}</ReviewItem>
        ))} />
        <IdentifierList label="Related career IDs" values={about.relatedCareerIds} />
      </ReviewChapter>

      <ReviewChapter number="02" title="How to get there">
        <ReviewCollection label="Subjects" items={path.subjects.map((subject) => (
          <ReviewItem key={subject.subjectId} title={subject.subjectId} meta={`${subject.importance} · ${subject.gradeIds.join(', ')} · ${evidence(subject.sourceIds)}`}>{subject.guidance}</ReviewItem>
        ))} />
        <ReviewCollection label="Education routes" items={path.educationRoutes.map((route) => (
          <ReviewItem key={route.id} title={route.title} meta={`${route.routeType} · ${evidence(route.sourceIds)}`}>
            {route.description}
            <IdentifierLine label="Course concepts" values={route.courseConceptIds} />
          </ReviewItem>
        ))} />
        <ReviewCollection label="First-job bridge" items={[...path.firstJobBridge].sort((left, right) => left.order - right.order).map((step) => (
          <ReviewItem key={step.id} title={`${step.order}. ${step.title}`} meta={evidence(step.sourceIds)}>{step.description}</ReviewItem>
        ))} />
        <ReviewCollection label="Career progression" items={[...path.careerProgression].sort((left, right) => left.order - right.order).map((stage) => (
          <ReviewItem key={stage.id} title={`${stage.order}. ${stage.title}`} meta={`${stage.level} · ${evidence(stage.sourceIds)}`}>{stage.description}</ReviewItem>
        ))} />
        <IdentifierList label="Employer link IDs" values={path.employerLinkIds} />
        <IdentifierList label="Opportunity query" values={[path.opportunityQuery.careerId]} />
      </ReviewChapter>

      <ReviewChapter number="03" title="What you can do now">
        <IdentifierList label="Learning resource IDs" values={now.learningResourceIds} />
        <ReviewCollection label="Skills" items={now.skills.map((skill) => (
          <ReviewItem key={skill.skillId} title={skill.skillId} meta={`${skill.importance} · ${evidence(skill.sourceIds)}`}>{skill.howUsed}</ReviewItem>
        ))} />
        <ReviewCollection label="Tools" items={now.tools.map((tool) => (
          <ReviewItem key={tool.toolId} title={tool.toolId} meta={`${tool.importance} · ${evidence(tool.sourceIds)}`}>{tool.whyLearn}</ReviewItem>
        ))} />
        <ReviewCollection label="Entrance exams" items={now.entranceExams.map((exam) => (
          <ReviewItem key={exam.id} title={exam.name} meta={`${exam.requirement} · ${evidence(exam.sourceIds)}`}>
            <a className="break-all text-primary underline-offset-4 hover:underline" href={exam.officialUrl} rel="noreferrer" target="_blank">{exam.officialUrl}</a>
            <IdentifierLine label="Applies to routes" values={exam.appliesToRouteIds} />
          </ReviewItem>
        ))} />
        {now.starterActivity ? (
          <ReviewCollection label="Starter activity" items={[
            <ReviewItem key={now.starterActivity.id} title={now.starterActivity.title} meta={`${now.starterActivity.estimatedMinutes} minutes · ${evidence(now.starterActivity.sourceIds)}`}>{now.starterActivity.description}</ReviewItem>,
          ]} />
        ) : <ReviewCollection label="Starter activity" items={[]} />}
      </ReviewChapter>

      <ReviewChapter number="04" title="Additional topics">
        <ReviewCollection label="Topics" items={guide.additionalTopics.map((topic) => (
          <ReviewItem key={topic.id} title={topic.title} meta={`${topic.chapter} · ${evidence(topic.sourceIds)}`}>
            {topic.summary ? <p>{topic.summary}</p> : null}
            {topic.blocks.map((block, index) => (
              <div className="mt-2" key={`${topic.id}-${block.type}-${index}`}>
                {block.type === 'paragraph' ? <p>{block.text}</p> : null}
                {block.type === 'bullets' ? <ul className="list-disc space-y-1 pl-5">{block.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                {block.type === 'resourceLinks' ? <IdentifierLine label="Resource IDs" values={block.resourceIds} /> : null}
              </div>
            ))}
          </ReviewItem>
        ))} />
      </ReviewChapter>

      <ReviewChapter number="05" title="Evidence and provenance">
        <ReviewCollection label="Embedded sources" items={guide.sources.map((source) => (
          <ReviewItem key={source.id} title={source.label} meta={`${source.organization} · ${source.reviewStatus}${source.lastVerifiedAt ? ` · verified ${source.lastVerifiedAt}` : ''}`}>
            <a className="break-all text-primary underline-offset-4 hover:underline" href={source.url} rel="noreferrer" target="_blank">{source.url}</a>
          </ReviewItem>
        ))} />
        <ReviewText label="Source version" value={guide.provenance.sourceVersion} />
        <IdentifierList label="Provenance source IDs" values={guide.provenance.sourceIds} />
        <ReviewText label="Authored by" value={guide.provenance.authoredBy || ''} />
        <ReviewText label="Authored at" value={guide.provenance.authoredAt || ''} />
      </ReviewChapter>
    </div>
  );
}

function ReviewChapter({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-3 text-lg"><span className="text-xs font-bold tracking-[0.14em] text-primary/70">{number}</span>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function ReviewText({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value.trim() || 'Not provided yet'}</p></div>;
}

function ReviewCollection({ label, items }: { label: string; items: ReactNode[] }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label} · {items.length}</p>
      {items.length ? <div className="mt-3 space-y-3">{items}</div> : <p className="mt-2 text-sm text-muted-foreground">Not provided yet</p>}
    </div>
  );
}

function ReviewItem({ title, meta, children }: { title: string; meta?: string; children?: ReactNode }) {
  return <div className="border-l-2 border-primary/30 pl-3"><p className="text-sm font-semibold">{title}</p>{meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}{children ? <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div> : null}</div>;
}

function IdentifierList({ label, values }: { label: string; values: string[] }) {
  return <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-semibold text-muted-foreground">{label} · {values.length}</p>{values.length ? <div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <Badge key={value} variant="outline">{value}</Badge>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Not provided yet</p>}</div>;
}

function IdentifierLine({ label, values }: { label: string; values: string[] }) {
  return values.length ? <p className="mt-2 text-xs text-muted-foreground">{label}: {values.join(', ')}</p> : null;
}

function evidence(sourceIds: string[]): string {
  return sourceIds.length ? `sources: ${sourceIds.join(', ')}` : 'no source IDs';
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

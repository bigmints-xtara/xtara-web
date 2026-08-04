'use client';

import { ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DreamCareerProfileCards from '@/components/careers/DreamCareerProfileCards';
import type { Challenge, GameInstance, GoodRead, Spark, Story } from '@/types/admin';
import type { CuratedCareerSource, CuratedDreamCareer, FutureDirection } from '@/types/curated-career';

export function StoryPreview({ entity }: { entity: Story }) {
  return (
    <PreviewArticle image={entity.image} kicker={entity.career_clusters?.join(' · ')} title={entity.title}>
      <RichText value={entity.description} />
      {entity.careerRelevance?.length ? <TagList label="Career relevance" values={entity.careerRelevance} /> : null}
      {entity.slides?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Story slides</h2>
          {entity.slides.map((slide, index) => (
            <Card className="shadow-none" key={`${slide.title}-${index}`}>
              <CardHeader><CardTitle className="text-base">{index + 1}. {slide.title || 'Untitled slide'}</CardTitle></CardHeader>
              <CardContent><RichText value={slide.description} /></CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </PreviewArticle>
  );
}

export function GoodReadPreview({ entity }: { entity: GoodRead }) {
  return (
    <PreviewArticle image={entity.image} kicker={[entity.type, entity.domain].filter(Boolean).join(' · ')} title={entity.title}>
      <RichText value={entity.content} />
      {entity.careerRelevance?.length ? <TagList label="Career relevance" values={entity.careerRelevance} /> : null}
      {entity.hyperlink ? <PreviewLink href={entity.hyperlink} label={entity.hyperlinkText || 'Read more'} /> : null}
    </PreviewArticle>
  );
}

export function SparkPreview({ entity }: { entity: Spark }) {
  return (
    <div className="mx-auto flex min-h-[28rem] max-w-3xl items-center justify-center p-6">
      <Card className="w-full overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-none">
        <CardContent className="p-8 sm:p-12">
          <Badge variant="secondary">{entity.type || 'Spark'}</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{entity.title}</h1>
          <p className="mt-4 text-muted-foreground">A short idea presented to learners in the Sparks experience.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ChallengePreview({ entity }: { entity: Challenge }) {
  return (
    <PreviewArticle image={entity.image} kicker={[entity.type, entity.domain].filter(Boolean).join(' · ')} title={entity.title}>
      <RichText value={entity.instructions} />
      <div className="rounded-xl bg-primary/5 p-4 text-sm font-medium">{entity.rewardPerQuestion || 0} points per correct answer</div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Questions</h2>
        {entity.questions?.length ? entity.questions.map((question, index) => (
          <Card className="shadow-none" key={`${question.title}-${index}`}>
            <CardHeader><CardTitle className="text-base">{index + 1}. {question.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div className="rounded-lg border px-3 py-2 text-sm" key={`${option}-${optionIndex}`}>{option}</div>
              ))}
            </CardContent>
          </Card>
        )) : <p className="text-sm text-muted-foreground">No questions have been added.</p>}
      </section>
    </PreviewArticle>
  );
}

export function GamePreview({ entity }: { entity: GameInstance }) {
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <Card className="overflow-hidden shadow-none">
        <div className="bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <Badge className="border-white/20 bg-white/10 text-white" variant="outline">{entity.mode}</Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">{entity.title}</h1>
        </div>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 sm:p-10">
          <PreviewFact label="Starts" value={formatDate(entity.schedule?.startDateTime)} />
          <PreviewFact label="Ends" value={formatDate(entity.schedule?.endDateTime)} />
        </CardContent>
      </Card>
    </div>
  );
}

export function DreamCareerPreview({ entity }: { entity: CuratedDreamCareer }) {
  const copy = entity.translations?.en;
  return (
    <div className="pb-10">
    <PreviewArticle image={entity.imageUrl} kicker="Dream Career" title={copy?.title || entity.slug}>
      <RichText value={copy?.summary || ''} />
      <div className="grid gap-4 sm:grid-cols-2">
        <PreviewFact label="Work setting" value={copy?.workSetting || 'Not specified'} />
        <PreviewFact label="Pathway" value={copy?.pathway || 'Not specified'} />
        <PreviewFact label="Salary range" value={entity.salaryRange || 'Not specified'} />
        <PreviewFact label="Growth outlook" value={entity.growthOutlook || 'Not specified'} />
      </div>
      {copy?.dailyWork?.length ? <TagList label="Daily work" values={copy.dailyWork} /> : null}
      {copy?.specializations?.length ? <TagList label="Specializations" values={copy.specializations} /> : null}
      {copy?.tryThis ? <section><h2 className="text-lg font-semibold">Try this</h2><p className="mt-2 text-muted-foreground">{copy.tryThis}</p></section> : null}
    </PreviewArticle>
    {entity.detailProfile ? <div className="mx-auto max-w-6xl px-6 sm:px-10"><DreamCareerProfileCards locale="en" profile={entity.detailProfile} /></div> : null}
    </div>
  );
}

export function FutureDirectionPreview({ entity }: { entity: FutureDirection }) {
  const copy = entity.translations?.en;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <div className="rounded-2xl border bg-gradient-to-br from-background to-primary/5 p-7 sm:p-10">
        <Badge variant="secondary">Future Direction</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{copy?.title || entity.slug}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{copy?.summary}</p>
        {copy?.reflectionPrompt ? <blockquote className="mt-6 border-l-2 border-primary pl-4 font-medium">{copy.reflectionPrompt}</blockquote> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TagList label="Dream Careers" values={entity.roleIds || []} />
        <TagList label="Skills" values={entity.skillIds || []} />
      </div>
    </div>
  );
}

export function CareerSourcePreview({ entity }: { entity: CuratedCareerSource }) {
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <Card className="shadow-none">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">Verified career source</Badge>
          <CardTitle className="pt-3 text-2xl">{entity.label || entity.slug}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <PreviewFact label="Organization" value={entity.organization || 'Not specified'} />
          <PreviewFact label="Last verified" value={entity.lastVerifiedAt ? formatDate(new Date(entity.lastVerifiedAt)) : 'Not verified'} />
          {entity.url ? <PreviewLink href={entity.url} label="Open official source" /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewArticle({ image, kicker, title, children }: { image?: string; kicker?: string; title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-4xl p-6 sm:p-10">
      {image ? (
        <div className="relative mb-7 aspect-[16/7] overflow-hidden rounded-2xl border bg-muted">
          {/* Admin previews accept editor-provided URLs from arbitrary content providers. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full object-cover" src={image} />
        </div>
      ) : null}
      {kicker ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{kicker}</p> : null}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <div className="mt-7 space-y-7">{children}</div>
    </article>
  );
}

function RichText({ value }: { value: string }) {
  return <div className="space-y-4 text-base leading-7 text-muted-foreground">{value.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>)}</div>;
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return <section><h2 className="text-sm font-semibold">{label}</h2><div className="mt-3 flex flex-wrap gap-2">{values.length ? values.map((value) => <Badge key={value} variant="secondary">{value}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}</div></section>;
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-background p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-sm font-medium leading-6">{value}</p></div>;
}

function PreviewLink({ href, label }: { href: string; label: string }) {
  return <Button asChild><a href={href} rel="noreferrer" target="_blank">{label}<ExternalLink /></a></Button>;
}

function formatDate(value?: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Not scheduled';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

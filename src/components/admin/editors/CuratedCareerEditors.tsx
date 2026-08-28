'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

import { createEmptyCareerSource, careerSourcesConfig } from '@/lib/admin/configs/careerSourcesConfig';
import { createEmptyDreamCareer, isRegulatedStatus } from '@/lib/admin/configs/curatedDreamCareersConfig';
import { createEmptyFutureDirection } from '@/lib/admin/configs/futureDirectionsConfig';
import { AdminService } from '@/lib/services/adminService';
import type { CuratedCareerSource, CuratedDreamCareer, CurationStatus, FutureDirection } from '@/types/curated-career';
import DreamCareerDetailProfileEditor from './DreamCareerDetailProfileEditor';
import DreamCareerStudentGuideReviewPanel from './DreamCareerStudentGuideReviewPanel';
import DreamCareerTranslationReviewPanel from './DreamCareerTranslationReviewPanel';

type EditorProps<T> = {
  entity: T | null;
  onSave: (data: Partial<T>) => Promise<void>;
  onCancel: () => void;
};

export function FutureDirectionEditor({ entity, onSave, onCancel }: EditorProps<FutureDirection>) {
  const [form, setForm] = useState<Omit<FutureDirection, 'id'>>(() => entity || createEmptyFutureDirection());
  const [weights, setWeights] = useState(() => weightsToText(entity?.signalWeights || {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(withPublicationFlags({ ...form, signalWeights: parseWeights(weights) }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this Future Direction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorShell title={entity ? 'Edit Future Direction' : 'Create Future Direction'} saving={saving} error={error} onCancel={onCancel} onSubmit={save}>
      <Section title="Identity and review state" description="Stable IDs and versions keep existing learner results reproducible.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Stable slug"><Input value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="technology" /></Field>
          <Field label="Status"><StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} /></Field>
          <Field label="Schema version"><ReadOnlyValue value={String(form.schemaVersion)} /></Field>
          <Field label="Content version"><NumberInput value={form.version} min={1} onChange={(version) => setForm({ ...form, version })} /></Field>
          <Field label="Display order"><NumberInput value={form.displayOrder} min={0} onChange={(displayOrder) => setForm({ ...form, displayOrder })} /></Field>
          <Field label="Default locale"><Select value={form.defaultLocale} onChange={(value) => setForm({ ...form, defaultLocale: value as 'en' | 'ml' | 'hi' | 'ta' })} options={[['en', 'English'], ['ml', 'Malayalam'], ['hi', 'Hindi'], ['ta', 'Tamil']]} /></Field>
        </div>
      </Section>

      <LocalizedDirectionFields form={form} setForm={setForm} />

      <Section title="Deterministic eligibility rules" description="Only declarative weights are allowed. Family, financial and location channels must never be added here.">
        <Field label="Signal weights" hint="One per line, for example analysis: 3">
          <Textarea value={weights} onChange={setWeights} rows={6} placeholder={'analysis: 3\nmaking: 2'} />
        </Field>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Minimum distinct questions"><NumberInput value={form.minimumEvidence.distinctQuestions} min={2} onChange={(distinctQuestions) => setForm({ ...form, minimumEvidence: { ...form.minimumEvidence, distinctQuestions } })} /></Field>
          <Field label="Minimum contributing signals"><NumberInput value={form.minimumEvidence.distinctSignals} min={2} onChange={(distinctSignals) => setForm({ ...form, minimumEvidence: { ...form.minimumEvidence, distinctSignals } })} /></Field>
          <Field label="Minimum total score"><NumberInput value={form.minimumEvidence.totalScore} min={1} onChange={(totalScore) => setForm({ ...form, minimumEvidence: { ...form.minimumEvidence, totalScore } })} /></Field>
        </div>
      </Section>

      <Section title="Connected catalog content" description="These IDs connect the direction to reviewed roles, skills, tools and learning content.">
        <div className="grid gap-4 md:grid-cols-2">
          <ListField label="Dream Career role IDs" values={form.roleIds} onChange={(roleIds) => setForm({ ...form, roleIds })} />
          <ListField label="Skill IDs" values={form.skillIds} onChange={(skillIds) => setForm({ ...form, skillIds })} />
          <ListField label="Tool IDs" values={form.toolIds} onChange={(toolIds) => setForm({ ...form, toolIds })} />
          <ListField label="College course search terms" values={form.courseQueries || []} onChange={(courseQueries) => setForm({ ...form, courseQueries })} />
          <SourcePicker values={form.provenance.sourceIds} onChange={(sourceIds) => setForm({ ...form, provenance: { ...form.provenance, sourceIds } })} />
        </div>
      </Section>

      <Section title="Grade-specific next steps" description="These alter guidance detail, not the learner's intrinsic direction score.">
        {(['en', 'ml', 'hi', 'ta'] as const).map((locale) => <div key={locale} className="rounded-lg border p-4"><p className="mb-3 text-sm font-semibold">{locale === 'en' ? 'English' : locale === 'ml' ? 'Malayalam' : locale === 'hi' ? 'Hindi' : 'Tamil'}</p>{(['grade8', 'grade9', 'grade10'] as const).map((grade) => (
          <ListField key={grade} label={grade.replace('grade', 'Grade ')} values={form.gradeGuidance[locale]?.[grade] || []} onChange={(items) => setForm({ ...form, gradeGuidance: { ...form.gradeGuidance, [locale]: { ...(form.gradeGuidance[locale] || { grade8: [], grade9: [], grade10: [] }), [grade]: items } } })} multiline />
        ))}</div>)}
      </Section>

      <ReviewFields review={form.review} onChange={(review) => setForm({ ...form, review })} />
    </EditorShell>
  );
}

export function DreamCareerEditor({ entity, onSave, onCancel }: EditorProps<CuratedDreamCareer>) {
  const [form, setForm] = useState<Omit<CuratedDreamCareer, 'id'>>(() => entity || createEmptyDreamCareer());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(withPublicationFlags(withDerivedRegulation(form)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this Dream Career.');
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (locale: 'en' | 'ml' | 'hi' | 'ta', patch: Record<string, string | string[]>) => {
    const current = form.translations[locale] || createEmptyDreamCareer().translations.en;
    setForm({ ...form, translations: { ...form.translations, [locale]: { ...current, ...patch } } });
  };

  return (
    <EditorShell title={entity ? 'Verify Dream Career' : 'Create Dream Career'} saving={saving} error={error} onCancel={onCancel} onSubmit={save}>
      {form.provenance.origin === 'legacy_migration' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This is a legacy record. Verify its stable slug, sources, direction links and Malayalam copy before publishing it.
        </div>
      ) : null}

      <Section title="Identity and review state">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Stable slug"><Input value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="software-developer" /></Field>
          <Field label="Status">{form.status === 'published' ? <ReadOnlyValue value="Published" /> : <StatusSelect allowPublished={false} value={form.status} onChange={(status) => setForm({ ...form, status })} />}</Field>
          <Field label="Schema version"><ReadOnlyValue value={String(form.schemaVersion)} /></Field>
          <Field label="Content version"><NumberInput value={form.version} min={1} onChange={(version) => setForm({ ...form, version })} /></Field>
          <Field label="Default locale"><Select value={form.defaultLocale} onChange={(value) => setForm({ ...form, defaultLocale: value as 'en' | 'ml' | 'hi' | 'ta' })} options={[['en', 'English'], ['ml', 'Malayalam'], ['hi', 'Hindi'], ['ta', 'Tamil']]} /></Field>
        </div>
      </Section>

      {(['en', 'ml', 'hi', 'ta'] as const).map((locale) => {
        const copy = form.translations[locale] || createEmptyDreamCareer().translations.en;
        return (
          <Section key={locale} title={locale === 'en' ? 'English content' : locale === 'ml' ? 'Malayalam content — required for approval' : locale === 'hi' ? 'Hindi content' : 'Tamil content'} description={locale === 'ml' ? 'A reviewed Malayalam title and summary are required before this record can be approved or published.' : undefined}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={locale === 'ml' ? 'Title (required for approval)' : 'Title'}><Input value={copy.title} onChange={(title) => updateTranslation(locale, { title })} /></Field>
              <Field label="Work setting"><Input value={copy.workSetting} onChange={(workSetting) => updateTranslation(locale, { workSetting })} /></Field>
            </div>
            <Field label={locale === 'ml' ? 'Summary (required for approval)' : 'Summary'}><Textarea value={copy.summary} onChange={(summary) => updateTranslation(locale, { summary })} rows={3} /></Field>
            <Field label="Education pathway"><Textarea value={copy.pathway} onChange={(pathway) => updateTranslation(locale, { pathway })} rows={3} /></Field>
            <Field label="Try this"><Textarea value={copy.tryThis} onChange={(tryThis) => updateTranslation(locale, { tryThis })} rows={2} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <ListField label="Daily work" values={copy.dailyWork} onChange={(dailyWork) => updateTranslation(locale, { dailyWork })} multiline />
              <ListField label="Tradeoffs" values={copy.tradeoffs} onChange={(tradeoffs) => updateTranslation(locale, { tradeoffs })} multiline />
              <ListField label="Specializations" values={copy.specializations} onChange={(specializations) => updateTranslation(locale, { specializations })} multiline />
            </div>
          </Section>
        );
      })}

      <DreamCareerStudentGuideReviewPanel
        career={{ ...form, id: entity?.id || form.slug } as CuratedDreamCareer}
      />

      <Section title="Career facts" description="Use reviewed, role-specific sources for time-sensitive claims.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Salary range"><Input value={form.salaryRange || ''} onChange={(salaryRange) => setForm({ ...form, salaryRange })} placeholder="India range, experience level, and source year" /></Field>
          <Field label="Growth outlook"><Input value={form.growthOutlook || ''} onChange={(growthOutlook) => setForm({ ...form, growthOutlook })} placeholder="Plain-language outlook with geography and review period" /></Field>
        </div>
        <Field label="Career image"><Input type="url" value={form.imageUrl || ''} onChange={(imageUrl) => setForm({ ...form, imageUrl })} placeholder="https://…" /></Field>
        <ListField label="College course search terms" values={form.courseQueries || []} onChange={(courseQueries) => setForm({ ...form, courseQueries })} />
      </Section>

      <Section title="Regulation" description="Choose an explicit status. The regulated value is derived from this selection and cannot drift.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Regulation status (required for approval)">
            <Select
              value={form.regulation?.status || ''}
              onChange={(status) => {
                if (!status) {
                  setForm({ ...form, regulated: false, regulation: undefined });
                  return;
                }
                const nextStatus = status as NonNullable<CuratedDreamCareer['regulation']>['status'];
                setForm({
                  ...form,
                  regulated: isRegulatedStatus(nextStatus),
                  regulation: {
                    status: nextStatus,
                    jurisdiction: form.regulation?.jurisdiction || 'India',
                    authoritySourceIds: form.regulation?.authoritySourceIds || [],
                  },
                });
              }}
              options={[
                ['', 'Choose regulation status'],
                ['regulated', 'Role is regulated'],
                ['education-regulated', 'Education route is regulated'],
                ['requirements-vary', 'Requirements vary'],
                ['not-role-regulated', 'Role is not regulated'],
              ]}
            />
          </Field>
          <Field label="Jurisdiction (required for approval)"><Input value={form.regulation?.jurisdiction || ''} onChange={(jurisdiction) => setForm({ ...form, regulation: { status: form.regulation?.status || 'requirements-vary', jurisdiction, authoritySourceIds: form.regulation?.authoritySourceIds || [] }, regulated: isRegulatedStatus(form.regulation?.status || 'requirements-vary') })} placeholder="India" /></Field>
          <Field label="Derived regulated value"><ReadOnlyValue value={form.regulation ? String(isRegulatedStatus(form.regulation.status)) : 'Select a regulation status'} /></Field>
        </div>
        <SourcePicker
          label="Regulation authority sources"
          description="Select the reviewed authorities that support this regulation status."
          values={form.regulation?.authoritySourceIds || []}
          onChange={(authoritySourceIds) => setForm({ ...form, regulation: { status: form.regulation?.status || 'requirements-vary', jurisdiction: form.regulation?.jurisdiction || 'India', authoritySourceIds }, regulated: isRegulatedStatus(form.regulation?.status || 'requirements-vary') })}
        />
      </Section>

      <DreamCareerTranslationReviewPanel career={{ ...form, id: entity?.id || form.slug } as CuratedDreamCareer} />

      <DreamCareerDetailProfileEditor
        careerId={entity?.id || form.slug}
        profile={form.detailProfile}
        review={form.detailProfileReview}
        onChange={(detailProfile, detailProfileReview) => setForm({
          ...form,
          ...(detailProfile ? { detailProfile } : { detailProfile: undefined }),
          ...(detailProfileReview ? { detailProfileReview } : { detailProfileReview: undefined }),
        })}
      />

      <Section title="Catalog relationships">
        <div className="grid gap-4 md:grid-cols-2">
          <ListField label="Future Direction IDs" values={form.futureDirectionIds} onChange={(futureDirectionIds) => setForm({ ...form, futureDirectionIds })} />
          <Field label="Primary Future Direction"><Input value={form.primaryFutureDirectionId} onChange={(primaryFutureDirectionId) => setForm({ ...form, primaryFutureDirectionId })} /></Field>
          <ListField label="Skill IDs" values={form.skillIds} onChange={(skillIds) => setForm({ ...form, skillIds })} />
          <ListField label="Tool IDs" values={form.toolIds} onChange={(toolIds) => setForm({ ...form, toolIds })} />
          <SourcePicker label="Career evidence sources" description="Select one or more published sources. Draft or in-review sources remain visible but do not satisfy approval." values={form.sourceIds} onChange={(sourceIds) => setForm({ ...form, sourceIds, provenance: { ...form.provenance, sourceIds } })} />
          <ListField label="Legacy document IDs" values={form.provenance.legacyDocumentIds} onChange={(legacyDocumentIds) => setForm({ ...form, provenance: { ...form.provenance, legacyDocumentIds } })} />
        </div>
      </Section>

      <ApprovalFields review={form.review} onChange={(review) => setForm({ ...form, review })} />
    </EditorShell>
  );
}

export function CareerSourceEditor({ entity, onSave, onCancel }: EditorProps<CuratedCareerSource>) {
  const [form, setForm] = useState<Omit<CuratedCareerSource, 'id'>>(() => entity || createEmptyCareerSource());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(withPublicationFlags(form));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this Career Source.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorShell title={entity ? 'Verify Career Source' : 'Create Career Source'} saving={saving} error={error} onCancel={onCancel} onSubmit={save}>
      <Section title="Source identity" description="Career content can publish only against a reviewed source in this registry.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Stable source ID"><Input value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="ncs" /></Field>
          <Field label="Status"><StatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} /></Field>
          <Field label="Schema version"><ReadOnlyValue value={String(form.schemaVersion)} /></Field>
          <Field label="Content version"><NumberInput value={form.version} min={1} onChange={(version) => setForm({ ...form, version })} /></Field>
        </div>
        <Field label="Source label"><Input value={form.label} onChange={(label) => setForm({ ...form, label })} placeholder="National Career Service" /></Field>
        <Field label="Organization"><Input value={form.organization} onChange={(organization) => setForm({ ...form, organization })} /></Field>
        <Field label="Official URL"><Input type="url" value={form.url} onChange={(url) => setForm({ ...form, url })} placeholder="https://…" /></Field>
        <Field label="Last verified at"><Input type="date" value={form.lastVerifiedAt?.slice(0, 10) || ''} onChange={(lastVerifiedAt) => setForm({ ...form, lastVerifiedAt })} /></Field>
      </Section>
      <ReviewFields review={form.review} onChange={(review) => setForm({ ...form, review })} />
    </EditorShell>
  );
}

function SourcePicker({ values, onChange, label = 'Verified sources', description = 'Only published sources satisfy publication checks.' }: { values: string[]; onChange: (values: string[]) => void; label?: string; description?: string }) {
  const [sources, setSources] = useState<CuratedCareerSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    new AdminService(careerSourcesConfig).getPage({ page: 1, limit: 50 })
      .then((page) => { if (!cancelled) setSources(page.items); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load sources.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const knownIds = new Set(sources.map((source) => source.id));
  const unknownIds = loading ? [] : values.filter((id) => !knownIds.has(id));
  const toggle = (id: string, checked: boolean) => onChange(checked
    ? Array.from(new Set([...values, id]))
    : values.filter((value) => value !== id));

  return (
    <fieldset className="rounded-lg border p-4 md:col-span-2">
      <legend className="px-1 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{description}</p>
        <Link href="/admin/career-sources" className="text-xs font-semibold text-blue-600 hover:underline">Manage sources</Link>
      </div>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading source registry…</p> : null}
      {error ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}
      {!loading && !error && !sources.length ? <p className="mt-3 text-sm text-slate-500">Create and publish a source before linking career content.</p> : null}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {sources.map((source) => (
          <label key={source.id} className="flex items-start gap-3 rounded-lg border bg-white p-3 text-sm">
            <input type="checkbox" checked={values.includes(source.id)} onChange={(event) => toggle(source.id, event.target.checked)} className="mt-0.5" />
            <span><span className="font-medium text-slate-900">{source.label}</span><span className={`block text-xs ${source.status === 'published' ? 'text-emerald-700' : 'text-amber-700'}`}>{source.id} · {source.status === 'published' ? 'Ready for approval' : `${source.status} — not ready`}</span></span>
          </label>
        ))}
      </div>
      {unknownIds.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Unknown source IDs</p>
          <div className="mt-2 flex flex-wrap gap-2">{unknownIds.map((id) => <button key={id} type="button" onClick={() => toggle(id, false)} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs">{id} ×</button>)}</div>
        </div>
      ) : null}
    </fieldset>
  );
}

function LocalizedDirectionFields({ form, setForm }: { form: Omit<FutureDirection, 'id'>; setForm: (value: Omit<FutureDirection, 'id'>) => void }) {
  return <>{(['en', 'ml', 'hi', 'ta'] as const).map((locale) => {
    const copy = form.translations[locale] || { title: '', summary: '', reflectionPrompt: '' };
    const update = (patch: Partial<typeof copy>) => setForm({ ...form, translations: { ...form.translations, [locale]: { ...copy, ...patch } } });
    return <Section key={locale} title={locale === 'en' ? 'English content' : locale === 'ml' ? 'Malayalam content' : locale === 'hi' ? 'Hindi content' : 'Tamil content'}>
      <Field label="Title"><Input value={copy.title} onChange={(title) => update({ title })} /></Field>
      <Field label="Summary"><Textarea value={copy.summary} onChange={(summary) => update({ summary })} rows={2} /></Field>
      <Field label="Reflection prompt"><Textarea value={copy.reflectionPrompt} onChange={(reflectionPrompt) => update({ reflectionPrompt })} rows={4} /></Field>
    </Section>;
  })}</>;
}

function ReviewFields({ review, onChange }: { review: { reviewedBy?: string; reviewedAt?: string; notes?: string }; onChange: (review: { reviewedBy?: string; reviewedAt?: string; notes?: string }) => void }) {
  return <Section title="Human review" description="Publishing should follow a named editorial review, never an AI-generated verdict.">
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Reviewed by"><Input value={review.reviewedBy || ''} onChange={(reviewedBy) => onChange({ ...review, reviewedBy })} /></Field>
      <Field label="Reviewed at"><Input type="date" value={review.reviewedAt?.slice(0, 10) || ''} onChange={(reviewedAt) => onChange({ ...review, reviewedAt })} /></Field>
    </div>
    <Field label="Review notes"><Textarea value={review.notes || ''} onChange={(notes) => onChange({ ...review, notes })} rows={3} /></Field>
  </Section>;
}

function ApprovalFields({ review, onChange }: { review: { reviewedBy?: string; reviewedAt?: string; notes?: string }; onChange: (review: { reviewedBy?: string; reviewedAt?: string; notes?: string }) => void }) {
  return <Section title="Approval" description="Reviewer identity and time are recorded automatically by the Approve action.">
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Reviewed by"><ReadOnlyValue value={review.reviewedBy || 'Not approved'} /></Field>
      <Field label="Reviewed at"><ReadOnlyValue value={review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : 'Not approved'} /></Field>
    </div>
    <Field label="Review notes"><Textarea value={review.notes || ''} onChange={(notes) => onChange({ ...review, notes })} rows={3} /></Field>
  </Section>;
}

function withPublicationFlags<T extends { status: CurationStatus }>(value: T): T & { published: boolean; inReview: boolean; draft: boolean } {
  return { ...value, published: value.status === 'published', inReview: value.status === 'inReview', draft: value.status === 'draft' };
}

export function withDerivedRegulation<T extends Pick<CuratedDreamCareer, 'regulated' | 'regulation'>>(value: T): T {
  return { ...value, regulated: isRegulatedStatus(value.regulation?.status) };
}

function weightsToText(weights: Record<string, number>) {
  return Object.entries(weights).map(([key, value]) => `${key}: ${value}`).join('\n');
}

function parseWeights(value: string): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const line of value.split('\n').map((item) => item.trim()).filter(Boolean)) {
    const [key, rawWeight] = line.split(':').map((item) => item.trim());
    const weight = Number(rawWeight);
    if (!key || !Number.isFinite(weight) || weight <= 0) throw new Error(`Invalid signal weight: ${line}`);
    weights[key] = weight;
  }
  if (!Object.keys(weights).length) throw new Error('Add at least one signal weight.');
  return weights;
}

function EditorShell({ title, saving, error, onCancel, onSubmit, children }: { title: string; saving: boolean; error: string; onCancel: () => void; onSubmit: (event: React.FormEvent) => void; children: React.ReactNode }) {
  return <form onSubmit={onSubmit} className="flex h-full flex-col bg-slate-50">
    <div className="flex items-center justify-between border-b bg-white p-5">
      <div><h2 className="text-xl font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">Curated, deterministic content</p></div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"><X size={16} />Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Save size={16} />{saving ? 'Saving…' : 'Save draft'}</button>
      </div>
    </div>
    {error ? <p role="alert" className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p> : null}
    <div className="flex-1 space-y-5 overflow-y-auto p-5">
      {children}
    </div>
  </form>;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-white p-5"><h3 className="font-semibold text-slate-900">{title}</h3>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}<div className="mt-4 space-y-4">{children}</div></section>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700">{label}</span>{hint ? <span className="ml-2 text-xs text-slate-400">{hint}</span> : null}<div className="mt-1.5">{children}</div></label>;
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
}

function ReadOnlyValue({ value }: { value: string }) {
  return <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-600">{value}</div>;
}

function NumberInput({ value, min, onChange }: { value: number; min: number; onChange: (value: number) => void }) {
  return <input type="number" min={min} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
}

function Textarea({ value, onChange, rows, placeholder }: { value: string; onChange: (value: string) => void; rows: number; placeholder?: string }) {
  return <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function StatusSelect({ value, onChange, allowPublished = true }: { value: CurationStatus; onChange: (value: CurationStatus) => void; allowPublished?: boolean }) {
  const options: Array<[string, string]> = [["draft", "Draft"], ["inReview", "In review"], ["retired", "Retired"]];
  if (allowPublished) options.splice(2, 0, ["published", "Published"]);
  return <Select value={value} onChange={(next) => onChange(next as CurationStatus)} options={options} />;
}

function ListField({ label, values, onChange, multiline = false }: { label: string; values: string[]; onChange: (values: string[]) => void; multiline?: boolean }) {
  const value = values.join(multiline ? '\n' : ', ');
  const update = (raw: string) => onChange(raw.split(multiline ? '\n' : ',').map((item) => item.trim()).filter(Boolean));
  return <Field label={label} hint={multiline ? 'One item per line' : 'Comma separated'}>{multiline ? <Textarea value={value} onChange={update} rows={4} /> : <Input value={value} onChange={update} />}</Field>;
}

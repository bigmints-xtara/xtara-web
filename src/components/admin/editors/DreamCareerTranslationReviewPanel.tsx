'use client';

import { useState } from 'react';
import { CheckCircle2, CircleDashed, Languages } from 'lucide-react';

import DreamCareerProfileCards from '@/components/careers/DreamCareerProfileCards';
import { Badge } from '@/components/ui/badge';
import { translationLocaleCoverage } from '@/lib/admin/configs/curatedDreamCareersConfig';
import type { CuratedDreamCareer } from '@/types/curated-career';
import type { DreamCareerDetailProfileV3 } from '@/types/dream-career-detail-profile';

type Locale = 'en' | 'ml' | 'hi' | 'ta';

const LOCALES: Array<{ id: Locale; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'hi', label: 'Hindi' },
  { id: 'ta', label: 'Tamil' },
];

export default function DreamCareerTranslationReviewPanel({ career }: { career: CuratedDreamCareer }) {
  const [locale, setLocale] = useState<Locale>('en');
  const operation = career.translationOperation;
  if (!operation && !career.detailProfileTranslations) return null;

  const profileFor = (requested: Locale) => requested === 'en'
    ? career.detailProfile
    : career.detailProfileTranslations?.[requested];
  const localeCoverage = Object.fromEntries(LOCALES.map(({ id }) => [id, translationLocaleCoverage(career, id)])) as Record<Locale, ReturnType<typeof translationLocaleCoverage>>;
  const complete = LOCALES.filter(({ id }) => localeCoverage[id].state === 'complete').length;
  const coverageRecorded = LOCALES.every(({ id }) => localeCoverage[id].state !== 'unavailable');
  const standard = career.translations[locale];
  const profile = profileFor(locale);
  const selectedCoverage = localeCoverage[locale];
  const selectedCoverageText = selectedCoverage.totalFields === null
    ? 'Coverage unavailable'
    : `${selectedCoverage.translatedFields} of ${selectedCoverage.totalFields} fields ${locale === 'en' ? 'canonical' : 'translated'}`;

  return (
    <section className="space-y-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Languages className="size-5 text-blue-700" /><h2 className="font-semibold text-slate-950">Translation coverage</h2></div>
          <p className="mt-1 text-sm font-medium text-amber-800">Machine translation draft — not approved</p>
          <p className="mt-1 text-sm text-slate-600">Review the standard copy and rich-profile preview for each language. Approval and publication remain separate Admin actions.</p>
        </div>
        <Badge className="bg-white text-blue-900" variant="outline">{coverageRecorded ? `${complete} of 4 languages complete` : 'Coverage not recorded'}</Badge>
      </div>

      {operation ? (
        <dl className="grid gap-3 rounded-lg border bg-white p-3 text-xs sm:grid-cols-2">
          <div><dt className="font-medium text-slate-500">Source release</dt><dd className="mt-1 break-all font-mono text-slate-800">{operation.sourceReleaseId}</dd></div>
          <div><dt className="font-medium text-slate-500">Translation run</dt><dd className="mt-1 break-all font-mono text-slate-800">{operation.runId}</dd></div>
        </dl>
      ) : null}

      <div aria-label="Translation language" className="grid gap-2 sm:grid-cols-4" role="group">
        {LOCALES.map((item) => {
          const coverage = localeCoverage[item.id];
          const coverageState = coverage.state;
          const ready = coverageState === 'complete';
          return (
            <button
              aria-pressed={locale === item.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium ${locale === item.id ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
              key={item.id}
              onClick={() => setLocale(item.id)}
              data-coverage-state={coverageState}
              type="button"
            >
              <span>
                <span className="block">{item.label}</span>
                <span className="block text-xs font-normal opacity-80">
                  {coverage.totalFields === null
                    ? 'Coverage unavailable'
                    : `${coverage.translatedFields} of ${coverage.totalFields} fields`}
                </span>
              </span>
              {ready ? <CheckCircle2 className="size-4" /> : <CircleDashed className="size-4" />}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard content</p>
          {standard?.title?.trim() || standard?.summary?.trim() ? (
            <><h3 className="mt-2 text-xl font-semibold text-slate-950">{standard?.title || 'Untitled'}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{standard?.summary || 'Summary missing'}</p></>
          ) : <p className="mt-2 text-sm text-amber-800">Standard {LOCALES.find((item) => item.id === locale)?.label} content is missing.</p>}
        </div>
        {standard ? (
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <ReviewField label="Work setting" value={standard.workSetting} />
            <ReviewField label="Education pathway" value={standard.pathway} />
            <ReviewField label="Try this" value={standard.tryThis} />
            <ReviewField label="Daily work" value={standard.dailyWork?.join('\n')} />
            <ReviewField label="Trade-offs" value={standard.tradeoffs?.join('\n')} />
            <ReviewField label="Specialisations" value={standard.specializations?.join('\n')} />
          </dl>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {selectedCoverage.state === 'complete' ? 'Complete rich profile' : selectedCoverage.state === 'partial' ? 'Partial rich profile' : 'Rich profile'}
          </p>
          <p className="text-xs text-slate-600">
            {selectedCoverageText}. English fallback may appear for fields that are not translated yet.
          </p>
        </div>
        {profile ? (
          <div className="grid gap-5 rounded-xl border bg-white p-4 lg:grid-cols-3">
            <DreamCareerProfileCards locale="en" profile={profile as DreamCareerDetailProfileV3} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-amber-800">Rich {LOCALES.find((item) => item.id === locale)?.label} profile is missing.</div>
        )}
      </div>
    </section>
  );
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{value?.trim() || 'Not provided'}</dd></div>;
}

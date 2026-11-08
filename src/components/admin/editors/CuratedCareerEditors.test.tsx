import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import exampleProfile from '@/test-fixtures/cybersecurity-analyst.detail-profile-v3.json';
import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import type { DreamCareerDetailProfileReview, DreamCareerDetailProfileV3 } from '@/types/dream-career-detail-profile';
import type { DreamCareerStudentGuideV1 } from '@/types/dream-career-student-guide';
import { DreamCareerPreview } from '../AdminContentPreview';
import DreamCareerDetailProfileEditor, { createEmptyProfile, validateAdminProfile } from './DreamCareerDetailProfileEditor';
import { CareerSourceEditor, DreamCareerEditor, FutureDirectionEditor, withDerivedRegulation } from './CuratedCareerEditors';

const COVERAGE_PROTECTED_KEYS = new Set([
  'actions', 'admissionRoute', 'asOf', 'authoredAt', 'authorType', 'basis',
  'careerStage', 'category', 'contentHash', 'cost', 'country', 'currency',
  'durationEvidence', 'employmentType', 'feeCategory', 'feePeriod', 'frequency',
  'geography', 'importance', 'institutionType', 'level', 'locale', 'method',
  'model', 'officialUrl', 'period', 'profileUrl', 'publishedAt', 'relationship',
  'relevance', 'requirement', 'routeType', 'schedule', 'schemaVersion', 'scoreType',
  'scoreEffects', 'scoreUse', 'sourceType', 'stageType', 'status', 'stream', 'tool',
  'toolVersion', 'track', 'travel', 'trend', 'url', 'verifiedAt', 'workModes',
]);

function coverageProtectedPath(path: Array<string | number>): boolean {
  const labels = path.map(String);
  const key = labels.at(-1) || '';
  const parent = labels.at(-2) || '';
  return COVERAGE_PROTECTED_KEYS.has(key)
    || COVERAGE_PROTECTED_KEYS.has(parent)
    || key === 'id'
    || key.endsWith('Id')
    || key.endsWith('Ids')
    || parent.endsWith('Id')
    || parent.endsWith('Ids')
    || labels.includes('provenance')
    || (labels.includes('notablePeople') && key === 'name')
    || (labels.includes('sources') && key === 'organization')
    || (labels.includes('entranceExams') && ['name', 'authority'].includes(key))
    || ['programName', 'jurisdiction'].includes(key)
    || parent === 'courseQueries';
}

function coverageFieldCount(value: unknown): number {
  let count = 0;
  const visit = (current: unknown, path: Array<string | number>) => {
    if (Array.isArray(current)) {
      current.forEach((child, index) => visit(child, [...path, index]));
    } else if (current && typeof current === 'object') {
      Object.entries(current).forEach(([key, child]) => visit(child, [...path, key]));
    } else if (typeof current === 'string' && current.trim() && !coverageProtectedPath(path)) {
      count += 1;
    }
  };
  visit(value, []);
  return count;
}

function translateCoverageFields<T>(value: T, locale: string): T {
  const visit = (current: unknown, path: Array<string | number>): unknown => {
    if (Array.isArray(current)) return current.map((child, index) => visit(child, [...path, index]));
    if (current && typeof current === 'object') {
      return Object.fromEntries(Object.entries(current).map(([key, child]) => [
        key,
        visit(child, [...path, key]),
      ]));
    }
    return typeof current === 'string' && current.trim() && !coverageProtectedPath(path)
      ? `${locale}: ${current}`
      : current;
  };
  return visit(value, []) as T;
}

function translationLocaleCoverage(
  locale: 'en' | 'ml' | 'hi' | 'ta',
  translatedFields: number,
  totalFields: number,
) {
  const tokens = Array.from({ length: totalFields }, (_, index) => `T${String(index).padStart(5, '0')}`);
  const translatedFieldTokens = locale === 'en' ? [] : tokens.slice(0, translatedFields);
  return {
    canonical: locale === 'en',
    complete: translatedFields === totalFields,
    totalFields,
    translatedFieldTokens,
    fieldStatus: Object.fromEntries(tokens.map((token) => [
      token,
      locale === 'en' ? 'canonical' : translatedFieldTokens.includes(token) ? 'translated' : 'missing',
    ])),
  };
}

function studentGuide(locale: 'en' | 'ml' = 'en'): DreamCareerStudentGuideV1 {
  const localized = locale === 'ml';
  return {
    schemaVersion: 1,
    careerId: 'administrative-officer',
    locale,
    aboutCareer: {
      whatYouDo: localized ? 'പൊതു സേവനങ്ങൾ ക്രമീകരിക്കുന്നു.' : 'Keeps public services organized.',
      activities: [{ id: 'process-applications', title: 'Process applications', description: 'Checks records and coordinates decisions.', sourceIds: ['government-careers'] }],
      dayInLife: [{ id: 'morning-checks', order: 1, timeLabel: '9:00', title: 'Morning checks', description: 'Reviews the day’s priorities.', sourceIds: ['government-careers'] }],
      whyItMatters: 'Reliable administration helps services reach people.',
      earnings: [{ id: 'associate-india', careerStage: 'associate', geography: 'India', currency: 'INR', amountMin: 300000, amountMax: 600000, period: 'year', asOf: '2026', sourceIds: ['government-careers'] }],
      notablePeople: [],
      relatedCareerIds: ['office-manager'],
    },
    howToGetThere: {
      subjects: [{ subjectId: 'social-science', importance: 'helpful', guidance: 'Learn how institutions work.', gradeIds: ['grade9'], sourceIds: ['government-careers'] }],
      educationRoutes: [{ id: 'public-administration-degree', routeType: 'degree', title: 'Public administration degree', description: 'Builds policy and administration foundations.', courseConceptIds: ['public-administration'], sourceIds: ['government-careers'] }],
      firstJobBridge: [{ id: 'entry-role', order: 1, title: 'Start in an entry role', description: 'Build practical office experience.', sourceIds: ['government-careers'] }],
      careerProgression: [{ id: 'senior-administrator', order: 1, level: 'senior', title: 'Senior Administrator', description: 'Leads larger operations.', sourceIds: ['government-careers'] }],
      employerLinkIds: ['government-departments'],
      opportunityQuery: { careerId: 'administrative-officer' },
    },
    whatYouCanDoNow: {
      learningResourceIds: ['intro-public-administration'],
      skills: [{ skillId: 'record-keeping', importance: 'core', howUsed: 'Maintains accurate decisions and records.', sourceIds: ['government-careers'] }],
      tools: [{ toolId: 'office-suite', importance: 'important', whyLearn: 'Supports documents, schedules, and reporting.', sourceIds: ['government-careers'] }],
      entranceExams: [{ id: 'civil-services', name: 'Civil Services', requirement: 'onePossibleRoute', appliesToRouteIds: ['public-administration-degree'], officialUrl: 'https://example.com/exam', sourceIds: ['government-careers'] }],
      starterActivity: { id: 'organize-a-process', title: 'Organize a simple process', description: 'Map the steps in a school office request.', estimatedMinutes: 30, sourceIds: ['government-careers'] },
    },
    additionalTopics: [],
    sources: [{ id: 'government-careers', label: 'Government careers portal', organization: 'Public Service', url: 'https://example.com/careers', reviewStatus: 'pending' }],
    provenance: { sourceVersion: 'gx10-english-careers', sourceIds: ['government-careers'] },
  };
}

describe('curated career admin editors', () => {
  it('renders every deterministic Future Direction control', () => {
    const html = renderToStaticMarkup(
      <FutureDirectionEditor entity={null} onSave={async () => undefined} onCancel={() => undefined} />,
    );

    expect(html).toContain('Create Future Direction');
    expect(html).toContain('English content');
    expect(html).toContain('Malayalam content');
    expect(html).toContain('Tamil content');
    expect(html).toContain('Signal weights');
    expect(html).toContain('Minimum distinct questions');
    expect(html).toContain('Minimum contributing signals');
    expect(html).toContain('College course search terms');
    expect(html).toContain('Grade-specific next steps');
    expect(html).toContain('Human review');
  });

  it('renders every Dream Career approval prerequisite', () => {
    const html = renderToStaticMarkup(
      <DreamCareerEditor entity={null} onSave={async () => undefined} onCancel={() => undefined} />,
    );

    expect(html).toContain('Create Dream Career');
    expect(html).toContain('Regulation status (required for approval)');
    expect(html).toContain('Jurisdiction (required for approval)');
    expect(html).toContain('Regulation authority sources');
    expect(html).toContain('Malayalam content — required for approval');
    expect(html).toContain('College course search terms');
    expect(html).toContain('Salary range');
    expect(html).toContain('Growth outlook');
    expect(html).toContain('Future Direction IDs');
    expect(html).toContain('Career evidence sources');
    expect(html).toContain('Manage sources');
    expect(html).toContain('Legacy document IDs');
    expect(html).toContain('Approval');
    expect(html).toContain('Reviewer identity and time are recorded automatically by the Approve action.');
    expect(html).toContain('Not approved');
    expect(html).toContain('Structured career profile');
    expect(html).toContain('Add structured profile');
  });

  it('reviews the first-class Student Guide and its available translations without flattening it into legacy fields', () => {
    const entity = {
      ...createEmptyDreamCareer(),
      id: 'administrative-officer',
      slug: 'administrative-officer',
      studentGuide: studentGuide(),
      studentGuideTranslations: {
        ml: { locale: 'ml', aboutCareer: { whatYouDo: studentGuide('ml').aboutCareer.whatYouDo } },
      },
      contentCompleteness: {
        schemaVersion: 1,
        studentGuide: 'partial',
        translations: 'partial',
        evidence: 'partial',
        tagging: 'complete',
        directionMapping: 'complete',
        qa: 'partial',
        pendingFields: ['studentGuide.sources.government-careers.reviewStatus'],
      },
    } as import('@/types/curated-career').CuratedDreamCareer;

    render(<DreamCareerEditor entity={entity} onSave={async () => undefined} onCancel={() => undefined} />);

    const guide = screen.getByTestId('student-guide-admin-review');
    expect(within(guide).getByText('Keeps public services organized.')).toBeInTheDocument();
    expect(within(guide).getByText('Public administration degree')).toBeInTheDocument();
    expect(within(guide).getByText('record-keeping')).toBeInTheDocument();
    expect(within(guide).getByText('office-suite')).toBeInTheDocument();
    expect(within(guide).getByText('Government careers portal')).toBeInTheDocument();
    expect(within(guide).getByText('1 source pending review')).toBeInTheDocument();

    fireEvent.click(within(guide).getByRole('button', { name: 'Malayalam' }));
    expect(within(guide).getByText('പൊതു സേവനങ്ങൾ ക്രമീകരിക്കുന്നു.')).toBeInTheDocument();
  });

  it('uses the Student Guide in Admin preview and suppresses legacy placeholders and profile fallback', () => {
    const entity = {
      ...createEmptyDreamCareer(),
      id: 'administrative-officer',
      slug: 'administrative-officer',
      studentGuide: studentGuide(),
      detailProfile: exampleProfile,
    } as unknown as import('@/types/curated-career').CuratedDreamCareer;

    render(<DreamCareerPreview entity={entity} />);

    expect(screen.getByTestId('student-guide-admin-review')).toBeInTheDocument();
    expect(screen.getByText('Keeps public services organized.')).toBeInTheDocument();
    expect(screen.queryByText('Not specified')).not.toBeInTheDocument();
    expect(screen.queryByText('Information Security Analysts, O*NET 15-1212.00')).not.toBeInTheDocument();
  });

  it('serializes the regulated boolean from the selected regulation status', async () => {
    let saved: Partial<import('@/types/curated-career').CuratedDreamCareer> | undefined;
    const onSave = async (value: Partial<import('@/types/curated-career').CuratedDreamCareer>) => { saved = value; };
    render(<DreamCareerEditor entity={null} onSave={onSave} onCancel={() => undefined} />);

    fireEvent.change(screen.getByLabelText('Regulation status (required for approval)'), { target: { value: 'education-regulated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(saved).toBeDefined());
    expect(saved?.regulation).toEqual({ status: 'education-regulated', jurisdiction: 'India', authoritySourceIds: [] });
    expect(saved?.regulated).toBe(true);

    expect(withDerivedRegulation({ regulated: true, regulation: { status: 'not-role-regulated', jurisdiction: 'India', authoritySourceIds: [] } }).regulated).toBe(false);
  });

  it('creates authorship-only admin drafts and explains the processor-owned boundary', () => {
    const profile = createEmptyProfile('teacher');
    expect(profile.provenance.authorship.method).toBe('human_research');
    expect(profile.provenance.processing).toBeUndefined();

    const html = renderToStaticMarkup(
      <DreamCareerDetailProfileEditor
        careerId="teacher"
        profile={profile}
        review={{ status: 'pending', sourceReviews: [] }}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('Awaiting processing metadata');
    expect(html).not.toContain('Processing version');
  });

  it('renders every v3 profile section and per-source approval control', () => {
    const profile = exampleProfile as DreamCareerDetailProfileV3;
    const review: DreamCareerDetailProfileReview = {
      status: 'inReview',
      sourceReviews: profile.sources.map((source) => ({ sourceId: source.id, status: 'pending' })),
    };
    const entity = { ...createEmptyDreamCareer(), id: profile.careerId, slug: profile.careerId, detailProfile: profile, detailProfileReview: review };
    const html = renderToStaticMarkup(<DreamCareerEditor entity={entity} onSave={async () => undefined} onCancel={() => undefined} />);

    for (const label of ['Work and settings', 'Education pathways', 'Skills and progression', 'Education costs, earnings and ROI', 'Outlook, regulation, exams and licences', 'Specialisations, trade-offs and people', 'Try this career', 'Evidence sources', 'Editorial approval']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('Information Security Analysts, O*NET 15-1212.00');
    expect(html).toContain('Source review');
    expect(html).toContain('Content SHA-256');
    expect(html).toContain('Outlook metrics');
  });

  it('lets Admin reviewers inspect standard and rich translation coverage by locale', () => {
    const profile = exampleProfile as DreamCareerDetailProfileV3;
    const englishStandard = { ...createEmptyDreamCareer().translations.en, title: 'Cybersecurity Analyst', summary: 'English standard summary' };
    const totalFields = coverageFieldCount({ standard: englishStandard, detailProfile: profile });
    const translated = (locale: 'ml' | 'hi' | 'ta', summary: string) => ({
      ...translateCoverageFields(profile, locale),
      locale,
      work: { ...translateCoverageFields(profile.work, locale), summary },
    });
    const translatedStandard = (locale: 'ml' | 'hi' | 'ta', title: string, summary: string) => ({
      ...translateCoverageFields(englishStandard, locale),
      title,
      summary,
    });
    const sourceReleaseId = 'dream-careers-approved-52-e205d2beeb4c';
    const entity = {
      ...createEmptyDreamCareer(),
      id: profile.careerId,
      slug: profile.careerId,
      detailProfile: profile,
      translations: {
        en: englishStandard,
        ml: translatedStandard('ml', 'സൈബർ സുരക്ഷാ അനലിസ്റ്റ്', 'Malayalam standard summary'),
        hi: translatedStandard('hi', 'साइबर सुरक्षा विश्लेषक', 'Hindi standard summary'),
        ta: translatedStandard('ta', 'இணையப் பாதுகாப்புப் பகுப்பாய்வாளர்', 'Tamil standard summary'),
      },
      detailProfileTranslations: {
        ml: translated('ml', 'Malayalam rich profile summary'),
        hi: translated('hi', 'Hindi rich profile summary'),
        ta: translated('ta', 'Tamil rich profile summary'),
      },
      translationOperation: {
        schemaVersion: 1,
        operation: 'dream-career-translation',
        sourceReleaseId,
        sourceTaskId: '019fb4e3-0bd4-7c03-b711-3ee428ac5039',
        sourceCareerId: profile.careerId,
        sourceSha256: 'a'.repeat(64),
        translationSha256: 'b'.repeat(64),
        runId: 'run-20260819-001',
        idempotencyKey: `${sourceReleaseId}:${profile.careerId}`,
        translationCoverage: {
          canonicalLocale: 'en',
          releaseBlocking: false,
          locales: Object.fromEntries((['en', 'ml', 'hi', 'ta'] as const).map((locale) => [
            locale,
            translationLocaleCoverage(locale, totalFields, totalFields),
          ])),
        },
      },
    } as unknown as import('@/types/curated-career').CuratedDreamCareer;

    render(<DreamCareerEditor entity={entity} onSave={async () => undefined} onCancel={() => undefined} />);

    expect(screen.getByText('Machine translation draft — not approved')).toBeInTheDocument();
    expect(screen.getByText('4 of 4 languages complete')).toBeInTheDocument();
    expect(screen.getByText(sourceReleaseId)).toBeInTheDocument();
    expect(screen.getByText('run-20260819-001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Malayalam/ }));
    expect(screen.getAllByText('Malayalam standard summary')).not.toHaveLength(0);
    expect(screen.getByText('Malayalam rich profile summary')).toBeInTheDocument();
    expect(screen.getByText('Complete rich profile')).toBeInTheDocument();
  });

  it('never marks fallback-filled partial guide coverage ready', () => {
    const profile = exampleProfile as DreamCareerDetailProfileV3;
    const englishStandard = { ...createEmptyDreamCareer().translations.en, title: 'Cybersecurity Analyst', summary: 'English standard summary' };
    const totalFields = coverageFieldCount({ standard: englishStandard, detailProfile: profile });
    const entity = {
      ...createEmptyDreamCareer(),
      id: profile.careerId,
      slug: profile.careerId,
      detailProfile: profile,
      translations: {
        en: englishStandard,
        hi: { ...englishStandard, title: 'साइबर सुरक्षा विश्लेषक' },
      },
      detailProfileTranslations: { hi: { ...structuredClone(profile), locale: 'hi' } },
      translationOperation: {
        schemaVersion: 1,
        operation: 'dream-career-translation',
        sourceReleaseId: 'release-partial',
        sourceTaskId: 'source-task',
        sourceCareerId: profile.careerId,
        sourceSha256: 'a'.repeat(64),
        translationSha256: 'b'.repeat(64),
        runId: 'run-partial',
        idempotencyKey: `release-partial:${profile.careerId}`,
        translationCoverage: {
          canonicalLocale: 'en',
          releaseBlocking: false,
          locales: {
            en: translationLocaleCoverage('en', totalFields, totalFields),
            ml: translationLocaleCoverage('ml', 0, totalFields),
            hi: translationLocaleCoverage('hi', 1, totalFields),
            ta: translationLocaleCoverage('ta', 0, totalFields),
          },
        },
      },
    } as unknown as import('@/types/curated-career').CuratedDreamCareer;

    render(<DreamCareerEditor entity={entity} onSave={async () => undefined} onCancel={() => undefined} />);

    expect(screen.getByText('1 of 4 languages complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hindi/ })).toHaveAttribute('data-coverage-state', 'partial');
    fireEvent.click(screen.getByRole('button', { name: /Hindi/ }));
    expect(screen.getByText('Partial rich profile')).toBeInTheDocument();
    expect(screen.queryByText('Complete rich profile')).not.toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`1 of ${totalFields} fields translated`))).not.toHaveLength(0);
  });

  it('shows approval blockers until every profile source is reviewed', () => {
    const profile = exampleProfile as DreamCareerDetailProfileV3;
    const review: DreamCareerDetailProfileReview = {
      status: 'approved', reviewedBy: 'Editor', reviewedAt: '2026-08-02',
      sourceReviews: profile.sources.map((source) => ({ sourceId: source.id, status: 'pending' })),
    };
    expect(validateAdminProfile(profile, review, profile.careerId)).toContain(`Approve source ${profile.sources[0].id} before approving the profile.`);
    const html = renderToStaticMarkup(<DreamCareerDetailProfileEditor careerId={profile.careerId} profile={profile} review={review} onChange={() => undefined} />);
    expect(html).toContain('Profile needs attention');
  });

  it('accepts and edits generic government fees and source-unranked stages', () => {
    const profile = structuredClone(exampleProfile) as DreamCareerDetailProfileV3;
    profile.financials.educationCosts[0].institutionType = 'government';
    profile.careerTimeline.stages[0].level = 'varies';
    profile.careerTimeline.stages[0].track = 'varies';
    profile.careerTimeline.stages[0].progressionSignals = [];
    const review: DreamCareerDetailProfileReview = {
      status: 'inReview',
      sourceReviews: profile.sources.map((source) => ({ sourceId: source.id, status: 'pending' })),
    };

    expect(validateAdminProfile(profile, review, profile.careerId)).not.toContain('Add a government or government-aided fee scenario.');
    const html = renderToStaticMarkup(<DreamCareerDetailProfileEditor careerId={profile.careerId} profile={profile} review={review} onChange={() => undefined} />);
    expect(html).toContain('value="government"');
    expect(html).toContain('value="varies"');
  });

  it('supports an honest unpublished fee duration in the admin editor', () => {
    const profile = structuredClone(exampleProfile) as DreamCareerDetailProfileV3;
    const cost = profile.financials.educationCosts[0];
    cost.durationMonths = null;
    cost.durationEvidence = 'not_published';
    const review: DreamCareerDetailProfileReview = {
      status: 'inReview',
      sourceReviews: profile.sources.map((source) => ({ sourceId: source.id, status: 'pending' })),
    };

    expect(validateAdminProfile(profile, review, profile.careerId)).not.toContain(`Education cost ${cost.id} needs duration evidence set to not published when duration is empty.`);
    const html = renderToStaticMarkup(<DreamCareerDetailProfileEditor careerId={profile.careerId} profile={profile} review={review} onChange={() => undefined} />);
    expect(html).toContain('Duration evidence');
    expect(html).toContain('value="not_published" selected');
    expect(html).toContain('No course duration will be shown to learners');

    delete cost.durationEvidence;
    expect(validateAdminProfile(profile, review, profile.careerId)).toContain(`Education cost ${cost.id} needs duration evidence set to not published when duration is empty.`);
  });

  it('renders the human-verification fields for Career Sources', () => {
    const html = renderToStaticMarkup(
      <CareerSourceEditor entity={null} onSave={async () => undefined} onCancel={() => undefined} />,
    );

    expect(html).toContain('Create Career Source');
    expect(html).toContain('Stable source ID');
    expect(html).toContain('Official URL');
    expect(html).toContain('Last verified at');
    expect(html).toContain('Human review');
  });
});

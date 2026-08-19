import { renderToStaticMarkup } from 'react-dom/server';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import exampleProfile from '../../../../../xtara-api/scripts/fixtures/cybersecurity-analyst.detail-profile-v3.json';
import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import type { DreamCareerDetailProfileReview, DreamCareerDetailProfileV3 } from '@/types/dream-career-detail-profile';
import DreamCareerDetailProfileEditor, { createEmptyProfile, validateAdminProfile } from './DreamCareerDetailProfileEditor';
import { CareerSourceEditor, DreamCareerEditor, FutureDirectionEditor, withDerivedRegulation } from './CuratedCareerEditors';

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
    const translated = (locale: 'ml' | 'hi' | 'ta', summary: string) => ({
      ...structuredClone(profile),
      locale,
      work: { ...structuredClone(profile.work), summary },
    });
    const sourceReleaseId = 'dream-careers-approved-52-e205d2beeb4c';
    const entity = {
      ...createEmptyDreamCareer(),
      id: profile.careerId,
      slug: profile.careerId,
      detailProfile: profile,
      translations: {
        en: { ...createEmptyDreamCareer().translations.en, title: 'Cybersecurity Analyst', summary: 'English standard summary' },
        ml: { ...createEmptyDreamCareer().translations.en, title: 'സൈബർ സുരക്ഷാ അനലിസ്റ്റ്', summary: 'Malayalam standard summary' },
        hi: { ...createEmptyDreamCareer().translations.en, title: 'साइबर सुरक्षा विश्लेषक', summary: 'Hindi standard summary' },
        ta: { ...createEmptyDreamCareer().translations.en, title: 'இணையப் பாதுகாப்புப் பகுப்பாய்வாளர்', summary: 'Tamil standard summary' },
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
      },
    } as unknown as import('@/types/curated-career').CuratedDreamCareer;

    render(<DreamCareerEditor entity={entity} onSave={async () => undefined} onCancel={() => undefined} />);

    expect(screen.getByText('Machine translation draft — not approved')).toBeInTheDocument();
    expect(screen.getByText('4 of 4 languages complete')).toBeInTheDocument();
    expect(screen.getByText(sourceReleaseId)).toBeInTheDocument();
    expect(screen.getByText('run-20260819-001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Malayalam' }));
    expect(screen.getAllByText('Malayalam standard summary')).not.toHaveLength(0);
    expect(screen.getByText('Malayalam rich profile summary')).toBeInTheDocument();
    expect(screen.getByText('Complete rich profile')).toBeInTheDocument();
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

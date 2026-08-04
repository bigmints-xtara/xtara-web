import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DreamCareerDetailProfileV3 } from '@/types/dream-career-detail-profile';
import DreamCareerProfileCards from './DreamCareerProfileCards';

const sourced = { sourceIds: ['official-source'] };
const profile: DreamCareerDetailProfileV3 = {
  schemaVersion: 3,
  careerId: 'example-career',
  locale: 'en',
  work: {
    summary: 'Investigates practical problems.',
    whyItMatters: 'Helps people make safer decisions.',
    activities: [{ id: 'investigate', title: 'Investigate evidence', description: 'Check reliable evidence.', frequency: 'daily', ...sourced }],
    settings: [{ id: 'office', environment: 'Project team', workModes: ['hybrid'], schedule: 'standard_hours', travel: 'occasional', description: 'Works with a team.', ...sourced }],
  },
  educationPathways: [{ id: 'degree-route', title: 'Degree and projects', routeType: 'school_to_degree', description: 'Combine study and practice.', timeline: [{ id: 'grade-10', order: 1, stageType: 'grade_10', title: 'Build foundations', description: 'Practise clear reasoning.', requirement: 'required', streamOptions: [], qualificationExamples: ['Grade 10'], ...sourced }, { id: 'higher-secondary', order: 2, stageType: 'higher_secondary', title: 'Higher Secondary', description: 'Choose an accepted stream.', requirement: 'required', streamOptions: [{ stream: 'any_stream', relevance: 'accepted', subjects: [], notes: 'Any stream is accepted.', ...sourced }], qualificationExamples: ['Class 12'], ...sourced }, { id: 'degree', order: 3, stageType: 'undergraduate', title: 'Relevant degree', description: 'Complete a relevant undergraduate route.', requirement: 'one_possible_route', streamOptions: [], qualificationExamples: ['Relevant degree'], ...sourced }], entranceExams: [], ...sourced }],
  skills: [{ id: 'analysis', name: 'Analysis', category: 'human', importance: 'core', howUsed: 'Compare evidence.', ...sourced }],
  careerTimeline: { model: 'illustrative', summary: 'This is an illustrative timeline and people may take different specialist or management routes.', stages: [{ id: 'junior', order: 1, level: 'junior', track: 'individual_contributor', commonTitles: ['Junior Analyst'], typicalExperienceYears: { min: 0, max: 2 }, responsibilities: 'Works with guidance while building reliable investigation and documentation habits.', progressionSignals: ['Handles routine cases accurately'], ...sourced }] },
  financials: {
    educationCosts: [{ id: 'degree-cost', educationPathwayId: 'degree-route', educationStageId: 'degree', institutionName: 'Example Government College', programName: 'Relevant degree', campus: null, institutionType: 'central_government', feeCategory: 'estimated_program_cost', admissionRoute: { basis: 'qualifying_marks', entranceExamIds: [], selectionBenchmarkIds: [], seatCategory: 'open', scoreEffects: ['eligibility', 'none_on_published_fee'], publishedFeeChangesWithScore: false, description: 'Qualifying marks affect eligibility but do not change the published fee.' }, geography: 'India', amount: { currency: 'INR', min: 100000, max: 200000 }, feePeriod: 'total_program', durationMonths: { min: 36, max: 48 }, basis: 'estimated_program_cost', asOf: '2026', includes: ['Tuition'], excludes: ['Living costs'], ...sourced }],
    earnings: [{ id: 'entry-pay', careerStage: 'junior', employmentType: 'salaried', geography: 'India', amount: { currency: 'INR', min: 400000, max: 600000 }, period: 'year', basis: 'reported_income', asOf: '2026', evidenceNotes: ['Based on 120 reports across experience levels; not a starting salary or guaranteed offer.'], ...sourced }],
    returnOnEducation: [{ id: 'payback', educationCostId: 'degree-cost', earningsScenarioId: 'entry-pay', method: 'simple_gross_payback', paybackMonths: { min: 6, max: 12 }, includesLivingCosts: false, includesForegoneEarnings: false, assumptions: ['Gross comparison only.'], ...sourced }],
  },
  outlook: [{ geography: 'India', fromYear: 2026, toYear: 2028, trend: 'growing', summary: 'Demand depends on current skills.', metrics: [], ...sourced }],
  requirements: { regulation: { status: 'not_verified', jurisdiction: 'India', authorities: [], notes: 'No regulator evidence is included in this compact renderer fixture.', ...sourced }, governmentExams: [], licences: [] },
  specializations: [{ id: 'research', title: 'Research', description: 'Studies difficult questions.', ...sourced }],
  tradeoffs: [{ id: 'learning', category: 'study_commitment', impact: 'medium', description: 'Requires continued learning.', ...sourced }],
  notablePeople: [{ id: 'a-leader', name: 'A. Leader', relationship: 'field_leader', knownFor: 'Public work that learners can review.', whyRelevant: 'Shows a source-backed example for learners.', country: 'India', profileUrl: 'https://example.test/person', ...sourced }],
  tryThis: { title: 'Try a small investigation', purpose: 'Practise checking a claim safely.', durationMinutes: 30, cost: 'free', materials: ['Notes'], steps: ['Choose a public claim.', 'Find two sources.', 'Explain what you learned.'], reflectionQuestions: ['What evidence changed your view?', 'What remains uncertain?'], safetyNotes: ['Use public information only.'] },
  relatedCareerIds: ['related-career'],
  courseQueries: ['Relevant degree'],
  sources: [{ id: 'official-source', sourceType: 'government', title: 'Official evidence', organization: 'Public agency', url: 'https://example.test/source', geography: 'India', publishedAt: null, verifiedAt: '2026-08-02', contentHash: 'a'.repeat(64) }],
  provenance: { authorship: { method: 'agent_research', authorType: 'codex_subagent', curatorId: 'test-curator', batchId: 'b01', authoredAt: '2026-08-02T00:00:00Z' }, processing: { tool: 'xtara-factory', actions: ['validate', 'normalize', 'checksum', 'package'], toolVersion: 'test-v3' } },
};

describe('DreamCareerProfileCards', () => {
  it('renders work, pathways, ROI, prominent people, activity and evidence', () => {
    render(<DreamCareerProfileCards profile={profile} locale="en" />);
    expect(screen.getByText('What the work is really like')).toBeInTheDocument();
    expect(screen.getByText('Degree and projects')).toBeInTheDocument();
    expect(screen.getByText('Example Government College · ₹1,00,000–₹2,00,000 Total Program')).toBeInTheDocument();
    expect(screen.getByText('6–12 months')).toBeInTheDocument();
    expect(screen.getByText(/Based on 120 reports across experience levels/)).toBeInTheDocument();
    expect(screen.getByText('A. Leader')).toBeInTheDocument();
    expect(screen.getByText('Try a small investigation')).toBeInTheDocument();
    expect(screen.getByText('Official evidence')).toBeInTheDocument();
  });

  it('states when the source-backed profile is English-only', () => {
    render(<DreamCareerProfileCards profile={profile} locale="ml" />);
    expect(screen.getByText(/currently available in English/)).toBeInTheDocument();
  });

  it('renders unverified stream evidence without implying that every stream is accepted', () => {
    const unverifiedProfile = structuredClone(profile);
    unverifiedProfile.educationPathways[0].timeline[1].streamOptions = [{
      stream: 'not_verified',
      relevance: 'varies',
      subjects: [],
      notes: 'The reviewed source does not establish an accepted stream; verify provider rules.',
      ...sourced,
    }];
    render(<DreamCareerProfileCards profile={unverifiedProfile} locale="en" />);
    expect(screen.getByText(/Streams: Not Verified · Varies/)).toBeInTheDocument();
    expect(screen.getByText(/does not establish an accepted stream/)).toBeInTheDocument();
    expect(screen.queryByText(/Streams: Any Stream/)).not.toBeInTheDocument();
  });

  it('renders generic government fees and source-unranked stages honestly', () => {
    const honestProfile = structuredClone(profile);
    honestProfile.financials.educationCosts[0].institutionType = 'government';
    honestProfile.careerTimeline.stages[0] = {
      ...honestProfile.careerTimeline.stages[0],
      level: 'varies',
      track: 'varies',
      commonTitles: ['Entry Level Ethical Hacker'],
      progressionSignals: [],
    };

    render(<DreamCareerProfileCards profile={honestProfile} locale="en" />);
    expect(screen.getByText('1. Entry Level Ethical Hacker')).toBeInTheDocument();
    expect(screen.getByText('Source label only; seniority and track are not standardized')).toBeInTheDocument();
    expect(screen.queryByText('1. Varies')).not.toBeInTheDocument();
    expect(screen.getByText(/Relevant degree · Government · Estimated Program Cost/)).toBeInTheDocument();
    expect(screen.queryByText('Handles routine cases accurately')).not.toBeInTheDocument();
  });

  it('distinguishes program duration, fee coverage, and unpublished duration', () => {
    const programProfile = structuredClone(profile);
    render(<DreamCareerProfileCards profile={programProfile} locale="en" />);
    expect(screen.getByText(/Indicative duration from the reviewed source: 36–48 months; actual completion can vary/)).toBeInTheDocument();

    const coverageProfile = structuredClone(profile);
    coverageProfile.financials.educationCosts[0].durationEvidence = 'fee_coverage_period';
    render(<DreamCareerProfileCards profile={coverageProfile} locale="en" />);
    expect(screen.getByText(/Fee coverage period: 36–48 months; this is not the course duration/)).toBeInTheDocument();

    const unpublishedProfile = structuredClone(profile);
    unpublishedProfile.financials.educationCosts[0].durationMonths = null;
    unpublishedProfile.financials.educationCosts[0].durationEvidence = 'not_published';
    render(<DreamCareerProfileCards profile={unpublishedProfile} locale="en" />);
    expect(screen.getByText(/Course duration was not published in the reviewed fee source/)).toBeInTheDocument();
  });
});

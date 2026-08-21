import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  DreamCareerStudentGuide,
  DreamCareerStudentGuideError,
  DreamCareerStudentGuideLoading,
} from './DreamCareerStudentGuide';
import type { DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';

const questionIds = [
  'whatYouDo',
  'dayInLife',
  'whyItMatters',
  'earnings',
  'notablePeople',
  'relatedCareers',
  'subjects',
  'educationRoutes',
  'coursesAndColleges',
  'firstJobBridge',
  'careerProgression',
  'employers',
  'opportunities',
  'learningResources',
  'skills',
  'tools',
  'entranceExams',
  'starterActivity',
] as const;

function response(): DreamCareerStudentGuideResponse {
  const coverageItems = questionIds.map((questionId) => ({
    questionId,
    chapter: questionId === 'whatYouDo'
      || questionId === 'dayInLife'
      || questionId === 'whyItMatters'
      || questionId === 'earnings'
      || questionId === 'notablePeople'
      || questionId === 'relatedCareers'
      ? 'aboutCareer' as const
      : questionId === 'subjects'
        || questionId === 'educationRoutes'
        || questionId === 'coursesAndColleges'
        || questionId === 'firstJobBridge'
        || questionId === 'careerProgression'
        || questionId === 'employers'
        || questionId === 'opportunities'
        ? 'howToGetThere' as const
        : 'whatYouCanDoNow' as const,
    status: 'available' as const,
    itemCount: 1,
    evidence: { paths: [], sourceIds: ['source-one'] },
  }));

  return {
    career: {
      id: 'data-engineer',
      title: 'Data Engineer',
      summary: 'Builds dependable data systems that help people make better decisions.',
      imageUrl: 'https://images.example/data-engineer.jpg',
      futureDirectionIds: ['technology'],
    },
    guide: {
      schemaVersion: 1,
      careerId: 'data-engineer',
      locale: 'en',
      aboutCareer: {
        whatYouDo: 'Designs, builds, and maintains reliable data systems.',
        activities: [
          { id: 'activity-1', title: 'Design data flows', description: 'Plan how information moves safely.', sourceIds: ['source-one'] },
          { id: 'activity-2', title: 'Build pipelines', description: 'Turn raw records into useful datasets.', sourceIds: ['source-one'] },
          { id: 'activity-3', title: 'Check quality', description: 'Find gaps before teams use the data.', sourceIds: ['source-one'] },
          { id: 'activity-4', title: 'Improve reliability', description: 'Keep systems healthy as demand grows.', sourceIds: ['source-one'] },
        ],
        dayInLife: [
          { id: 'moment-1', order: 1, timeLabel: 'Morning', title: 'Review overnight data', description: 'Check pipeline health and investigate alerts.', sourceIds: ['source-one'] },
          { id: 'moment-2', order: 2, timeLabel: 'Afternoon', title: 'Build with analysts', description: 'Shape a clean dataset for a new question.', sourceIds: ['source-one'] },
        ],
        whyItMatters: 'Reliable information helps hospitals, schools, and businesses make sound decisions.',
        earnings: [{
          id: 'earning-1',
          careerStage: 'junior',
          geography: 'India',
          currency: 'INR',
          amountMin: 600000,
          amountMax: 900000,
          period: 'year',
          asOf: '2026-08-01',
          sourceIds: ['source-one'],
        }],
        notablePeople: [{ id: 'person-1', name: 'A reviewed engineer', whyRelevant: 'Made dependable data systems easier to understand.', sourceIds: ['source-one'] }],
        relatedCareerIds: ['analytics-engineer'],
      },
      howToGetThere: {
        subjects: [{ subjectId: 'subject-mathematics', importance: 'core', guidance: 'Use mathematics to reason about patterns and scale.', gradeIds: ['grade8', 'grade9', 'grade10'], sourceIds: ['source-one'] }],
        educationRoutes: [{ id: 'route-1', routeType: 'degree', title: 'Computing degree', description: 'Study programming, databases, and systems.', courseConceptIds: ['course-computing'], sourceIds: ['source-one'] }],
        firstJobBridge: [{ id: 'step-1', order: 1, title: 'Build a small portfolio', description: 'Show a working pipeline and explain the choices you made.', sourceIds: ['source-one'] }],
        careerProgression: [{ id: 'stage-1', order: 1, level: 'junior', title: 'Junior data engineer', description: 'Owns well-defined pipelines with team support.', sourceIds: ['source-one'] }],
        employerLinkIds: ['employer-link-1'],
        opportunityQuery: { careerId: 'data-engineer' },
      },
      whatYouCanDoNow: {
        learningResourceIds: ['resource-1'],
        skills: [{ skillId: 'skill-problem-solving', importance: 'core', howUsed: 'Break a large data problem into testable steps.', sourceIds: ['source-one'] }],
        tools: [{ toolId: 'tool-sql', importance: 'core', whyLearn: 'Use it to ask precise questions of structured data.', sourceIds: ['source-one'] }],
        entranceExams: [{ id: 'exam-1', name: 'JEE Main', requirement: 'onePossibleRoute', appliesToRouteIds: ['route-1'], officialUrl: 'https://jeemain.nta.nic.in/', sourceIds: ['source-one'] }],
        starterActivity: { id: 'starter-1', title: 'Clean a tiny dataset', description: 'Find and fix duplicate rows in a simple table.', estimatedMinutes: 30, sourceIds: ['source-one'] },
      },
      additionalTopics: [],
      sources: [{ id: 'source-one', label: 'Reviewed career source', organization: 'Xtara Editorial', url: 'https://example.com/source', reviewStatus: 'reviewed', lastVerifiedAt: '2026-08-01T00:00:00Z' }],
      provenance: { sourceVersion: 'student-guide-v1', sourceIds: ['source-one'], authoredAt: '2026-08-01T00:00:00Z', authoredBy: 'Xtara Editorial' },
    },
    resolved: {
      relatedCareers: [{ id: 'analytics-engineer', title: 'Analytics Engineer', summary: 'Turns prepared data into useful models.', futureDirectionIds: ['technology'] }],
      courseOptions: [{ id: 'offering-1', courseConceptId: 'course-computing', courseTitle: 'BTech Computer Science', institution: { id: 'college-1', name: 'IIT Example', city: 'Kochi', state: 'Kerala', country: 'India' }, match: 'direct', releaseId: 'release-1' }],
      employers: [{ id: 'employer-1', name: 'Data Systems India', geography: 'India', verifiedAt: '2026-08-01T00:00:00Z', website: 'https://example.com/employer', evidenceSourceIds: ['source-one'] }],
      opportunities: [{ id: 'opportunity-1', providerId: 'provider-1', providerName: 'Learning Lab', title: 'Data engineering internship', kind: 'internship', opensAt: '2026-08-01T00:00:00Z', closesAt: '2026-09-01T00:00:00Z' }],
      learningResources: [{ id: 'resource-1', title: 'SQL for beginners', providerName: 'Open Learning', url: 'https://example.com/sql', level: 'beginner', cost: 'free' }],
    },
    coverage: {
      items: coverageItems,
      byQuestion: Object.fromEntries(coverageItems.map((item) => [item.questionId, item])) as unknown as DreamCareerStudentGuideResponse['coverage']['byQuestion'],
    },
    relationshipErrors: [],
  };
}

describe('DreamCareerStudentGuide', () => {
  it('renders the three chapters in order and exposes all 18 learner questions when facts are available', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual([
      'About the career',
      'How to get there',
      'What I can do now',
    ]);
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      "What you'll do",
      'A day in the life',
      'Why it matters',
      'What you could earn',
      'People to learn from',
      'Related careers',
      'Subjects to focus on now',
      'Study routes',
      'Courses, colleges and cost',
      'From graduation to a first job',
      'Career progression',
      'Companies that hire for this career',
      'Internship opportunities',
      'Starter courses and online resources',
      'Skills to build',
      'Tools to learn',
      'Entrance exams to consider',
      'Try this now',
    ]);
  });

  it('omits unavailable optional answers instead of rendering empty cards or guesses', () => {
    const value = response();
    value.guide.aboutCareer.dayInLife = [];
    value.guide.aboutCareer.earnings = [];
    value.guide.aboutCareer.notablePeople = [];
    value.guide.aboutCareer.relatedCareerIds = [];
    value.guide.howToGetThere.employerLinkIds = [];
    value.guide.whatYouCanDoNow.tools = [];
    value.resolved.relatedCareers = [];
    value.resolved.employers = [];
    value.resolved.opportunities = [];

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('heading', { name: 'A day in the life' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'What you could earn' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'People to learn from' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Related careers' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Companies that hire for this career' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Internship opportunities' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tools to learn' })).not.toBeInTheDocument();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
  });

  it('uses accepted relationship IDs for canonical career and college links', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getByRole('link', { name: 'Analytics Engineer' })).toHaveAttribute('href', '/explore/roles/analytics-engineer');
    expect(screen.getByRole('link', { name: /IIT Example/i })).toHaveAttribute('href', '/colleges/college-1');
  });

  it('discloses long lists progressively with an explicit See all control', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.queryByText('Improve reliability')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See all' }));
    expect(screen.getByText('Improve reliability')).toBeInTheDocument();
  });

  it('keeps canonical narrative visible and retries only a failed relationship subsection', () => {
    const value = response();
    value.resolved.opportunities = [];
    value.relationshipErrors = [{ subsection: 'opportunities', code: 'temporarily_unavailable', retryable: true }];
    const retry = vi.fn();

    render(<DreamCareerStudentGuide response={value} locale="en" onRetryRelationship={retry} />);

    expect(screen.getByText('Designs, builds, and maintains reliable data systems.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Internship opportunities' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry internship opportunities' }));
    expect(retry).toHaveBeenCalledWith('opportunities');
  });

  it('keeps stale time-sensitive content out of the learner page', () => {
    const value = response();
    value.coverage.byQuestion.learningResources.status = 'stale';
    value.coverage.items.find((item) => item.questionId === 'learningResources')!.status = 'stale';

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('heading', { name: 'Starter courses and online resources' })).not.toBeInTheDocument();
    expect(screen.queryByText('SQL for beginners')).not.toBeInTheDocument();
  });

  it('provides keyboard-focusable chapter anchors with exact destinations', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    const about = screen.getByRole('link', { name: 'About the career' });
    const path = screen.getByRole('link', { name: 'How to get there' });
    const now = screen.getByRole('link', { name: 'What I can do now' });
    expect(about).toHaveAttribute('href', '#about-career');
    expect(path).toHaveAttribute('href', '#how-to-get-there');
    expect(now).toHaveAttribute('href', '#what-you-can-do-now');
    about.focus();
    expect(about).toHaveFocus();
  });

  it('uses localized chapter and learner-question labels', () => {
    render(<DreamCareerStudentGuide response={response()} locale="hi" />);

    expect(screen.getByRole('heading', { name: 'करियर के बारे में' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'अभी किन विषयों पर ध्यान दें' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'अभी क्या कर सकता/सकती हूँ' })).toBeInTheDocument();
  });

  it('uses responsive, dark-mode-safe styling without a fixed-width reader', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getByTestId('dream-career-student-guide')).toHaveClass('min-w-0', 'bg-background', 'text-foreground');
    expect(screen.getByRole('navigation', { name: 'Career guide chapters' })).toHaveClass('sticky', 'overflow-x-auto');
  });

  it('renders distinct loading and honest retryable error states', () => {
    const retry = vi.fn();
    const { rerender } = render(<DreamCareerStudentGuideLoading locale="en" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading career guide');

    rerender(<DreamCareerStudentGuideError locale="en" onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('This career guide is temporarily unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

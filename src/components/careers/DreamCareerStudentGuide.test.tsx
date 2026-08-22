import { fireEvent, render, screen, within } from '@testing-library/react';
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
      primaryFutureDirectionId: 'technology',
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
      labels: {
        subjects: [{ id: 'subject-mathematics', label: 'Mathematics' }],
        skills: [{ id: 'skill-problem-solving', label: 'Problem solving' }],
        occupationalTools: [{ id: 'tool-sql', label: 'SQL' }],
      },
      relatedCareers: [{ id: 'analytics-engineer', title: 'Analytics Engineer', summary: 'Turns prepared data into useful models.', primaryFutureDirectionId: 'technology', futureDirectionIds: ['technology'] }],
      courseOptions: {
        status: 'available',
        items: [{ id: 'offering-1', courseConceptId: 'course-computing', courseTitle: 'BTech Computer Science', institution: { id: 'college-1', name: 'IIT Example', city: 'Kochi', state: 'Kerala', country: 'India' }, match: 'direct', releaseId: 'release-1' }],
      },
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
      'About this career',
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
      'Courses and colleges',
      'From graduation to first job',
      'Career progression',
      'Companies that hire for this career',
      'Internship opportunities',
      'Starter courses and online resources',
      'Skills to build',
      'Tools to learn',
      'Entrance exams to consider',
      'Try it this week',
    ]);
  });

  it('renders API-owned human labels and omits guidance with no reviewed label projection', () => {
    const value = response();
    value.guide.howToGetThere.subjects.push({
      subjectId: 'subject-unsupported',
      importance: 'helpful',
      guidance: 'Unsupported subject guidance',
      gradeIds: ['grade10'],
      sourceIds: ['source-one'],
    });
    value.guide.whatYouCanDoNow.skills.push({
      skillId: 'skill-unsupported',
      importance: 'useful',
      howUsed: 'Unsupported skill guidance',
      sourceIds: ['source-one'],
    });
    value.guide.whatYouCanDoNow.tools.push({
      toolId: 'tool-unsupported',
      importance: 'useful',
      whyLearn: 'Unsupported tool guidance',
      sourceIds: ['source-one'],
    });

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Problem solving')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.queryByText('subject-mathematics')).not.toBeInTheDocument();
    expect(screen.queryByText('skill-problem-solving')).not.toBeInTheDocument();
    expect(screen.queryByText('tool-sql')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported subject guidance')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported skill guidance')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported tool guidance')).not.toBeInTheDocument();
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

  it('renders accepted course options under an honest courses and colleges heading', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getByRole('heading', { name: 'Courses and colleges' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analytics Engineer' })).toHaveAttribute('href', '/explore/roles/analytics-engineer');
    expect(screen.getByRole('link', { name: /IIT Example/i })).toHaveAttribute('href', '/colleges/college-1');
  });

  it('omits an honestly empty available course mapping', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'available', items: [] };

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('heading', { name: 'Courses and colleges' })).not.toBeInTheDocument();
    expect(screen.queryByText(/matches are not available yet/i)).not.toBeInTheDocument();
  });

  it('omits a non-retryable unavailable course mapping from the learner page', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'mapping_unavailable', items: [] };

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('heading', { name: 'Courses and colleges' })).not.toBeInTheDocument();
    expect(screen.queryByText('Course and college matches are not available yet.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry courses/i })).not.toBeInTheDocument();
  });

  it('shows retry UI only for an actual retryable course relationship error', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'available', items: [] };
    value.relationshipErrors = [{ subsection: 'courseOptions', code: 'temporarily_unavailable', retryable: true }];
    const retry = vi.fn();

    render(<DreamCareerStudentGuide response={value} locale="en" onRetryRelationship={retry} />);

    expect(screen.getByRole('heading', { name: 'Courses and colleges' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry courses and colleges' }));
    expect(retry).toHaveBeenCalledWith('courseOptions');
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

  it('renders only available or partial coverage even when missing content remains in the payload', () => {
    const value = response();
    value.coverage.byQuestion.whyItMatters.status = 'missing';
    value.coverage.items.find((item) => item.questionId === 'whyItMatters')!.status = 'missing';

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('heading', { name: 'Why it matters' })).not.toBeInTheDocument();
    expect(screen.queryByText(value.guide.aboutCareer.whyItMatters)).not.toBeInTheDocument();
  });

  it('provides keyboard-focusable chapter anchors with exact destinations', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    const about = screen.getByRole('link', { name: 'About this career' });
    const path = screen.getByRole('link', { name: 'How to get there' });
    const now = screen.getByRole('link', { name: 'What I can do now' });
    expect(about).toHaveAttribute('href', '#about-career');
    expect(path).toHaveAttribute('href', '#how-to-get-there');
    expect(now).toHaveAttribute('href', '#what-you-can-do-now');
    about.focus();
    expect(about).toHaveFocus();
  });

  it('keeps all three chapter destinations visible in an equal-width compact rail', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    const navigation = screen.getByRole('navigation', { name: 'Career guide chapters' });
    const rail = navigation.firstElementChild;
    expect(navigation).not.toHaveClass('overflow-x-auto');
    expect(rail).toHaveClass('grid', 'w-full', 'grid-cols-3');
    for (const link of within(navigation).getAllByRole('link')) {
      expect(link).toHaveClass('min-w-0', 'whitespace-normal');
    }
  });

  it('uses localized chapter and learner-question labels', () => {
    const value = response();
    const { rerender } = render(<DreamCareerStudentGuide response={value} locale="hi" />);

    expect(screen.getByRole('heading', { name: 'इस करियर के बारे में' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'अभी किन विषयों पर ध्यान दें' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'कोर्स और कॉलेज' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'विकसित करने योग्य कौशल' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'अभी क्या कर सकता/सकती हूँ' })).toBeInTheDocument();

    rerender(<DreamCareerStudentGuide response={value} locale="ml" />);
    expect(screen.getByRole('heading', { name: 'ഈ കരിയറിനെക്കുറിച്ച്' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'കോഴ്സുകളും കോളേജുകളും' })).toBeInTheDocument();

    rerender(<DreamCareerStudentGuide response={value} locale="ta" />);
    expect(screen.getByRole('heading', { name: 'இந்தத் தொழிலைப் பற்றி' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'வேலையில் ஒரு நாள்' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'படிப்புகள் மற்றும் கல்லூரிகள்' })).toBeInTheDocument();
  });

  it('localizes the relationship retry accessible-label prefix', () => {
    const value = response();
    value.resolved.opportunities = [];
    value.relationshipErrors = [{ subsection: 'opportunities', code: 'temporarily_unavailable', retryable: true }];

    render(<DreamCareerStudentGuide response={value} locale="hi" onRetryRelationship={vi.fn()} />);

    expect(screen.getByText('यह जानकारी अभी उपलब्ध नहीं है।')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'फिर कोशिश करें: इंटर्नशिप के अवसर' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
  });

  it('uses responsive, dark-mode-safe styling without a fixed-width reader', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getByTestId('dream-career-student-guide')).toHaveClass('min-w-0', 'bg-muted/20', 'text-foreground', 'dark:bg-background');
    expect(screen.getByRole('navigation', { name: 'Career guide chapters' })).toHaveClass('sticky', 'bg-background/95');
    expect(screen.getByRole('heading', { name: 'About this career', level: 2 }).closest('section')).toHaveClass('scroll-mt-24');
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

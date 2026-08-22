import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => window.history.replaceState(null, '', '/'));
  afterEach(() => vi.unstubAllGlobals());

  it('renders the three chapters in order and exposes all 18 learner questions when facts are available', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    const chapterHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(chapterHeadings).toHaveLength(3);
    expect(chapterHeadings[0]).toHaveAccessibleName('About this career');
    expect(chapterHeadings[1]).toHaveAccessibleName('How to get there');
    expect(chapterHeadings[2]).toHaveAccessibleName('What I can do now');
    const navigation = screen.getByRole('navigation', { name: 'Career guide chapters' });
    for (const question of [
      'What will I do?',
      'What is a day like?',
      'Why does it matter?',
      'How much can I earn?',
      'Who can I learn from?',
      'What related careers can I pursue?',
      'What subjects should I learn now?',
      'What can I study?',
      'Which courses and colleges are available?',
      'How do I move from graduation to employment?',
      'How can my career grow?',
      'Which companies hire for this career?',
      'Where can I find an internship?',
      'What other courses and online resources can I take?',
      'What skills should I develop?',
      'What tools should I learn?',
      'What entrance exams should I consider?',
      'What can I try this week?',
    ]) {
      expect(within(navigation).getByRole('link', { name: question })).toBeInTheDocument();
    }
    expect(within(screen.getByTestId('active-question-pane')).getByRole('heading', { name: 'What will I do?' })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('link', { name: 'What subjects should I learn now?' }));
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.queryByText('subject-mathematics')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported subject guidance')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'What skills should I develop?' }));
    expect(screen.getByText('Problem solving')).toBeInTheDocument();
    expect(screen.queryByText('skill-problem-solving')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported skill guidance')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'What tools should I learn?' }));
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.queryByText('tool-sql')).not.toBeInTheDocument();
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

    expect(screen.queryByRole('link', { name: 'What is a day like?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'How much can I earn?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Who can I learn from?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'What related careers can I pursue?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Which companies hire for this career?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Where can I find an internship?' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'What tools should I learn?' })).not.toBeInTheDocument();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
  });

  it('renders accepted course options under an honest courses and colleges heading', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    fireEvent.click(screen.getByRole('link', { name: 'What related careers can I pursue?' }));
    expect(screen.getByRole('link', { name: 'Analytics Engineer' })).toHaveAttribute('href', '/explore/roles/analytics-engineer');
    fireEvent.click(screen.getByRole('link', { name: 'Which courses and colleges are available?' }));
    expect(screen.getByRole('heading', { name: 'Which courses and colleges are available?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /IIT Example/i })).toHaveAttribute('href', '/colleges/college-1');
  });

  it('omits an honestly empty available course mapping', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'available', items: [] };

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('link', { name: 'Which courses and colleges are available?' })).not.toBeInTheDocument();
    expect(screen.queryByText(/matches are not available yet/i)).not.toBeInTheDocument();
  });

  it('omits a non-retryable unavailable course mapping from the learner page', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'mapping_unavailable', items: [] };

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('link', { name: 'Which courses and colleges are available?' })).not.toBeInTheDocument();
    expect(screen.queryByText('Course and college matches are not available yet.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry courses/i })).not.toBeInTheDocument();
  });

  it('shows retry UI only for an actual retryable course relationship error', () => {
    const value = response();
    value.resolved.courseOptions = { status: 'available', items: [] };
    value.relationshipErrors = [{ subsection: 'courseOptions', code: 'temporarily_unavailable', retryable: true }];
    const retry = vi.fn();

    render(<DreamCareerStudentGuide response={value} locale="en" onRetryRelationship={retry} />);

    fireEvent.click(screen.getByRole('link', { name: 'Which courses and colleges are available?' }));
    expect(screen.getByRole('heading', { name: 'Which courses and colleges are available?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry which courses and colleges are available?' }));
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
    fireEvent.click(screen.getByRole('link', { name: 'Where can I find an internship?' }));
    expect(screen.getByRole('heading', { name: 'Where can I find an internship?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry where can I find an internship?' }));
    expect(retry).toHaveBeenCalledWith('opportunities');
  });

  it('keeps stale time-sensitive content out of the learner page', () => {
    const value = response();
    value.coverage.byQuestion.learningResources.status = 'stale';
    value.coverage.items.find((item) => item.questionId === 'learningResources')!.status = 'stale';

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('link', { name: 'What other courses and online resources can I take?' })).not.toBeInTheDocument();
    expect(screen.queryByText('SQL for beginners')).not.toBeInTheDocument();
  });

  it('renders only available or partial coverage even when missing content remains in the payload', () => {
    const value = response();
    value.coverage.byQuestion.whyItMatters.status = 'missing';
    value.coverage.items.find((item) => item.questionId === 'whyItMatters')!.status = 'missing';

    render(<DreamCareerStudentGuide response={value} locale="en" />);

    expect(screen.queryByRole('link', { name: 'Why does it matter?' })).not.toBeInTheDocument();
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

  it('uses a grouped desktop question navigator and a single-column compact reader', () => {
    const desktop = render(<DreamCareerStudentGuide response={response()} locale="en" />);

    const navigation = screen.getByRole('navigation', { name: 'Career guide chapters' });
    expect(navigation).toHaveAttribute('data-testid', 'desktop-question-navigation');
    expect(within(navigation).getByRole('link', { name: 'What will I do?' })).toHaveAttribute('href', '#guide-question-what-you-do');
    desktop.unmount();

    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 1023px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    const compact = render(<DreamCareerStudentGuide response={response()} locale="en" />);
    expect(screen.getByTestId('compact-question-reader')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'What will I do?' })).toHaveLength(1);
    compact.unmount();
  });

  it('uses localized chapter and learner-question labels', () => {
    const value = response();
    const { rerender } = render(<DreamCareerStudentGuide response={value} locale="hi" />);

    expect(screen.getByRole('heading', { name: 'इस करियर के बारे में' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'अभी क्या कर सकता/सकती हूँ' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'अभी किन विषयों पर ध्यान दें' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'कोर्स और कॉलेज' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'विकसित करने योग्य कौशल' })).toBeInTheDocument();

    rerender(<DreamCareerStudentGuide response={value} locale="ml" />);
    expect(screen.getByRole('heading', { name: 'ഈ കരിയറിനെക്കുറിച്ച്' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'കോഴ്സുകളും കോളേജുകളും' })).toBeInTheDocument();

    rerender(<DreamCareerStudentGuide response={value} locale="ta" />);
    expect(screen.getByRole('heading', { name: 'இந்தத் தொழிலைப் பற்றி' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'வேலையில் ஒரு நாள்' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'படிப்புகள் மற்றும் கல்லூரிகள்' })).toBeInTheDocument();
  });

  it('localizes the relationship retry accessible-label prefix', () => {
    const value = response();
    value.resolved.opportunities = [];
    value.relationshipErrors = [{ subsection: 'opportunities', code: 'temporarily_unavailable', retryable: true }];

    render(<DreamCareerStudentGuide response={value} locale="hi" onRetryRelationship={vi.fn()} />);

    fireEvent.click(screen.getByRole('link', { name: 'इंटर्नशिप के अवसर' }));
    expect(screen.getByText('यह जानकारी अभी उपलब्ध नहीं है।')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'फिर कोशिश करें: इंटर्नशिप के अवसर' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
  });

  it('uses responsive, dark-mode-safe styling without a fixed-width reader', () => {
    render(<DreamCareerStudentGuide response={response()} locale="en" />);

    expect(screen.getByTestId('dream-career-student-guide')).toHaveClass('min-w-0', 'bg-background', 'text-foreground', 'dark:bg-background', 'motion-reduce:scroll-auto');
    expect(screen.getByRole('navigation', { name: 'Career guide chapters' }).firstElementChild).toHaveClass('sticky', 'top-24');
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

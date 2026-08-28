import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XtaraApiError } from '@/lib/api/client';
import {
  createAreaDirectionPlan,
  saveDirectionPlan,
  toggleDreamCareer,
} from '@/lib/direction';
import type {
  CareerGuideQuestionId,
  DreamCareerStudentGuideResponse,
} from '@/types/dream-career-student-guide';

const mocks = vi.hoisted(() => ({
  getGuide: vi.fn(),
  getContext: vi.fn(),
  getDirection: vi.fn(),
  saveDirection: vi.fn(),
  generateSlides: vi.fn(() => []),
  user: null as null | { uid: string; isAnonymous: boolean },
}));

vi.mock('@/components/Header', () => ({ default: () => <header>Header</header> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/components/career-path/SlideshowOverlay', () => ({ default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Career conversation</div> : null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/dream-career-student-guide-api', () => ({
  getDreamCareerStudentGuide: mocks.getGuide,
  getDreamCareerStudentContext: mocks.getContext,
}));
vi.mock('@/lib/direction-api', () => ({
  getDirectionFromApi: mocks.getDirection,
  saveDirectionToApi: mocks.saveDirection,
}));
vi.mock('@/lib/career-slides-utils', () => ({
  generateCareerConversationSlides: mocks.generateSlides,
}));

import DreamCareerPage from './page';

function guideResponse(): DreamCareerStudentGuideResponse {
  const questionIds: CareerGuideQuestionId[] = [
    'whatYouDo', 'dayInLife', 'whyItMatters', 'earnings', 'notablePeople',
    'relatedCareers', 'subjects', 'educationRoutes', 'coursesAndColleges',
    'firstJobBridge', 'careerProgression', 'employers', 'opportunities',
    'learningResources', 'skills', 'tools', 'entranceExams', 'starterActivity',
  ];
  const coverageItems = questionIds.map((questionId) => ({
    questionId,
    chapter: (['whatYouDo', 'dayInLife', 'whyItMatters', 'earnings', 'notablePeople', 'relatedCareers'] as string[]).includes(questionId)
      ? 'aboutCareer' as const
      : (['subjects', 'educationRoutes', 'coursesAndColleges', 'firstJobBridge', 'careerProgression', 'employers', 'opportunities'] as string[]).includes(questionId)
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
      primaryFutureDirectionId: 'technology',
      futureDirectionIds: ['technology'],
    },
    guide: {
      schemaVersion: 1,
      careerId: 'data-engineer',
      locale: 'en',
      aboutCareer: {
        whatYouDo: 'Designs and maintains reliable data systems.',
        activities: [{ id: 'activity-1', title: 'Design data flows', description: 'Plan dependable data movement.', sourceIds: ['source-one'] }],
        dayInLife: [],
        whyItMatters: 'Good data helps people make sound decisions.',
        earnings: [{ id: 'earning-1', careerStage: 'junior', geography: 'India', currency: 'INR', amountMin: 600000, amountMax: 900000, period: 'year', asOf: '2026-08-01', sourceIds: ['source-one'] }],
        notablePeople: [],
        relatedCareerIds: [],
      },
      howToGetThere: {
        subjects: [],
        educationRoutes: [{ id: 'route-1', routeType: 'degree', title: 'Computing degree', description: 'Study systems and databases.', courseConceptIds: [], sourceIds: ['source-one'] }],
        firstJobBridge: [],
        careerProgression: [],
        employerLinkIds: [],
        opportunityQuery: { careerId: 'data-engineer' },
      },
      whatYouCanDoNow: {
        learningResourceIds: [],
        skills: [{ skillId: 'skill-one', importance: 'core', howUsed: 'Break data problems into testable steps.', sourceIds: ['source-one'] }],
        tools: [],
        entranceExams: [],
        starterActivity: { id: 'starter-1', title: 'Clean a table', description: 'Find duplicate rows.', estimatedMinutes: 30, sourceIds: ['source-one'] },
      },
      additionalTopics: [],
      sources: [{ id: 'source-one', label: 'Career source', organization: 'Xtara Editorial', url: 'https://example.com/source', reviewStatus: 'reviewed' }],
      provenance: { sourceVersion: 'student-guide-v1', sourceIds: ['source-one'] },
    },
    resolved: {
      labels: { subjects: [], skills: [], occupationalTools: [] },
      relatedCareers: [],
      courseOptions: {
        status: 'available',
        items: [{ id: 'offering-1', courseConceptId: 'course-computing', courseTitle: 'BTech Computer Science', institution: { id: 'college-1', name: 'IIT Example' }, match: 'direct', releaseId: 'release-1' }],
      },
      employers: [], opportunities: [], learningResources: [],
    },
    coverage: {
      items: coverageItems,
      byQuestion: Object.fromEntries(coverageItems.map((item) => [item.questionId, item])) as unknown as DreamCareerStudentGuideResponse['coverage']['byQuestion'],
    },
    relationshipErrors: [],
  };
}

describe('Dream Career Student Guide page', () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };

  beforeEach(() => {
    mocks.getGuide.mockReset();
    mocks.getContext.mockReset();
    mocks.getDirection.mockReset();
    mocks.saveDirection.mockReset();
    mocks.generateSlides.mockReset();
    mocks.generateSlides.mockReturnValue([]);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    vi.mocked(useParams).mockReturnValue({ roleId: 'data-engineer' });
    mocks.user = null;
    mocks.getGuide.mockResolvedValue(guideResponse());
    mocks.getContext.mockResolvedValue({ careerId: 'data-engineer', saved: false, assessmentReasons: [], location: {} });
    mocks.getDirection.mockResolvedValue(null);
    mocks.saveDirection.mockRejectedValue(new Error('save not configured'));
    localStorage.clear();
  });

  it('renders a public canonical guide without assessment or Future Direction state', async () => {
    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Data Engineer', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About this career' })).toBeInTheDocument();
    expect(screen.getByText('Designs and maintains reliable data systems.')).toBeInTheDocument();
    expect(screen.queryByText('Choose this Career Direction')).not.toBeInTheDocument();
    expect(mocks.getGuide).toHaveBeenCalledWith('data-engineer', expect.objectContaining({ locale: 'en' }));
    expect(mocks.getContext).not.toHaveBeenCalled();
  });

  it('preserves save and career-conversation actions in the hero', async () => {
    render(<DreamCareerPage />);

    expect(await screen.findByRole('button', { name: 'Add to My Dream Careers' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Career Conversation' }));
    expect(screen.getByText('Career conversation')).toBeInTheDocument();
  });

  it('keeps the public guide visible when optional signed-in context fails', async () => {
    mocks.user = { uid: 'student-1', isAnonymous: false };
    mocks.getContext.mockRejectedValue(new Error('context unavailable'));

    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Data Engineer' })).toBeInTheDocument();
    expect(screen.getAllByText('Good data helps people make sound decisions.')).not.toHaveLength(0);
    await waitFor(() => expect(mocks.getContext).toHaveBeenCalledWith('data-engineer', expect.any(Object)));
  });

  it('keeps stale guide facts out of the hero and Career Conversation payload', async () => {
    const value = guideResponse();
    for (const questionId of ['whyItMatters', 'whatYouDo', 'earnings', 'educationRoutes', 'coursesAndColleges', 'starterActivity'] as CareerGuideQuestionId[]) {
      value.coverage.byQuestion[questionId].status = questionId === 'educationRoutes' ? 'missing' : 'stale';
      value.coverage.items.find((item) => item.questionId === questionId)!.status = value.coverage.byQuestion[questionId].status;
    }
    mocks.getGuide.mockResolvedValue(value);

    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Data Engineer' })).toBeInTheDocument();
    expect(screen.queryByText('Good data helps people make sound decisions.')).not.toBeInTheDocument();
    expect(mocks.generateSlides).toHaveBeenLastCalledWith(expect.objectContaining({
      careers: [expect.objectContaining({
        dailyWork: [],
        preparation: '',
        tryThis: '',
        salaryRange: undefined,
      })],
      courses: [],
    }));
  });

  it('derives signed-in mutations from the remote Direction plan and updates only after readback', async () => {
    mocks.user = { uid: 'student-1', isAnonymous: false };
    const response = guideResponse();
    response.career.futureDirectionIds = ['health', 'technology'];
    mocks.getGuide.mockResolvedValue(response);
    const remote = createAreaDirectionPlan('technology');
    const saved = toggleDreamCareer(remote, 'data-engineer');
    saveDirectionPlan(toggleDreamCareer(createAreaDirectionPlan('technology'), 'another-career'));
    mocks.getDirection.mockResolvedValueOnce(remote).mockResolvedValueOnce(saved);
    mocks.getContext
      .mockResolvedValueOnce({ careerId: 'data-engineer', saved: false, assessmentReasons: [], location: {} })
      .mockResolvedValueOnce({ careerId: 'data-engineer', saved: true, assessmentReasons: [], location: {} });
    let resolveSave!: (value: typeof saved) => void;
    mocks.saveDirection.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));

    render(<DreamCareerPage />);

    const add = await screen.findByRole('button', { name: 'Add to My Dream Careers' });
    await waitFor(() => expect(mocks.getDirection).toHaveBeenCalledOnce());
    fireEvent.click(add);
    await waitFor(() => expect(mocks.saveDirection).toHaveBeenCalledWith(expect.objectContaining({
      areaId: 'technology',
      dreamCareerIds: ['data-engineer'],
    })));
    expect(screen.getByRole('button', { name: 'Add to My Dream Careers' })).toBeInTheDocument();

    resolveSave(saved);
    expect(await screen.findByRole('button', { name: 'Remove from My Dream Careers' })).toBeInTheDocument();
    expect(mocks.getDirection).toHaveBeenCalledTimes(2);
    expect(mocks.getContext).toHaveBeenCalledTimes(2);
  });

  it('shows an honest unavailable state when no compatible signed-in Direction plan exists', async () => {
    mocks.user = { uid: 'student-1', isAnonymous: false };
    mocks.getDirection.mockResolvedValue(createAreaDirectionPlan('health'));

    render(<DreamCareerPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add to My Dream Careers' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saving is unavailable because this career does not match a saved Career Direction in your account.');
    expect(mocks.saveDirection).not.toHaveBeenCalled();
  });

  it('keeps signed-in save state unchanged and reports mutation failures', async () => {
    mocks.user = { uid: 'student-1', isAnonymous: false };
    mocks.getDirection.mockResolvedValue(createAreaDirectionPlan('technology'));
    mocks.saveDirection.mockRejectedValue(new Error('write failed'));

    render(<DreamCareerPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add to My Dream Careers' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not update My Dream Careers. Your saved state has not changed.');
    expect(screen.getByRole('button', { name: 'Add to My Dream Careers' })).toBeInTheDocument();
  });

  it('shows loading and an honest retryable guide error without legacy fallback content', async () => {
    mocks.getGuide.mockRejectedValueOnce(new Error('guide unavailable')).mockResolvedValueOnce(guideResponse());

    render(<DreamCareerPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading career guide');
    expect(await screen.findByRole('alert')).toHaveTextContent('This career guide is temporarily unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Data Engineer' })).toBeInTheDocument();
    expect(mocks.getGuide).toHaveBeenCalledTimes(2);
  });

  it('renders reviewed career identity and an honest guide-unavailable state for a missing-guide 404', async () => {
    mocks.getGuide.mockRejectedValue(new XtaraApiError(
      'Published Student Guide not found',
      404,
      'request-guide-missing',
      { career: { id: 'data-engineer', title: 'Data Engineer', summary: 'Reviewed career summary.', primaryFutureDirectionId: 'technology', futureDirectionIds: ['technology'] } },
    ));

    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Data Engineer', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Reviewed career summary.')).toBeInTheDocument();
    expect(screen.getByText('Student Guide is not available for this career yet.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'About this career' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('retries and replaces only the failed relationship subsection', async () => {
    const initial = guideResponse();
    initial.relationshipErrors = [{ subsection: 'opportunities', code: 'temporarily_unavailable', retryable: true }];
    const retried = guideResponse();
    retried.guide.aboutCareer.whatYouDo = 'This unrelated replacement must not overwrite the reader.';
    retried.resolved.opportunities = [{
      id: 'opportunity-1',
      providerId: 'provider-1',
      providerName: 'Learning Lab',
      title: 'Data engineering internship',
      kind: 'internship',
      opensAt: '2026-08-01T00:00:00Z',
      closesAt: '2026-09-01T00:00:00Z',
    }];
    mocks.getGuide.mockResolvedValueOnce(initial).mockResolvedValueOnce(retried);

    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Where can I find an internship?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry where can I find an internship?' }));
    expect(await screen.findByText('Data engineering internship')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What will I do?' })).toBeInTheDocument();
    expect(screen.getByText('Designs and maintains reliable data systems.')).toBeInTheDocument();
    expect(screen.queryByText('This unrelated replacement must not overwrite the reader.')).not.toBeInTheDocument();
  });
});

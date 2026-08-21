import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';

const mocks = vi.hoisted(() => ({
  getGuide: vi.fn(),
  getContext: vi.fn(),
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

import DreamCareerPage from './page';

function guideResponse(): DreamCareerStudentGuideResponse {
  return {
    career: {
      id: 'data-engineer',
      title: 'Data Engineer',
      summary: 'Builds dependable data systems that help people make better decisions.',
      futureDirectionIds: ['technology'],
    },
    guide: {
      schemaVersion: 1,
      careerId: 'data-engineer',
      locale: 'en',
      aboutCareer: {
        whatYouDo: 'Designs and maintains reliable data systems.',
        activities: [],
        dayInLife: [],
        whyItMatters: 'Good data helps people make sound decisions.',
        earnings: [],
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
        starterActivity: null,
      },
      additionalTopics: [],
      sources: [{ id: 'source-one', label: 'Career source', organization: 'Xtara Editorial', url: 'https://example.com/source', reviewStatus: 'reviewed' }],
      provenance: { sourceVersion: 'student-guide-v1', sourceIds: ['source-one'] },
    },
    resolved: { relatedCareers: [], courseOptions: [], employers: [], opportunities: [], learningResources: [] },
    coverage: { items: [], byQuestion: {} as DreamCareerStudentGuideResponse['coverage']['byQuestion'] },
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
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    vi.mocked(useParams).mockReturnValue({ roleId: 'data-engineer' });
    mocks.user = null;
    mocks.getGuide.mockResolvedValue(guideResponse());
    mocks.getContext.mockResolvedValue({ careerId: 'data-engineer', saved: false, assessmentReasons: [], location: {} });
    localStorage.clear();
  });

  it('renders a public canonical guide without assessment or Future Direction state', async () => {
    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Data Engineer', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About the career' })).toBeInTheDocument();
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

  it('shows loading and an honest retryable guide error without legacy fallback content', async () => {
    mocks.getGuide.mockRejectedValueOnce(new Error('guide unavailable')).mockResolvedValueOnce(guideResponse());

    render(<DreamCareerPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading career guide');
    expect(await screen.findByRole('alert')).toHaveTextContent('This career guide is temporarily unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Data Engineer' })).toBeInTheDocument();
    expect(mocks.getGuide).toHaveBeenCalledTimes(2);
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

    fireEvent.click(await screen.findByRole('button', { name: 'Retry internship opportunities' }));
    expect(await screen.findByText('Data engineering internship')).toBeInTheDocument();
    expect(screen.getByText('Designs and maintains reliable data systems.')).toBeInTheDocument();
    expect(screen.queryByText('This unrelated replacement must not overwrite the reader.')).not.toBeInTheDocument();
  });
});

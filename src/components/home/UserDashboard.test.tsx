import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import { createEmptyFutureDirection } from '@/lib/admin/configs/futureDirectionsConfig';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assessmentV2StorageKey, type DiscoveryResult } from '@/lib/assessment-v2';
import { createAreaDirectionPlan, directionStorageKey, selectDirectionRole, setDreamCareers } from '@/lib/direction';

const mocks = vi.hoisted(() => ({
  mvpEnabled: false,
  hydrate: vi.fn(),
  hydrateDirection: vi.fn(),
  getPoints: vi.fn(),
  getMedals: vi.fn(),
  getTier: vi.fn(),
  getExperience: vi.fn(),
  recordRecommendation: vi.fn(),
}));

vi.mock('@/lib/mvp-navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mvp-navigation')>();
  return { ...actual, get MVP_NAVIGATION_ENABLED() { return mocks.mvpEnabled; } };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'student-1', displayName: 'Anu' }, userProfile: { fullName: 'Anu Student' } }),
}));

vi.mock('@/i18n/language-provider', () => ({
  useTranslations: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/discovery-save', () => ({
  hydrateDiscoveryFromAccount: mocks.hydrate,
  hydrateDirectionDashboard: mocks.hydrateDirection,
}));

vi.mock('@/lib/firebase/achievements-service', () => ({
  AchievementsService: class {
    getTotalPoints = mocks.getPoints;
    getMedalData = mocks.getMedals;
    getTierData = mocks.getTier;
  },
}));

vi.mock('@/lib/experience-api', () => ({
  getMyCareerPathExperience: mocks.getExperience,
  recordRecommendationEvent: mocks.recordRecommendation,
  recommendationHref: (recommendation: { action: { type: string; contentId?: string } }) =>
    recommendation.action.type === 'open_content' ? `/dashboard/sparks/${recommendation.action.contentId}` : null,
}));

vi.mock('@/lib/query/useContentQuery', () => ({
  useStoriesQuery: () => ({ data: [{ id: 'story-1', title: 'A designer at work', career_clusters: ['design'] }] }),
  useSparksQuery: () => ({ data: [{ id: 'spark-1', title: 'Notice user needs', career_clusters: ['design'] }] }),
  useGamesQuery: () => ({ data: [{ id: 'game-1', title: 'Design detective', career_clusters: ['design'] }] }),
  useChallengesQuery: () => ({ data: [{ id: 'challenge-1', title: 'Improve a form', career_clusters: ['design'] }] }),
  useGoodReadsQuery: () => ({ data: [{ id: 'read-1', title: 'How design decisions work', career_clusters: ['design'] }] }),
}));

vi.mock('./StorySlideshow', () => ({ default: () => null }));
vi.mock('./DownloadAppModal', () => ({ default: () => null }));
vi.mock('@/components/home/WeeklyPlanCard', () => ({
  default: () => <div data-testid="weekly-plan-card">My goals this week</div>,
}));

import UserDashboard from './UserDashboard';

const assessment: DiscoveryResult = {
  definitionId: 'career-discovery',
  version: '3.0.0',
  stage: 'grade8',
  locale: 'en',
  createdAt: '2026-07-21T00:00:00.000Z',
  answers: {},
  signals: [{ id: 'creativeExpression', evidence: 'repeated', evidenceRefs: [] }],
  traits: [],
  areas: [{ id: 'design', evidence: 'developing', evidenceRefs: [], roleIds: ['ux-designer', 'journalist'] }],
  context: { familyInfluence: null, familyPriorities: [], weaknessPatterns: [] },
  syncStatus: 'synced',
};

describe('pursued-area learner dashboard', () => {
  let container: HTMLDivElement;
  let root: Root;
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    mocks.mvpEnabled = false;
    localStorage.clear();
    mocks.hydrate.mockReset().mockResolvedValue(null);
    mocks.hydrateDirection.mockReset().mockResolvedValue(undefined);
    mocks.getPoints.mockReset().mockResolvedValue(120);
    mocks.getMedals.mockReset().mockResolvedValue({ total: 3 });
    mocks.getTier.mockReset().mockResolvedValue({ name: 'Explorer' });
    mocks.getExperience.mockReset().mockRejectedValue(new Error('offline'));
    mocks.recordRecommendation.mockReset().mockResolvedValue(undefined);
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(assessment));
    const plan = selectDirectionRole(createAreaDirectionPlan('design'), 'ux-designer');
    localStorage.setItem(directionStorageKey, JSON.stringify(plan));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
  });

  it('shows a selected reciprocal career outside the result preview', async () => {
    const career = { ...createEmptyDreamCareer(), id: 'fourth-career', futureDirectionIds: ['design'] };
    career.translations.en.title = 'Fourth API Career';
    const remote = { ...assessment, catalogSnapshot: {
      directions: [{ ...createEmptyFutureDirection(), id: 'design', roleIds: ['fourth-career'] }], roles: [career],
    } };
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(remote));
    localStorage.setItem(directionStorageKey, JSON.stringify(setDreamCareers(createAreaDirectionPlan('design'), ['fourth-career'])));
    await act(async () => { root.render(<UserDashboard />); });
    expect(container.textContent).toContain('Fourth API Career');
  });

  it('hides cached direction while account hydration fails and permits retry', async () => {
    mocks.hydrate.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    await act(async () => { root.render(<UserDashboard />); });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain('UX Designer');
    const retry = container.querySelector('button');
    await act(async () => { retry?.click(); });
    expect(mocks.hydrate).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('keeps career conversation launch available without hidden engagement data in MVP', async () => {
    mocks.mvpEnabled = true;
    const before = localStorage.getItem(directionStorageKey);
    await act(async () => { root.render(<UserDashboard />); });
    expect(container.textContent).toContain('My Direction');
    expect(container.textContent).toContain('UX Designer');
    expect(container.textContent).toContain('Career Conversation');
    expect(container.querySelector('#next-steps button')).not.toBeNull();
    expect(container.textContent).not.toContain('My Rewards');
    expect(container.textContent).not.toContain('My goals this week');
    expect(container.textContent).not.toContain('My Next Steps');
    expect(container.querySelector('a[href="/achievements"]')).toBeNull();
    expect(mocks.getPoints).not.toHaveBeenCalled();
    expect(mocks.getExperience).not.toHaveBeenCalled();
    expect(localStorage.getItem(directionStorageKey)).toBe(before);
  });

  it('shows current published details and the saved career even without a compatible local assessment', async () => {
    mocks.mvpEnabled = true;
    localStorage.clear();
    mocks.hydrateDirection.mockResolvedValue({
      id: 'digital-and-computing',
      title: 'Digital and Computing',
      summary: 'Build useful tools and solve problems with technology.',
      reasons: ['Finding out why something works'],
      guidance: ['Try sketching a tool for a problem at school.'],
      reflectionPrompt: 'What would you like to build?',
      careers: [{ id: 'software-developer', title: 'Software Engineering', summary: 'Design and build software.' }],
    });

    await act(async () => { root.render(<UserDashboard />); });

    expect(mocks.hydrateDirection).toHaveBeenCalledWith('en', 'student-1');
    const page = container.textContent;
    expect(page).toContain('Build useful tools and solve problems with technology.');
    expect(page).toContain('Finding out why something works');
    expect(page).toContain('Try sketching a tool for a problem at school.');
    expect(page).toContain('What would you like to build?');
    expect(container.querySelector('a[href="/dream-careers/software-developer?from=dashboard"]')?.textContent).toContain('Design and build software.');
    expect(container.querySelector('a[href="/assessment/careers/digital-and-computing"]')).toBeNull();
  });

  it('keeps the direction and career picker visible when no careers are saved', async () => {
    mocks.mvpEnabled = true;
    mocks.hydrateDirection.mockResolvedValue({
      id: 'design', title: 'Design and Media', summary: 'Make ideas visible.',
      reasons: [], guidance: [], reflectionPrompt: '', careers: [],
    });

    await act(async () => { root.render(<UserDashboard />); });

    expect(container.textContent).toContain('Make ideas visible.');
    expect(container.querySelector('a[href="/assessment/careers/design"]')).not.toBeNull();
    expect(container.querySelector('#direction-reasons, #direction-guidance, #next-steps')).toBeNull();
  });

  it('focuses Career on direction, Dream Careers, next steps, and an achievements snapshot', async () => {
    await act(async () => { root.render(<UserDashboard />); });

    expect(container.textContent).toContain('My Career Path');
    expect(container.textContent).toContain('Design and Media');
    expect(container.textContent).toContain('UX Designer');
    expect(container.textContent).toContain('0 of 3 steps done');
    expect(container.textContent).toContain('My Career Direction');
    expect(container.textContent).toContain('My Dream Careers');
    expect(container.textContent).toContain('My Next Steps');
    expect(container.textContent).toContain('My goals this week');
    expect(container.textContent).not.toContain('Studies how people use a product or service');
    expect(container.textContent).toContain('My Rewards');
    expect(container.textContent).not.toContain('Notice user needs');
    expect(container.textContent).not.toContain('Design detective');
    expect(container.textContent).not.toContain('Career stories');
    expect(container.textContent).not.toContain('Colleges to explore');
    expect(container.textContent).not.toContain('My details');
    expect(container.textContent).not.toContain('What I can study later');

    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain('120'));
    });
  });

  it('renders Dream Careers as a names-only list', async () => {
    await act(async () => { root.render(<UserDashboard />); });

    const hero = container.querySelector('[data-testid="career-direction-hero"]');
    const careerList = container.querySelector('[data-testid="dream-career-list"]');
    const careerLink = careerList?.querySelector('a[href="/dream-careers/ux-designer?from=dashboard"]');
    const contextMenu = hero?.querySelector(
      'button[aria-label="Change Career Direction; Change my Dream Careers"]',
    );
    expect(hero).toBeTruthy();
    expect(contextMenu).toBeTruthy();
    expect(careerList?.tagName).toBe('OL');
    expect(careerLink).toBeTruthy();
    expect(careerLink?.textContent).toContain('UX Designer');
    expect(careerLink?.textContent).not.toContain('Open');
    expect(hero?.querySelector('a[href="/assessment/discovery"]')).toBeNull();
    expect(hero?.querySelector('a[href="/assessment/careers/design"]')).toBeNull();
    expect(container.textContent).not.toContain('Studies how people use a product or service');
  });

  it('turns completed career actions into visible progress', async () => {
    const plan = selectDirectionRole(createAreaDirectionPlan('design'), 'ux-designer');
    plan.actions.learn = true;
    localStorage.setItem(directionStorageKey, JSON.stringify(plan));

    await act(async () => { root.render(<UserDashboard />); });

    expect(container.textContent).toContain('1 of 3 steps done');
  });

  it('uses server-owned verified progress and a concrete next-best action', async () => {
    mocks.getExperience.mockResolvedValue({
      version: '1.1.0',
      surface: 'my-career-path',
      progress: {
        completed: 2,
        total: 3,
        goals: [
          { id: 'learn', title: 'Learn', completed: true, recommended: false },
          { id: 'try', title: 'Try', completed: true, recommended: false },
          { id: 'discuss', title: 'Discuss', completed: false, recommended: true },
        ],
      },
      nextBest: {
        id: 'discussion:discuss',
        goalId: 'discuss',
        kind: 'discussion',
        title: 'Discuss my choices',
        reason: 'Discuss your choices with a parent or teacher.',
        reasonCode: 'discuss_choices',
        action: { type: 'confirm_discussion' },
        policyVersion: 'next-best-v1',
      },
      alternatives: [],
      contentGroups: [],
    });

    await act(async () => { root.render(<UserDashboard />); });
    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain('2 of 3 steps done'));
    });

    expect(container.textContent).toContain('Next best');
    expect(container.textContent).toContain('Discuss my choices');
    expect(mocks.recordRecommendation).toHaveBeenCalledWith('impression', 'discussion:discuss');
  });

  it('builds one dashboard around up to three selected Dream Careers', async () => {
    const plan = setDreamCareers(createAreaDirectionPlan('design'), ['ux-designer', 'journalist']);
    localStorage.setItem(directionStorageKey, JSON.stringify(plan));

    await act(async () => { root.render(<UserDashboard />); });

    expect(container.textContent).toContain('UX Designer');
    expect(container.textContent).toContain('Journalist');
    expect(container.textContent).not.toContain('Lessons');
    expect(container.textContent).not.toContain('Career stories');
    expect(container.textContent).not.toContain('What I can study later');
    expect(container.textContent).not.toContain('Colleges to explore');
  });
});

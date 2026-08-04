import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assessmentV2StorageKey, type DiscoveryResult } from '@/lib/assessment-v2';
import { createAreaDirectionPlan, directionStorageKey, selectDirectionRole, setDreamCareers } from '@/lib/direction';

const mocks = vi.hoisted(() => ({
  hydrate: vi.fn(),
  getPoints: vi.fn(),
  getMedals: vi.fn(),
  getTier: vi.fn(),
  getExperience: vi.fn(),
  recordRecommendation: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'student-1', displayName: 'Anu' }, userProfile: { fullName: 'Anu Student' } }),
}));

vi.mock('@/i18n/language-provider', () => ({
  useTranslations: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/discovery-save', () => ({ hydrateDiscoveryFromAccount: mocks.hydrate }));

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
    localStorage.clear();
    mocks.hydrate.mockReset().mockResolvedValue(null);
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

  it('focuses Career on direction, Dream Careers, next steps, and an achievements snapshot', async () => {
    await act(async () => { root.render(<UserDashboard />); });

    expect(container.textContent).toContain('My Career Path');
    expect(container.textContent).toContain('Design and Media');
    expect(container.textContent).toContain('UX Designer');
    expect(container.textContent).toContain('0 of 3 steps done');
    expect(container.textContent).toContain('My Career Direction');
    expect(container.textContent).toContain('My Dream Careers');
    expect(container.textContent).toContain('My Next Steps');
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
    const careerLink = careerList?.querySelector('a[href="/dream-careers/ux-designer"]');
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
    expect(hero?.querySelector('a[href="/explore/areas/design"]')).toBeNull();
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

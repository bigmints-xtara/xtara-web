import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assessmentV2StorageKey, type DiscoveryResult } from "@/lib/assessment-v2";
import { createAreaDirectionPlan, directionStorageKey, selectDirectionRole } from "@/lib/direction";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  hydrate: vi.fn(),
  totalPoints: vi.fn(),
  tier: vi.fn(),
  medals: vi.fn(),
  stats: vi.fn(),
  points: vi.fn(),
  weekly: vi.fn(),
  history: vi.fn(),
  user: { uid: "student-1" },
  copy: {
    "achievements.hero.eyebrow": "My Career Path",
    "achievements.hero.title": "My career progress",
    "achievements.hero.subtitle": "Every activity moves the plan forward.",
    "achievements.career.direction": "Career Direction",
    "achievements.career.description": "Learning around this direction.",
    "achievements.career.stepsComplete": "career steps complete",
    "achievements.career.pathProgress": "My Career Path progress",
    "achievements.recognition.title": "Recognition",
    "achievements.recognition.description": "Recognition for your work.",
    "achievements.recognition.points": "points",
    "achievements.recognition.medals": "medals",
    "achievements.recognition.level": "level",
    "achievements.recognition.whyTitle": "Progress matters more than points",
    "achievements.recognition.whyDescription": "Learning is the real achievement.",
    "achievements.learning.eyebrow": "Learning evidence",
    "achievements.learning.title": "How I am building career readiness",
    "achievements.learning.description": "Completed learning and practice.",
    "achievements.learning.total": "Activities completed: {count}",
    "achievements.learning.completed": "completed",
    "achievements.learning.points": "points earned",
    "achievements.learning.action": "Continue learning",
    "achievements.learning.games.title": "Educational games",
    "achievements.learning.games.description": "Practise useful skills by playing.",
    "achievements.learning.games.label": "Learn by playing",
    "achievements.learning.sparks.title": "Short lessons",
    "achievements.learning.sparks.description": "Learn in small steps.",
    "achievements.learning.challenges.title": "Challenges",
    "achievements.learning.challenges.description": "Apply what you learned.",
    "achievements.learning.reads.title": "Career reads",
    "achievements.learning.reads.description": "Understand real work.",
    "achievements.learning.gameNote.title": "Games are part of learning",
    "achievements.learning.gameNote.description": "Games are educational activities.",
    "achievements.steps.title": "My progress towards my goals",
    "achievements.steps.description": "Learn, try, and discuss.",
    "achievements.steps.direction.title": "Choose a Career Direction",
    "achievements.steps.direction.description": "Choose a broad area.",
    "achievements.steps.careers.title": "Choose Dream Careers",
    "achievements.steps.careers.description": "Choose careers to explore.",
    "achievements.steps.learn.title": "Learn about the path",
    "achievements.steps.learn.description": "Complete a lesson.",
    "achievements.steps.learn.evidence": "Learning activities completed: {count}",
    "achievements.steps.try.title": "Try skills and ideas",
    "achievements.steps.try.description": "Try an activity.",
    "achievements.steps.try.evidence": "Games or challenges completed: {count}",
    "achievements.steps.discuss.title": "Discuss the plan",
    "achievements.steps.discuss.description": "Talk with a trusted adult.",
    "achievements.next.eyebrow": "My next best step",
    "achievements.next.action": "Take this step",
  } as Record<string, string>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/components/layout/Navbar", () => ({ default: () => <nav>Navigation</nav> }));
vi.mock("@/components/layout/Footer", () => ({ default: () => <footer>Footer</footer> }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: false }),
}));
vi.mock("@/i18n/language-provider", () => ({
  useTranslations: () => ({
    locale: "en",
    t: (key: string, vars?: Record<string, string | number>) => {
      let value = mocks.copy[key] ?? key;
      for (const [name, replacement] of Object.entries(vars ?? {})) {
        value = value.replace(`{${name}}`, String(replacement));
      }
      return value;
    },
  }),
}));
vi.mock("@/lib/discovery-save", () => ({ hydrateDiscoveryFromAccount: mocks.hydrate }));
vi.mock("@/lib/firebase/achievements-service", () => ({
  AchievementsService: class {
    getTotalPoints = mocks.totalPoints;
    getTierData = mocks.tier;
    getMedalData = mocks.medals;
    getAchievementStats = mocks.stats;
    getPointsByCategory = mocks.points;
    getWeeklyGoal = mocks.weekly;
    getPointsHistory = mocks.history;
  },
}));

import AchievementsPage from "./page";

const assessment: DiscoveryResult = {
  definitionId: "career-discovery",
  version: "3.0.0",
  stage: "grade8",
  locale: "en",
  createdAt: "2026-07-24T00:00:00.000Z",
  answers: {},
  signals: [{ id: "creativeExpression", evidence: "repeated", evidenceRefs: [] }],
  traits: [],
  areas: [{ id: "design", evidence: "developing", evidenceRefs: [], roleIds: ["ux-designer"] }],
  context: { familyInfluence: null, familyPriorities: [], weaknessPatterns: [] },
  syncStatus: "synced",
};

describe("career-goal achievements page", () => {
  let container: HTMLDivElement;
  let root: Root | null;
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
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    localStorage.clear();
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(assessment));
    localStorage.setItem(directionStorageKey, JSON.stringify(selectDirectionRole(createAreaDirectionPlan("design"), "ux-designer")));
    mocks.replace.mockReset();
    mocks.hydrate.mockReset().mockResolvedValue(null);
    mocks.totalPoints.mockReset().mockResolvedValue(185);
    mocks.tier.mockReset().mockResolvedValue({ name: "bronze" });
    mocks.medals.mockReset().mockResolvedValue({ total: 2, common: 1, rare: 1, epic: 0 });
    mocks.stats.mockReset().mockResolvedValue({ games: 2, sparks: 1, challenges: 1, goodReads: 0 });
    mocks.points.mockReset().mockResolvedValue({ games: 30, sparks: 10, challenges: 20, goodReads: 0, streaks: 0 });
    mocks.weekly.mockReset().mockResolvedValue({ goodReads: { current: 0, target: 5 }, challenges: { current: 1, target: 5 }, sparks: { current: 1, target: 5 } });
    mocks.history.mockReset().mockResolvedValue([{ id: "point-1", category: "sparks", reason: "Career Spark", points: 10, createdAt: "2026-07-24T00:00:00.000Z" }]);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = null;
    container.remove();
  });

  it("keeps achievements focused on recognition, weekly progress, medals, and points history", async () => {
    await act(async () => { root?.render(<AchievementsPage />); });
    await act(async () => {
      await vi.waitFor(() => expect(container.textContent).toContain("Achievements summary"));
    });

    expect(container.textContent).toContain("Weekly progress");
    expect(container.textContent).toContain("Activities completed: 4");
    expect(container.textContent).toContain("Educational games");
    expect(container.textContent).toContain("Medals");
    expect(container.textContent).toContain("Points history");
    expect(container.textContent).toContain("Career Spark");
    expect(container.textContent).not.toContain("Design and Media");
    expect(container.textContent).not.toContain("Discuss the plan");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

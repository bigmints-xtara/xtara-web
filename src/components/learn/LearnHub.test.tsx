import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assessmentV2StorageKey, type DiscoveryResult } from "@/lib/assessment-v2";
import { createAreaDirectionPlan, directionStorageKey, selectDirectionRole } from "@/lib/direction";
import { getMyCareerPathExperience } from "@/lib/experience-api";

vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "learner-1" } }) }));
vi.mock("@/i18n/language-provider", () => ({ useTranslations: () => ({ locale: "en" }) }));
vi.mock("@/lib/experience-api", () => ({
  getMyCareerPathExperience: vi.fn(async () => ({
    version: "1.3.0",
    surface: "my-career-path",
    progress: { completed: 0, total: 3, goals: [] },
    nextBest: {
      id: "lessons:spark-1",
      goalId: "learn",
      kind: "lessons",
      title: "Design lesson 1",
      reason: "Start here",
      reasonCode: "dream_career_match",
      action: { type: "open_content", contentGroupId: "lessons", contentId: "spark-1" },
      policyVersion: "next-best-v1",
    },
    alternatives: [],
    contentGroups: [
      { id: "stories", title: "Stories", description: "", items: [{ id: "story-1", title: "A designer at work", description: "Story", slides: [{ title: "Start", description: "Begin" }] }] },
      { id: "lessons", title: "Lessons", description: "", items: [] },
      { id: "games", title: "Games", description: "", items: [{ id: "game-1", title: "Design detective", mode: "quiz" }] },
      { id: "challenges", title: "Challenges", description: "", items: [{ id: "challenge-1", title: "Improve a form", points: 10 }] },
      { id: "reads", title: "Reads", description: "", items: [{ id: "read-1", title: "How design decisions work" }] },
    ],
    contentLibraries: [
      { id: "lessons", title: "Lessons", description: "", items: Array.from({ length: 6 }, (_, index) => ({ id: `spark-${index + 1}`, title: `Design lesson ${index + 1}` })) },
      { id: "stories", title: "Stories", description: "", items: [] },
      { id: "games", title: "Games", description: "", items: [] },
      { id: "challenges", title: "Challenges", description: "", items: [] },
      { id: "reads", title: "Reads", description: "", items: [] },
    ],
  })),
}));
vi.mock("@/components/home/StorySlideshow", () => ({ default: ({ story }: { story: { title: string } }) => <div>Story slideshow: {story.title}</div> }));
vi.mock("@/components/home/DownloadAppModal", () => ({ default: () => null }));

import LearnHub from "./LearnHub";

const assessment: DiscoveryResult = {
  definitionId: "career-discovery", version: "3.0.0", stage: "grade8", locale: "en", createdAt: "2026-08-01T00:00:00.000Z", answers: {},
  signals: [{ id: "creativeExpression", evidence: "repeated", evidenceRefs: [] }], traits: [],
  areas: [{ id: "design", evidence: "developing", evidenceRefs: [], roleIds: ["ux-designer"] }],
  context: { familyInfluence: null, familyPriorities: [], weaknessPatterns: [] }, syncStatus: "synced",
};

describe("Learn information architecture", () => {
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
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => { if (root) act(() => root?.unmount()); root = null; container?.remove(); });

  it("owns learning shelves in the mobile order and caps root shelves at five items", async () => {
    await act(async () => { root?.render(<LearnHub />); });

    const content = container.textContent || "";
    expect(container.querySelector("#learn-page-title")?.textContent).toBe("Learn");
    expect(content).toContain("Your learning");
    expect(content).toContain("0/3");
    expect(content).toContain("Continue");
    expect(content.indexOf("Stories")).toBeLessThan(content.indexOf("Sparks"));
    expect(content.indexOf("Sparks")).toBeLessThan(content.indexOf("Reading challenges"));
    expect(content.indexOf("Reading challenges")).toBeLessThan(content.indexOf("Good reads"));
    expect(content).toContain("Design lesson 5");
    expect(content).not.toContain("Design lesson 6");
    expect(content).not.toContain("My Career Direction");
    expect(content).not.toContain("Design detective");
    expect(content).not.toContain("Games");
    expect(container.querySelector('a[href="/learn/sparks"]')?.textContent).toContain("View all");
  });

  it("uses the published library when a personalized shelf is empty", async () => {
    await act(async () => { root?.render(<LearnHub />); });

    expect(container.textContent).toContain("Design lesson 1");
    expect(container.textContent).toContain("Design lesson 5");
    expect(container.textContent).not.toContain("Design lesson 6");
  });

  it("opens a story in the slideshow", async () => {
    await act(async () => { root?.render(<LearnHub />); });
    const story = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("A designer at work"));
    await act(async () => { story?.click(); });
    expect(container.textContent).toContain("Story slideshow: A designer at work");
  });

  it("shows a caught-up state when no actionable content remains", async () => {
    vi.mocked(getMyCareerPathExperience).mockResolvedValueOnce({
      version: "1.3.0",
      surface: "my-career-path",
      progress: { completed: 2, total: 3, goals: [] },
      nextBest: null,
      alternatives: [],
      contentGroups: ["stories", "lessons", "games", "challenges", "reads"]
        .map((id) => ({ id, title: id, description: "", items: [] })),
      contentLibraries: ["stories", "lessons", "games", "challenges", "reads"]
        .map((id) => ({ id, title: id, description: "", items: [] })),
    } as never);

    await act(async () => { root?.render(<LearnHub />); });

    expect(container.textContent).toContain("You're all caught up");
    expect(container.textContent).toContain("New activities will appear here when they're ready.");
    expect(container.querySelectorAll('[id^="learn-"]')).toHaveLength(1);
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assessmentV2StorageKey, type DiscoveryResult } from "@/lib/assessment-v2";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/Header", () => ({ default: () => <header>Header</header> }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/i18n/language-provider", () => ({ useTranslations: () => ({ locale: "en" }) }));

import DiscoveryResultPage from "./page";

const result: DiscoveryResult = {
  definitionId: "career-discovery",
  version: "3.0.0",
  stage: "grade8",
  locale: "en",
  createdAt: "2026-07-27T00:00:00.000Z",
  answers: {},
  signals: [{
    id: "analysis",
    evidence: "repeated",
    evidenceRefs: [{ questionId: "activityCuriosity", optionId: "investigate" }],
  }],
  traits: [{
    id: "adaptive",
    evidenceRefs: [{ questionId: "socialEnergy", optionId: "depends" }],
  }],
  areas: ["health", "technology", "science"].map((id) => ({
    id,
    evidence: "developing" as const,
    evidenceRefs: [
      { questionId: "activityCuriosity", optionId: "buildDigital" },
      { questionId: "activityCuriosity", optionId: "investigate" },
      { questionId: "activityExperience", optionId: "problemSolving" },
    ],
    roleIds: id === "health"
      ? ["physician", "physiotherapist", "biomedical-engineer"]
      : id === "technology"
        ? ["software-developer", "cybersecurity-analyst"]
        : ["environmental-scientist", "data-scientist"],
  })),
  context: { familyInfluence: "open", familyPriorities: [], weaknessPatterns: ["confidence"] },
  syncStatus: "temporary",
};

describe("discovery result chooser", () => {
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
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(result));
    mocks.push.mockReset();
  });

  it("puts the direction decision first without badges or assessment jargon", async () => {
    const { container } = render(<DiscoveryResultPage />);

    expect(await screen.findByRole("heading", { name: "Choose a Career Direction to explore." })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Explore these careers:/ })).toHaveLength(3);
    expect(screen.getByRole("list", { name: "Health careers" })).toHaveTextContent("Physician");
    expect(screen.getByRole("list", { name: "Health careers" })).toHaveTextContent("Physiotherapist");
    expect(screen.getByRole("list", { name: "Health careers" })).toHaveTextContent("Biomedical Engineer");
    expect(screen.getByRole("link", { name: "Review my answers" })).toHaveAttribute("href", "/assessment");
    expect(container.querySelector("[data-slot='badge']")).toBeNull();
    expect(container.textContent).not.toContain("Strong pattern");
    expect(container.textContent).not.toContain("Repeated pattern");
    expect(container.textContent).not.toContain("Temporary until signup");
    expect(container.textContent).not.toContain("What to do next");
  });

  it("does not repeat the same answer beneath every direction", async () => {
    render(<DiscoveryResultPage />);
    await screen.findByRole("heading", { name: "Choose a Career Direction to explore." });

    expect(screen.getAllByText("Build an app, game, website, or digital tool")).toHaveLength(1);
    expect(screen.getAllByText("Investigate a question through facts or experiments")).toHaveLength(1);
    expect(screen.getAllByText("Puzzles, science investigations, coding, or research")).toHaveLength(1);
  });
});

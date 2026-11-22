import explorerStyles from "@/components/careers/ExploreCareers.module.css";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assessmentV2StorageKey, type DiscoveryResult } from "@/lib/assessment-v2";

vi.mock('@/components/careers/explorer/useCareerExplorer', () => ({
  useCareerExplorer: () => ({
    data: { directions: [{
      id: 'engineering-and-built-world',
      title: 'Engineering and Built World',
      summary: 'Design, build, and improve infrastructure.',
      illustration: { url: 'https://example.test/engineering.webp', alt: 'Engineering world' },
      presentation: { accent: '#8b6224', tint: '#faedca', wash: '#fae5b2', washEnd: '#f9f0d9' },
    }] },
  }),
}));

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/Header", () => ({ default: () => <header>Header</header> }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/i18n/language-provider", () => ({ useTranslations: () => ({ locale: "en" }) }));

import DiscoveryResultPage from "./page";
import DirectionPicker from "@/components/journey/DiscoveryResultPage";

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

  it("lets a returning learner browse recommended directions and choose from Explorer", async () => {
    const { container } = render(<DirectionPicker choosing />);
    expect(await screen.findByRole("link", { name: "My Direction" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByText("Assessment insights")).not.toBeInTheDocument();
    const carousel = container.querySelector('[aria-roledescription="carousel"]')!;
    const before = carousel.querySelector('[data-active="true"] h2')?.textContent;
    fireEvent.click(within(carousel as HTMLElement).getByRole("button", { name: "Next" }));
    const active = carousel.querySelector<HTMLElement>('[data-active="true"]')!;
    expect(active.querySelector("h2")?.textContent).not.toBe(before);
    const choose = within(active).getByRole("button", { name: /Choose this direction:/ });
    expect(choose).toHaveAttribute("data-variant", "surface");
    expect(choose).toHaveClass(explorerStyles.cardAction);
    fireEvent.click(choose);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(expect.stringMatching(/^\/assessment\/careers\//)));
  });

  it("puts the direction decision first without badges or assessment jargon", async () => {
    const { container } = render(<DiscoveryResultPage />);

    expect(await screen.findByRole("heading", { name: "Choose a direction" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Choose this direction:/ })).toHaveLength(1);
    const featured = screen.getAllByRole("article")[0];
    const details = featured.querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(within(featured).getByText("Physician")).not.toBeVisible();
    fireEvent.click(within(featured).getByText("Details"));
    expect(details).toHaveAttribute("open");
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

  it('keeps server order, uses published artwork and separates browse from choosing', async () => {
    const longTitle = 'Engineering and Designing Sustainable Infrastructure for Communities';
    const engineering = { ...result.areas[0], id: 'engineering-and-built-world' };
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify({
      ...result,
      areas: [result.areas[0], engineering, result.areas[1]],
      catalogSnapshot: { roles: [], directions: [
        { id: engineering.id, gradeGuidance: { en: {} }, translations: { en: { title: longTitle, summary: 'Full description for Engineering.' } } },
      ] },
    }));
    const { container } = render(<DiscoveryResultPage />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAttribute('data-featured', 'true');
    expect(cards[1]).toHaveAttribute('data-featured', 'false');
    expect(within(cards[1]).getByRole('heading', { name: longTitle })).toBeVisible();
    expect(within(cards[1]).getByText('Full description for Engineering.')).not.toBeVisible();
    fireEvent.click(within(cards[1]).getByText('Details'));
    expect(within(cards[1]).getByText('Full description for Engineering.')).toBeVisible();
    expect(cards[1].querySelector('img')).toHaveAttribute('src', 'https://example.test/engineering.webp');
    expect(cards[1].querySelector('img')).toHaveAttribute('alt', '');
    fireEvent.keyDown(within(cards[1]).getByRole('button', { name: `More options: ${longTitle}` }), { key: 'Enter' });
    expect(await screen.findByRole('menuitem', { name: 'View all careers' })).toHaveAttribute('href', '/explore?direction=engineering-and-built-world&step=roles');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(container.querySelector('header')!.compareDocumentPosition(screen.getByRole('heading', { level: 1 })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(within(cards[1]).getByRole('button', { name: longTitle }));
    expect(mocks.push).toHaveBeenCalledWith('/assessment/careers/engineering-and-built-world');
  });

  it('shows the published name for a saved result without a catalogue snapshot', () => {
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify({
      ...result, areas: [{ ...result.areas[0], id: 'engineering-and-built-world' }],
    }));

    render(<DiscoveryResultPage />);

    expect(screen.getByRole('heading', { name: 'Engineering and Built World' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choose this direction: Engineering and Built World' })).toBeVisible();
  });

  it("does not repeat the same answer beneath every direction", async () => {
    render(<DiscoveryResultPage />);
    await screen.findByRole("heading", { name: "Choose a direction" });

    expect(screen.getAllByText("Build an app, game, website, or digital tool")).toHaveLength(1);
    expect(screen.getAllByText("Investigate a question through facts or experiments")).toHaveLength(1);
    expect(screen.getAllByText("Puzzles, science investigations, coding, or research")).toHaveLength(1);
  });
});

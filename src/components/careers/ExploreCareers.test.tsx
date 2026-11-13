import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExploreCareers, { safeSourceUrl } from "./ExploreCareers";
import { getCareerExplorer } from "@/lib/career-explorer-api";
import type { CareerExplorerResponse } from "@/types/career-explorer";
import {
  readExploreState,
  exploreUrl,
  previousExploreState,
} from "./explorer/state";
vi.mock("@/i18n/language-provider", () => ({
  useTranslations: () => ({ locale: "en" }),
}));
vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/lib/career-explorer-api", () => ({ getCareerExplorer: vi.fn() }));
const fixture: CareerExplorerResponse = {
  schemaVersion: 1,
  locale: "en",
  catalogSource: "database",
  directions: [
    {
      id: "build",
      title: "Build things",
      summary: "Make places for people",
      careerIds: ["civil"],
      industryIds: ["hospital"],
      translationFallback: false,
    },
    {
      id: "health",
      title: "Help people",
      summary: "Care for people",
      careerIds: ["doctor"],
      industryIds: ["hospital"],
      translationFallback: false,
    },
  ],
  industries: [
    {
      id: "hospital",
      title: "Hospitals",
      description: "",
      directionIds: ["build", "health"],
      careerIds: ["civil", "doctor"],
      translationFallback: false,
    },
  ],
  careers: [
    {
      id: "civil",
      title: "Civil Engineer",
      summary: "Design safe buildings",
      directionIds: ["build"],
      industryIds: ["hospital"],
      activities: ["Plan structures"],
      subjects: ["Mathematics"],
      studyRoutes: [
        {
          id: "degree",
          title: "Civil engineering degree",
          description: "Check course entry requirements",
          sourceIds: ["official"],
        },
      ],
      sources: [
        {
          id: "official",
          label: "Official provider",
          url: "https://example.org/course",
        },
      ],
      relatedCareerIds: ["doctor"],
      translationFallback: false,
    },
    {
      id: "doctor",
      title: "Doctor",
      summary: "Care for patients",
      directionIds: ["health"],
      industryIds: ["hospital"],
      activities: [],
      subjects: [],
      studyRoutes: [],
      sources: [],
      relatedCareerIds: [],
      translationFallback: true,
    },
  ],
};
function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <ExploreCareers />
    </QueryClientProvider>,
  );
}
afterEach(cleanup);
beforeEach(() => {
  window.scrollTo = vi.fn();
  vi.mocked(getCareerExplorer)
    .mockReset()
    .mockResolvedValue(structuredClone(fixture));
  window.history.replaceState({}, "", "/explore");
});
describe("career exploration", () => {
  it("focuses a neighboring direction before opening it and keeps one primary action", async () => {
    mount();
    await screen.findByRole('heading', { name: 'What interests you?' });
    expect(screen.getAllByRole('button', { name: 'Explore this direction' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Career directions: Help people' }));
    expect(window.location.search).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Explore this direction' }));
    expect(window.location.search).toContain('direction=health');
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Meet this career' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Doctor');
    expect(screen.getByText(/Some information is shown in English/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take the assessment' })).toHaveAttribute('href', '/assessment');
  });
  it("shows API artwork and career chapters without exposing public study routes", async () => {
    const graph = structuredClone(fixture);
    graph.careers[0].illustration = { url: 'https://example.org/civil.webp', alt: 'A civil engineer' };
    graph.careers[0].skills = ['Listening'];
    graph.careers[0].workplaces = ['Building sites'];
    graph.careers[0].tradeoffs = ['Work can happen outdoors'];
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    window.history.replaceState({}, '', '/explore?direction=build&career=civil&step=study');
    mount();
    expect(await screen.findByText('Plan structures')).toBeInTheDocument();
    expect(screen.getByAltText('A civil engineer')).toHaveAttribute('src', 'https://example.org/civil.webp');
    expect(screen.queryByText('Civil engineering degree')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Skills you’ll use/ }));
    expect(screen.getByText('Listening')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('tab', { name: /Skills you’ll use/ }), { key: 'ArrowRight' });
    expect(screen.getByText('Building sites')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Good to know/ }));
    expect(screen.getByText('Work can happen outdoors')).toBeInTheDocument();
  });
  it("opens an optional specialization with its three connected contexts", async () => {
    const graph = structuredClone(fixture);
    graph.careers[0].specializationIds = ['structures'];
    graph.careers.push({ ...graph.careers[0], id: 'structures', title: 'Structural Engineering', parentCareerId: 'civil', specializationIds: [] });
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    window.history.replaceState({}, '', '/explore?direction=build&step=roles');
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Explore specializations' }));
    expect(window.location.search).toContain('step=specializations');
    expect(screen.getByRole('heading', { name: 'Structural Engineering' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Meet this career' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Structural Engineering');
    expect(window.location.search).toContain('career=structures');
  });
  it("offers retry and an honest empty catalogue", async () => {
    vi.mocked(getCareerExplorer).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ...fixture, careers: [], directions: [], industries: [] });
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading careers');
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No careers are available yet. Please check again later.')).toBeInTheDocument();
  });
  it("restores published career links and responds to browser navigation", async () => {
    window.history.replaceState({}, '', '/explore?direction=build&career=civil&step=work');
    mount();
    expect(await screen.findByText('Plan structures')).toBeInTheDocument();
    window.history.replaceState({}, '', '/explore?direction=health&step=roles');
    fireEvent.popState(window);
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
    expect(screen.queryByText('Plan structures')).not.toBeInTheDocument();
  });
  it("normalizes invalid links without losing valid cross-direction roles", () => {
    expect(readExploreState('?direction=build&industry=hospital&career=doctor&step=study', fixture).career).toBe('doctor');
    expect(readExploreState('?direction=build&career=doctor&step=study', fixture).career).toBeNull();
    const state = readExploreState('?direction=build&career=civil&step=study&view=cards', fixture);
    expect(readExploreState(exploreUrl(state).split('?')[1], fixture)).toEqual(state);
    expect(previousExploreState(state).step).toBe('work');
    expect(readExploreState('?direction=bogus&industry=bogus', fixture).step).toBe('directions');
  });
  it('only renders safe web artwork URLs', () => {
    expect(safeSourceUrl('javascript:alert(1)')).toBeNull();
    expect(safeSourceUrl('https://example.org')).toBe('https://example.org/');
  });
});

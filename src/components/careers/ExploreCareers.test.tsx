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
const { setLocale } = vi.hoisted(() => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/language-provider", () => ({
  useTranslations: () => ({ locale: "en", setLocale, t: (key: string) => key }),
}));
vi.mock("@/components/Header", () => ({
  default: function SharedHeader() {
    return (
      <header>
        <select aria-label="languageSwitcher.label" onChange={event => setLocale(event.target.value)}>
          <option value="en">English</option>
          <option value="ml">Malayalam</option>
        </select>
      </header>
    );
  },
}));
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  setLocale.mockReset();
  window.scrollTo = vi.fn();
  vi.mocked(getCareerExplorer)
    .mockReset()
    .mockResolvedValue(structuredClone(fixture));
  window.history.replaceState({}, "", "/explore");
});
describe("career exploration", () => {
  it('retains the chapter structure for sparse careers and navigates from the direction orb', async () => {
    window.history.replaceState({}, '', '/explore?direction=health&career=doctor&step=work');
    mount();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    for (const name of ['What you’ll do', 'Skills you’ll use', 'Where you’ll work', 'Good to know']) {
      expect(screen.getByRole('region', { name })).toHaveTextContent('More about this part of the career is coming soon.');
    }
    fireEvent.click(screen.getAllByRole('button', { name: 'Help people' }).at(-1)!);
    expect(window.location.search).toContain('step=roles');
    expect(window.location.search).not.toContain('career=');
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
  });
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
    expect(screen.getByText('Listening')).toBeInTheDocument();
    expect(screen.getByText('Building sites')).toBeInTheDocument();
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
  it('invites guests to save their selected career before signup and preserves their choice in both auth links', async () => {
    window.history.replaceState({}, '', '/explore?direction=build&career=civil&step=work');
    mount();
    fireEvent.click(await screen.findByRole('button',{name:'Pursue this career'}));
    expect(window.location.search).toContain('step=pursuit');
    expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Make it yourDream Career.');
    expect(screen.getByRole('heading',{name:'Civil Engineer'})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Create an account'})).toHaveAttribute('href','/signup?pursueCareer=civil&directionId=build&next=%2Fdashboard');
    expect(screen.getByRole('link',{name:'Sign in'})).toHaveAttribute('href','/login?pursueCareer=civil&directionId=build&next=%2Fdashboard');
    fireEvent.click(screen.getByRole('button',{name:'Change choice'}));
    expect(window.location.search).toContain('direction=build');
    expect(window.location.search).not.toContain('career=civil');
    expect(screen.getByRole('button',{name:'Meet this career'})).toBeInTheDocument();
  });
  it.each(['work', 'pursuit'])('retains the selected career and %s step when a locale change refreshes the router', async step => {
    // Next's native-history integration ignores writes already marked as internal.
    // A refresh uses the last URL synchronized through that integration.
    let routerLocation = '/explore';
    const nativePush = window.history.pushState.bind(window.history);
    window.history.replaceState({__NA:true}, '', routerLocation);
    vi.spyOn(window.history, 'pushState').mockImplementation((state, unused, url) => {
      if (!state?.__NA && !state?._N) routerLocation = String(url);
      nativePush({ ...state, __NA:true }, unused, url);
    });
    setLocale.mockImplementation(() => {
      window.history.replaceState({__NA:true}, '', routerLocation);
      fireEvent.popState(window);
    });
    mount();
    fireEvent.click(await screen.findByRole('button',{name:'Explore this direction'}));
    fireEvent.click(screen.getByRole('button',{name:'Meet this career'}));
    if (step === 'pursuit') fireEvent.click(screen.getByRole('button',{name:'Pursue this career'}));
    fireEvent.change(screen.getByRole('combobox',{name:'languageSwitcher.label'}),{target:{value:'ml'}});
    expect(setLocale).toHaveBeenCalledWith('ml');
    expect(new URLSearchParams(window.location.search).get('direction')).toBe('build');
    expect(new URLSearchParams(window.location.search).get('career')).toBe('civil');
    expect(new URLSearchParams(window.location.search).get('step')).toBe(step);
    expect(screen.getByRole('heading',{level:1})).toHaveTextContent(step === 'pursuit' ? 'Make it yourDream Career.' : 'Civil Engineer');
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

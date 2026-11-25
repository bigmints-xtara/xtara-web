import explorerStyles from "./ExploreCareers.module.css";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExploreCareers, { safeSourceUrl } from "./ExploreCareers";
import { getCareerExplorer, getExplorerDirectionRecord } from "@/lib/career-explorer-api";
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
vi.mock("@/lib/career-explorer-api", () => ({ getCareerExplorer: vi.fn(), getExplorerDirectionRecord: vi.fn() }));
vi.mock("@/lib/career-overview-api", () => ({ getCareerOverview: vi.fn().mockRejectedValue(new Error("Unavailable")), getExplorerAccountContext: vi.fn() }));
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
  vi.mocked(getExplorerDirectionRecord).mockClear().mockImplementation(async id => ({
    id, published: true, translations: { en: { reflectionPrompt: 'Consider ' + id } },
    gradeGuidance: { en: { grade9: ['Try a school project'] } },
  } as Awaited<ReturnType<typeof getExplorerDirectionRecord>>));
  window.scrollTo = vi.fn();
  vi.mocked(getCareerExplorer)
    .mockReset()
    .mockResolvedValue(structuredClone(fixture));
  window.history.replaceState({}, "", "/explore");
});
describe("career exploration", () => {
  it('keeps one career carousel when paging updates the focused position', async () => {
    const graph = structuredClone(fixture);
    const careers = Array.from({ length: 5 }, (_, index) => ({
      ...graph.careers[0], id: `career-${index}`, title: `Career ${index}`,
    }));
    graph.careers = careers;
    graph.directions[0].careerIds = careers.map(career => career.id);
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.replaceState({}, '', '/explore?direction=build&step=roles');
    const { container } = mount();
    await screen.findByRole('button', { name: 'Next' });

    const expectOneCarousel = () => {
      expect(container.querySelectorAll('[aria-roledescription="carousel"]')).toHaveLength(1);
      expect(container.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(5);
      expect(screen.getAllByRole('button', { name: 'Meet this career' })).toHaveLength(1);
    };
    expectOneCarousel();
    for (let index = 0; index < 3; index++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expectOneCarousel();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
    fireEvent.click(screen.getByText('All careers in this direction · 5 careers and groups'));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a career' }), { target: { value: 'Career 2' } });
    expectOneCarousel();
    expect(errors.mock.calls.filter(args => String(args[0]).includes('same key'))).toHaveLength(0);
  });
  it('retains the chapter structure for sparse careers and navigates from the direction orb', async () => {
    window.history.replaceState({}, '', '/explore?direction=health&career=doctor&step=work');
    mount();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    for (const name of ['What you’ll do', 'Skills you’ll use', 'Where you’ll work', 'Good to know']) {
    const section = screen.getByRole('region', { name });
    expect(section.firstElementChild).toBe(screen.getByRole('heading', { name, level: 2 }));
    expect(section).toHaveTextContent('Reviewed guidance has not been published yet.');
    }
    fireEvent.click(screen.getAllByRole('button', { name: 'Help people' }).at(-1)!);
    expect(window.location.search).toContain('step=roles');
    expect(window.location.search).not.toContain('career=');
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
  });
  it("focuses a neighboring direction before opening it and keeps one primary action", async () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Explore career directions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/');
    fireEvent.click(screen.getByRole('button', { name: 'Start exploring' }));
    await screen.findByRole('heading', {name: 'How to explore'});
    await screen.findByRole('heading', { name: 'What interests you?' });
    expect(screen.queryByText('Follow your curiosity. See where it could take you.')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Explore this direction' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Career directions: Help people' }));
    expect(window.location.search).toBe('?view=map');
    expect(getExplorerDirectionRecord).not.toHaveBeenCalled();
    expect(screen.queryByText('Consider build')).not.toBeInTheDocument();
    const directionAction = screen.getByRole('button', { name: 'Explore this direction' });
    expect(directionAction).toHaveAttribute('data-variant', 'surface');
    expect(directionAction).toHaveClass(explorerStyles.cardAction);
    fireEvent.click(directionAction);
    expect(window.location.search).toContain('direction=health');
    expect(await screen.findByText('Consider health')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
    const careerAction = screen.getByRole('button', { name: 'Meet this career' });
    expect(careerAction).toHaveAttribute('data-variant', 'surface');
    expect(careerAction).toHaveClass(explorerStyles.cardAction);
    fireEvent.click(careerAction);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Doctor');
    expect(screen.getByText(/Some information is shown in English/)).toBeInTheDocument();
    const assessmentHref = screen.getByRole('link', { name: 'Take the assessment' }).getAttribute('href')!;
    const assessmentParams = new URL(assessmentHref, window.location.origin).searchParams;
    expect(assessmentParams.get('from')).toBe('explore');
    expect(assessmentParams.get('returnTo')).toBe(`/explore${window.location.search}`);
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
  it('opens Paediatric Cardiology through Medicine and restores its deep links', async () => {
    const graph = structuredClone(fixture);
    const health = graph.directions.find(direction => direction.id === 'health')!;
    health.id = 'health-and-wellbeing';
    health.title = 'Health & Wellbeing';
    health.careerIds = ['doctor'];
    const medicine = graph.careers.find(career => career.id === 'doctor')!;
    medicine.title = 'Medicine';
    medicine.directionIds = [health.id];
    medicine.specializationIds = ['cardiologist'];
    graph.careers.push(
      { ...medicine, id: 'cardiologist', title: 'Cardiology', parentCareerId: 'doctor', specializationIds: ['pediatric-cardiologist'] },
      { ...medicine, id: 'pediatric-cardiologist', title: 'Paediatric Cardiology', parentCareerId: 'cardiologist', specializationIds: [] },
    );
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    window.history.replaceState({}, '', `/explore?direction=${health.id}&step=roles`);
    const journey = mount();

    fireEvent.click(await screen.findByRole('button', { name: 'Explore specializations' }));
    expect(await screen.findByRole('heading', { name: /^Cardiology$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explore specializations' }));
    expect(await screen.findByRole('heading', { name: /^Paediatric Cardiology$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Meet this career$/ }));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Paediatric Cardiology');
    expect(screen.getByRole('navigation', { name: 'Your path' })).toHaveTextContent('Health & Wellbeing');

    const path = screen.getByRole('navigation', { name: 'Your path' });
    expect(Array.from(path.querySelectorAll('li')).map(item => item.textContent)).toEqual([
      'Career directions', 'Health & Wellbeing', 'Medicine', 'Cardiology', 'Paediatric Cardiology',
    ]);
    expect(path.querySelector('li[data-parent] a')).toHaveTextContent('Cardiology');
    const nestedQuery = 'career=pediatric-cardiologist&step=work';
    for (const query of [window.location.search, nestedQuery, `direction=${health.id}&${nestedQuery}`]) {
      expect(readExploreState(query, graph)).toMatchObject({
        direction: health.id, career: 'pediatric-cardiologist', step: 'work',
      });
    }
    expect(readExploreState(`direction=build&${nestedQuery}`, graph)).toMatchObject({
      direction: 'build', career: null, step: 'roles',
    });

    journey.unmount();
    window.history.replaceState({}, '', `/explore?${nestedQuery}`);
    mount();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Paediatric Cardiology');
    expect(screen.getByRole('navigation', { name: 'Your path' })).toHaveTextContent('Health & Wellbeing');
    fireEvent.click(screen.getByRole('button', { name: 'Pursue this career' }));
    expect(await screen.findByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href', '/signup?pursueCareer=pediatric-cardiologist&directionId=health-and-wellbeing&next=%2Fdashboard',
    );

    const cardiology = graph.careers.find(career => career.id === 'cardiologist')!;
    health.careerIds.push('missing-id');
    for (const brokenParent of ['missing-id', 'pediatric-cardiologist']) {
      cardiology.parentCareerId = brokenParent;
      expect(readExploreState(`direction=${health.id}&${nestedQuery}`, graph)).toMatchObject({
        direction: health.id, career: null, step: 'roles',
      });
    }
  });

  it('opens a legacy assessment Direction and keeps its group and detail context', async () => {
    const graph = structuredClone(fixture);
    graph.directions[0].id = 'engineering-and-built-world';
    graph.directions[0].title = 'Engineering & the Built World';
    graph.careers[0].specializationIds = ['structures'];
    graph.careers.push({
      ...graph.careers[0], id: 'structures', title: 'Structural Engineering',
      parentCareerId: 'civil', specializationIds: [],
    });
    window.history.replaceState({}, '', '/explore?direction=engineering&step=roles');
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    mount();
    expect(await screen.findByRole('navigation', { name: 'Your path' })).toHaveTextContent('Engineering & the Built World');
    fireEvent.click(await screen.findByRole('button', { name: 'Explore specializations' }));
    expect(window.location.search).toContain('direction=engineering-and-built-world');
    expect(window.location.search).toContain('step=specializations');
    fireEvent.click(await screen.findByRole('button', { name: /^Meet this career$/ }));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Structural Engineering');
    expect(screen.getByRole('navigation', { name: 'Your path' })).toHaveTextContent('Engineering & the Built World');
  });

  it('labels shared group artwork once and replaces it with the published specialization on refresh', async () => {
    const graph = structuredClone(fixture);
    const group = graph.careers[0];
    group.illustration = { url: 'https://example.org/civil.webp', alt: 'Civil engineering scene' };
    group.specializationIds = ['aerospace-engineer', 'structures'];
    graph.careers.push(...group.specializationIds.map((id, index) => ({
      ...group, id, title: index === 0 ? 'Aerospace Engineering' : 'Structural Engineering',
      parentCareerId: group.id, specializationIds: [], illustration: undefined,
    })));
    vi.mocked(getCareerExplorer).mockResolvedValue(graph);
    window.history.replaceState({}, '', '/explore?direction=build&career=civil&step=specializations');
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={query}><ExploreCareers /></QueryClientProvider>);
    await screen.findByRole('heading', { name: 'Aerospace Engineering' });
    expect(screen.getAllByAltText(group.illustration!.alt)).toHaveLength(1);
    expect(container.querySelector('[data-active="true"]')).toHaveTextContent(group.title);
    fireEvent.click(screen.getByRole('button', { name: 'Meet this career' }));
    expect(screen.getAllByAltText(group.illustration!.alt)).toHaveLength(1);

    const updated = structuredClone(graph);
    const url = 'https://xtara.ai/xtara-service/api/v1/media/images/799dc459faf1f1288bd94229706104b902fe234e96cf051ff609c8989759334d';
    updated.careers.find(career => career.id === 'aerospace-engineer')!.illustration = {
      url, alt: 'Aerospace Engineering',
    };
    vi.mocked(getCareerExplorer).mockResolvedValue(updated);
    await act(async () => { await query.invalidateQueries({ queryKey: ['career-explorer', 'en'] }); });
    expect(await screen.findByAltText('Aerospace Engineering')).toHaveAttribute('src', url);
    expect(screen.getAllByAltText(group.illustration!.alt)).toHaveLength(1);
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
    expect(screen.getByRole('heading', { name: 'About Civil Engineer' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Meet this career' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Structural Engineering');
    expect(window.location.search).toContain('career=structures');
    expect(screen.getByText('Within Build things, you explored Civil Engineer. Structural Engineering is a specialization of that career.')).toBeInTheDocument();
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
    let routerLocation = '/explore?view=map';
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
    window.history.replaceState({}, '', '/explore?view=map');
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

 it('exposes the complete ordered direction list and a directly mapped specialization', async () => {
  const graph = structuredClone(fixture);
  graph.careers.push(...Array.from({ length: 4 }, (_, i) => ({ ...graph.careers[0], id: `extra-${i}`, title: `Career ${i}`, parentCareerId: i === 3 ? 'unmapped-parent' : undefined })));
  graph.directions[0].careerIds = ['extra-3', 'civil', 'extra-0', 'extra-1', 'extra-2', 'civil'];
  vi.mocked(getCareerExplorer).mockResolvedValue(graph);
  window.history.replaceState({}, '', '/explore?direction=build&step=roles');
  mount();
  const summary = await screen.findByText('All careers in this direction · 5 careers and groups');
  fireEvent.click(summary);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Find a career' }), { target: { value: 'Career 3' } });
  fireEvent.click(screen.getByRole('button', { name: /^Career 3/ }));
  expect(window.location.search).toContain('career=extra-3');
 });

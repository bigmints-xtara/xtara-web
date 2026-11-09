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
  useTranslations: () => ({ locale: "en", setLocale: vi.fn() }),
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
afterEach(cleanup);
beforeEach(() => {
  vi.mocked(getCareerExplorer)
    .mockReset()
    .mockResolvedValue(structuredClone(fixture));
  window.history.replaceState({}, "", "/explore");
});
describe("career exploration", () => {
  it("follows workplaces across directions and keeps the study step when switching views", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /Build things.*Make places/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Hospitals" }));
    expect(
      screen.getByRole("button", { name: /Doctor.*Care for patients/ }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Civil Engineer.*Design safe/ }),
    );
    expect(screen.getByText("Plan structures")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "See what you could study" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Browse cards" }));
    expect(screen.getByText("Civil engineering degree")).toBeInTheDocument();
    expect(window.location.search).toContain("view=cards");
    expect(window.location.search).toContain("career=civil");
    fireEvent.click(screen.getByRole("button", { name: "Mind map" }));
    fireEvent.click(
      screen.getByRole("button", { name: "See where else this could lead" }),
    );
    expect(
      screen.getByRole("link", { name: "Take the assessment" }),
    ).toHaveAttribute("href", "/assessment");
    fireEvent.click(
      screen.getByRole("button", { name: /Doctor.*Care for patients/ }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Doctor",
    );
    expect(window.location.search).toContain("direction=health");
    expect(
      screen.getByText(/Some information is shown in English/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "See what you could study" }),
    );
    expect(
      screen.getByText(
        "Study information for this career is not available yet.",
      ),
    ).toBeInTheDocument();
  });
  it("keeps careers reachable without approved workplace links", async () => {
    const partial = structuredClone(fixture);
    partial.industries = [];
    partial.directions[0].industryIds = [];
    vi.mocked(getCareerExplorer).mockResolvedValue(partial);
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: /Build things.*Make places/ }),
    );
    expect(
      screen.getByText(/Places to work are still being connected/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "See all careers in this direction" }),
    );
    expect(
      screen.getByRole("button", { name: /Civil Engineer.*Design safe/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Doctor.*Care/ }),
    ).not.toBeInTheDocument();
  });
  it("restores a shared link and responds to browser navigation", async () => {
    window.history.replaceState(
      {},
      "",
      "/explore?direction=build&industry=hospital&career=civil&step=study",
    );
    mount();
    expect(
      await screen.findByText("Civil engineering degree"),
    ).toBeInTheDocument();
    window.history.replaceState(
      {},
      "",
      "/explore?view=cards&direction=health&step=roles",
    );
    fireEvent.popState(window);
    expect(
      screen.getByRole("button", { name: /Doctor.*Care/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Civil engineering degree"),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "missing" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("No careers match");
  });
  it("offers retry and shows an honest empty catalogue", async () => {
    vi.mocked(getCareerExplorer)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ...fixture,
        careers: [],
        directions: [],
        industries: [],
      });
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Loading careers");
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText(
        "No careers are available yet. Please check again later.",
      ),
    ).toBeInTheDocument();
  });
  it("normalizes invalid links without losing valid cross-direction roles", () => {
    expect(
      readExploreState(
        "?direction=build&industry=hospital&career=doctor&step=study",
        fixture,
      ).career,
    ).toBe("doctor");
    expect(
      readExploreState("?direction=build&career=doctor&step=study", fixture)
        .career,
    ).toBeNull();
    const state = readExploreState(
      "?direction=build&career=civil&step=study&view=cards",
      fixture,
    );
    expect(readExploreState(exploreUrl(state).split("?")[1], fixture)).toEqual(
      state,
    );
    expect(previousExploreState(state).step).toBe("work");
    expect(
      readExploreState("?direction=bogus&industry=bogus", fixture).step,
    ).toBe("directions");
  });
  it("only renders safe web source URLs", () => {
    expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeSourceUrl("https://example.org")).toBe("https://example.org/");
  });
});

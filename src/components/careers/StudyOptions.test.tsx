import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XtaraApiError, xtaraApi } from "@/lib/api/client";
import type { StudyOptionsResponse } from "@/lib/study-options";
import StudyOptions from "./StudyOptions";

const account = vi.hoisted(() => ({ state: "" }));
vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: account.state ? { uid: "learner-1", isAnonymous: false } : null,
    userProfile: account.state ? { uid: "learner-1", state: account.state } : null,
    loading: false,
  }),
}));
vi.mock("@/i18n/language-provider", () => ({ useTranslations: () => ({ locale: "en" }) }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  xtaraApi: { get: vi.fn() },
}));
vi.mock("@/lib/career-explorer-api", () => ({
  getCareerExplorer: vi.fn().mockResolvedValue({
    careers: [{ id: "ux-designer", title: "Digital Experience and Interface Design" }],
  }),
}));
vi.mock("@/lib/firebase/location", () => ({
  getStates: vi.fn().mockResolvedValue(["Karnataka", "Kerala"]),
}));

const path = "/explore/roles/ux-designer/study-options";
const apiPath = "/api/v1/study-options/ux-designer";
const push = vi.fn();
const offering = {
  offeringId: "offering-1",
  institutionId: "college:one",
  institutionName: "Example Design College",
  title: "Interaction design",
  state: "Karnataka",
  match: "direct" as const,
};
const programme = {
  courseConceptId: "programme-1",
  title: "Interaction design",
  qualificationCode: "BDes",
  offerings: [offering],
};

function page(overrides: Partial<StudyOptionsResponse> = {}): StudyOptionsResponse {
  return {
    careerId: "ux-designer",
    releaseId: "release-1",
    state: null,
    status: "available",
    programmes: [programme],
    nextCursor: null,
    ...overrides,
  };
}

function search(value = "") {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(value) as ReturnType<typeof useSearchParams>);
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const view = () => <QueryClientProvider client={client}><StudyOptions careerId="ux-designer" /></QueryClientProvider>;
  const rendered = render(view());
  return { navigate: (url: string) => {
    search(url.split("?")[1]);
    rendered.rerender(view());
  } };
}

beforeEach(() => {
  account.state = "";
  vi.mocked(xtaraApi.get).mockReset();
  vi.mocked(usePathname).mockReturnValue(path);
  vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  search();
});
afterEach(cleanup);

describe("Study options", () => {
  it("keeps a zero-result state strict until broadened and links the exact offering back to the same filter", async () => {
    search("state=Kerala");
    vi.mocked(xtaraApi.get).mockResolvedValueOnce(page({ state: "Kerala", status: "no_results", programmes: [] }))
      .mockResolvedValueOnce(page());
    const view = mount();
    expect(await screen.findByText("No listed offerings match in this state or union territory.")).toBeInTheDocument();
    expect(xtaraApi.get).toHaveBeenCalledExactlyOnceWith(`${apiPath}?state=Kerala`, expect.any(Object));
    fireEvent.click(screen.getByRole("button", { name: "See options across India" }));
    expect(push).toHaveBeenCalledWith(`${path}?state=all`, { scroll: false });
    view.navigate(`${path}?state=all`);
    const result = await screen.findByRole("link", { name: /Example Design College.*Direct study route/ });
    const url = new URL(result.getAttribute("href")!, window.location.origin);
    expect(url.pathname).toBe("/colleges/college%3Aone");
    expect(url.searchParams.get("offeringId")).toBe("offering-1");
    expect(url.searchParams.get("returnTo")).toBe(`${path}?state=all#study-offering-offering-1`);
    expect(xtaraApi.get).toHaveBeenLastCalledWith(apiPath, expect.any(Object));
  });

  it("uses the saved state and groups later offerings under the same programme", async () => {
    account.state = "Karnataka";
    vi.mocked(xtaraApi.get)
      .mockResolvedValueOnce(page({ state: "Karnataka", nextCursor: "opaque+page=" }))
      .mockResolvedValueOnce(page({
        state: "Karnataka",
        programmes: [{ ...programme, offerings: [{ ...offering, offeringId: "offering-2", institutionName: "Related College", match: "adjacent" }] }],
      }));
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Show more options" }));
    expect(await screen.findByRole("link", { name: /Related College.*Related study route/ })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Interaction design" })).toHaveLength(1);
    expect(xtaraApi.get).toHaveBeenNthCalledWith(1, `${apiPath}?state=Karnataka`, expect.any(Object));
    expect(xtaraApi.get).toHaveBeenNthCalledWith(2, `${apiPath}?state=Karnataka&cursor=opaque%2Bpage%3D`, expect.any(Object));
  });

  it("retries an unavailable catalogue and reports missing reviewed mappings separately", async () => {
    vi.mocked(xtaraApi.get).mockRejectedValueOnce(new XtaraApiError("unavailable", 503))
      .mockResolvedValueOnce(page({ status: "no_reviewed_mapping", programmes: [] }));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Study options are temporarily unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No study routes have been reviewed for this career yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See options across India" })).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XtaraApiError, xtaraApi } from "@/lib/api/client";
import CollegeDetailPage from "./page";

vi.mock("@/components/Header", () => ({ default: () => <header /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/i18n/language-provider", () => ({ useTranslations: () => ({ locale: "en" }) }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  xtaraApi: { get: vi.fn() },
}));

const returnTo = "/explore/roles/ux-designer/study-options?state=Karnataka#study-offering-offering-1";

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><CollegeDetailPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(xtaraApi.get).mockReset();
  vi.mocked(useParams).mockReturnValue({ id: "college:one" });
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams({
    offeringId: "offering-1",
    returnTo,
  }) as ReturnType<typeof useSearchParams>);
});
afterEach(cleanup);

describe("College offering detail", () => {
  it("decodes the route ID before retrying the exact offering and keeps the return link", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "college%3Aone" });
    vi.mocked(xtaraApi.get)
      .mockRejectedValueOnce(new XtaraApiError("Catalogue unavailable", 503))
      .mockResolvedValueOnce({
        id: "college:one",
        name: "Example Design College",
        website: "https://example.org/",
        releaseId: "release-1",
        courses: [{ id: "offering-1", name: "Interaction design" }],
      });
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("College details are temporarily unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Selected programme" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interaction design" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open official website" })).toHaveAttribute("href", "https://example.org/");
    expect(screen.getByRole("link", { name: "Back to study options" })).toHaveAttribute("href", returnTo);
    expect(xtaraApi.get).toHaveBeenLastCalledWith("/api/v1/colleges/college%3Aone?offeringId=offering-1", expect.any(Object));
  });

  it("shows a removed offering as missing and retains the link back to the filter", async () => {
    vi.mocked(xtaraApi.get).mockRejectedValue(new XtaraApiError("Offering not found", 404));
    mount();
    expect(await screen.findByRole("heading", { name: "This programme listing is no longer available." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to study options" })).toHaveAttribute("href", returnTo);
    expect(xtaraApi.get).toHaveBeenCalledWith("/api/v1/colleges/college%3Aone?offeringId=offering-1", expect.any(Object));
  });
});

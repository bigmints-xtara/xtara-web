import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";

const { observeAuth } = vi.hoisted(() => ({ observeAuth: vi.fn() }));
vi.mock("firebase/auth", () => ({ onAuthStateChanged: observeAuth }));
vi.mock("@/lib/firebase-client", () => ({
  getFirebaseAuth: () => ({}),
  getFirebaseConfigurationError: () => null,
}));
vi.mock("@/lib/discovery-cache-owner", () => ({ reconcileDiscoveryCacheOwner: vi.fn() }));
vi.mock("@/lib/firebase/auth-helpers", () => ({ getUserProfile: vi.fn() }));

it("keeps a public catalogue request in flight when Firebase first reports a guest", async () => {
  observeAuth.mockReturnValue(() => {});
  const client = new QueryClient();
  client.setQueryData(["account"], { private: true });
  let finishCatalogue!: (value: string) => void;
  const catalogue = client.fetchQuery({
    queryKey: ["career-explorer", "en"],
    queryFn: () => new Promise<string>((resolve) => { finishCatalogue = resolve; }),
    meta: { authScope: "public" },
  });
  render(<QueryClientProvider client={client}><AuthProvider><div /></AuthProvider></QueryClientProvider>);

  act(() => observeAuth.mock.calls[0][1](null));

  expect(client.getQueryData(["account"])).toBeUndefined();
  expect(client.getQueryState(["career-explorer", "en"])?.fetchStatus).toBe("fetching");
  finishCatalogue("Published catalogue");
  await expect(catalogue).resolves.toBe("Published catalogue");
});

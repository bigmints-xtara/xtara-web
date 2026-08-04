import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFirebaseAuth: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/lib/firebase-client", () => ({
  getFirebaseAuth: mocks.getFirebaseAuth,
}));

vi.mock("@/lib/api/config", () => ({
  getXtaraApiUrl: (path: string) => `https://api.example.test/api/v1${path}`,
}));

import { apiRequest } from "@/lib/api/client";

describe("Xtara API client", () => {
  beforeEach(() => {
    mocks.getFirebaseAuth.mockReset();
    mocks.fetch.mockReset();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("keeps public requests usable when Firebase auth is not configured", async () => {
    mocks.getFirebaseAuth.mockImplementation(() => {
      throw new Error("Firebase web configuration is missing");
    });
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      json: async () => ({ data: { id: "institution:10205" } }),
    } as Response);

    await expect(apiRequest<{ id: string }>("/colleges/institution%3A10205"))
      .resolves.toEqual({ id: "institution:10205" });

    expect(mocks.fetch).toHaveBeenCalledOnce();
    const [url, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/v1/colleges/institution%3A10205");
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });
});

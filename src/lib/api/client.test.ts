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

it('blocks an account-bound mutation when auth changes during token retrieval', async () => {
  let resolveToken!: (token: string) => void;
  let currentUser = { uid: 'account-a', getIdToken: () => new Promise<string>((resolve) => { resolveToken = resolve; }) };
  mocks.getFirebaseAuth.mockImplementation(() => ({ currentUser }));
  mocks.fetch.mockReset();
  vi.stubGlobal('fetch', mocks.fetch);
  const request = apiRequest('/me', { method: 'PATCH', body: { city: 'Old account city' }, expectedUserId: 'account-a' });
  currentUser = { uid: 'account-b', getIdToken: async () => 'b-token' };
  resolveToken('a-token');
  await expect(request).rejects.toThrow('account changed');
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('fails account-bound token errors closed without falling back to session cookies', async () => {
  mocks.getFirebaseAuth.mockReturnValue({ currentUser: { uid: 'account-a', getIdToken: async () => { throw new Error('token unavailable'); } } });
  mocks.fetch.mockReset();
  vi.stubGlobal('fetch', mocks.fetch);
  await expect(apiRequest('/me', { method: 'PATCH', expectedUserId: 'account-a' })).rejects.toThrow('token unavailable');
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('omits cookies and pins authorization for successful account-bound requests', async () => {
  mocks.getFirebaseAuth.mockReturnValue({ currentUser: { uid: 'account-a', getIdToken: async () => 'a-token' } });
  mocks.fetch.mockReset().mockResolvedValue({ ok: true, json: async () => ({ data: {} }), headers: new Headers() });
  vi.stubGlobal('fetch', mocks.fetch);
  await apiRequest('/me', { method: 'PATCH', expectedUserId: 'account-a', credentials: 'include' });
  expect(mocks.fetch.mock.calls[0][1].credentials).toBe('omit');
  expect(new Headers(mocks.fetch.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer a-token');
});

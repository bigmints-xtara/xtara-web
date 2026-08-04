import { afterEach, describe, expect, it, vi } from "vitest";

import { getXtaraApiBaseUrl, getXtaraApiUrl } from "@/lib/api/config";

describe("Xtara API routing", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the first-party API proxy in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_XTARA_API_BASE_URL", "");

    expect(getXtaraApiBaseUrl()).toBe("/xtara-service");
    expect(getXtaraApiUrl("/auth/session")).toBe("/xtara-service/api/v1/auth/session");
  });

  it("keeps the direct local API default in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_XTARA_API_BASE_URL", "");

    expect(getXtaraApiUrl("/organizations/context")).toBe("http://127.0.0.1:3111/api/v1/organizations/context");
  });

  it("honors an explicit preview API base URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_XTARA_API_BASE_URL", "https://preview-api.example/");

    expect(getXtaraApiUrl("/api/v1/me")).toBe("https://preview-api.example/api/v1/me");
  });
});

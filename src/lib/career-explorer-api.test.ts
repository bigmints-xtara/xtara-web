import { beforeEach, describe, expect, it, vi } from "vitest";
import { xtaraApi } from "./api/client";
import { getCareerExplorer } from "./career-explorer-api";
vi.mock("./api/client", () => ({ xtaraApi: { get: vi.fn() } }));
describe("career explorer contract", () => {
  beforeEach(() => vi.mocked(xtaraApi.get).mockReset());
  it("uses the generated public endpoint and forwards cancellation", async () => {
    const controller = new AbortController();
    const response = {
      schemaVersion: 1,
      locale: "hi",
      catalogSource: "database",
      directions: [],
      industries: [],
      careers: [],
    };
    vi.mocked(xtaraApi.get).mockResolvedValue(response);
    expect(await getCareerExplorer("hi", controller.signal)).toEqual(response);
    expect(xtaraApi.get).toHaveBeenCalledWith(
      "/api/v1/career-explorer?locale=hi",
      { signal: controller.signal },
    );
  });
  it("rejects wrong-language or incompatible responses", async () => {
    vi.mocked(xtaraApi.get).mockResolvedValue({
      schemaVersion: 1,
      locale: "en",
      directions: [],
      industries: [],
      careers: [],
    });
    await expect(getCareerExplorer("ml")).rejects.toThrow(
      "language and schema",
    );
    vi.mocked(xtaraApi.get).mockResolvedValue({
      schemaVersion: 2,
      locale: "en",
      directions: [],
      industries: [],
      careers: [],
    });
    await expect(getCareerExplorer("en")).rejects.toThrow(
      "language and schema",
    );
  });
});

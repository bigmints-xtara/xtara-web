import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ xtaraApi: api }));

import { getWeeklyPlan, saveWeeklyPlan, type WeeklyPlan } from "./weekly-plan-api";

const plan: WeeklyPlan = {
  version: "1.0.0",
  configured: true,
  weekStart: "2026-08-17T00:00:00.000Z",
  weekEnd: "2026-08-23T23:59:59.999Z",
  commitments: [
    { kind: "sparks", target: 5, completed: 2, done: false },
    { kind: "games", target: 3, completed: 3, done: true },
  ],
  suggestions: [
    { kind: "sparks", target: 5 },
    { kind: "games", target: 3 },
  ],
  completed: 5,
  total: 8,
};

describe("weekly plan API", () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue(plan);
    api.put.mockReset().mockResolvedValue(plan);
  });

  it("loads the current server projection", async () => {
    await expect(getWeeklyPlan()).resolves.toEqual(plan);
    expect(api.get).toHaveBeenCalledWith("/me/weekly-plan");
  });

  it("saves selected commitments and verifies exact readback", async () => {
    const commitments = [
      { kind: "sparks" as const, target: 5 },
      { kind: "games" as const, target: 3 },
    ];

    await expect(saveWeeklyPlan(commitments)).resolves.toEqual(plan);
    expect(api.put).toHaveBeenCalledWith("/me/weekly-plan", { commitments });
  });

  it("fails closed when the readback differs", async () => {
    api.put.mockResolvedValue({
      ...plan,
      commitments: [{ kind: "sparks", target: 2, completed: 0, done: false }],
    });

    await expect(
      saveWeeklyPlan([{ kind: "sparks", target: 5 }]),
    ).rejects.toThrow("not returned by account readback");
  });
});

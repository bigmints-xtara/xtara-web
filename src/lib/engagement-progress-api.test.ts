import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ xtaraApi: api }));

import {
  markGoodReadCompleted,
  markSparkCompleted,
  markStoryWatched,
  submitChallenge,
} from "./engagement-progress-api";

describe("engagement progress mutations", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset().mockResolvedValue({});
  });

  it.each([
    {
      mutate: () => markStoryWatched("story/1"),
      path: "/stories/story%2F1/watched",
      progress: { stories: [{ storyId: "story/1", watched: true }] },
    },
    {
      mutate: () => markGoodReadCompleted("read-1"),
      path: "/good-reads/read-1/read",
      progress: { goodReads: [{ goodReadId: "read-1", completed: true }] },
    },
    {
      mutate: () => markSparkCompleted("spark-1"),
      path: "/sparks/spark-1/complete",
      progress: { sparks: [{ sparkId: "spark-1", completed: true }] },
    },
  ])("writes $path and verifies account readback", async ({ mutate, path, progress }) => {
    api.get.mockResolvedValue(progress);

    await expect(mutate()).resolves.toMatchObject(Object.values(progress)[0][0]);

    expect(api.post.mock.calls[0]?.[0]).toBe(path);
    expect(api.get).toHaveBeenCalledWith("/me/engagement-progress");
    expect(api.post.mock.invocationCallOrder[0]).toBeLessThan(api.get.mock.invocationCallOrder[0]);
  });

  it("submits typed challenge answers before verifying the saved submission", async () => {
    api.get.mockResolvedValue({ challenges: [{ challengeId: "challenge-1", score: 2 }] });

    await submitChallenge("challenge-1", { answers: [1, 0], score: 2, isPractice: false });

    expect(api.post).toHaveBeenCalledWith("/challenges/challenge-1/submit", {
      answers: [1, 0],
      score: 2,
      isPractice: false,
    });
  });

  it("fails when the account readback does not contain the mutation", async () => {
    api.get.mockResolvedValue({ sparks: [] });

    await expect(markSparkCompleted("spark-1")).rejects.toThrow(
      "Saved sparks progress was not returned by account readback.",
    );
  });
});

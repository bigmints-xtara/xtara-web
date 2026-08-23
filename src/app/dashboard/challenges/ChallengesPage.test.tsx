import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getChallenge: vi.fn(),
  hasSubmission: vi.fn(),
  submit: vi.fn(),
  award: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "student-1", isAnonymous: false } }),
}));
vi.mock("@/lib/query/useContentQuery", () => ({
  useChallengesQuery: () => ({ data: [{ id: "challenge-1", title: "Improve a form" }], isLoading: false }),
}));
vi.mock("@/lib/api/content", () => ({
  ContentService: {
    getChallengeById: mocks.getChallenge,
    hasChallengeSubmission: mocks.hasSubmission,
    submitChallenge: mocks.submit,
  },
}));
vi.mock("@/lib/firebase/achievements-service", () => ({
  AchievementsService: class {
    addPointsForChallenge = mocks.award;
  },
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

import ChallengesPage from "./page";

describe("challenge submission", () => {
  beforeEach(() => {
    mocks.getChallenge.mockResolvedValue({
      id: "challenge-1",
      title: "Improve a form",
      content: "Read this and answer.",
      questions: [{
        id: "q1",
        question: "What should you do first?",
        options: ["Observe", "Assume"],
        correctOptionIndex: 0,
      }],
    });
    mocks.hasSubmission.mockResolvedValue(false);
    mocks.submit.mockResolvedValue(undefined);
    mocks.award.mockResolvedValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
  });

  it("loads prior progress and saves the typed attempt before points", async () => {
    render(<ChallengesPage />);

    fireEvent.click(screen.getByRole("button", { name: /improve a form/i }));
    fireEvent.click(await screen.findByRole("button", { name: /take the quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: /observe/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit challenge/i }));

    await screen.findByText("Challenge Completed!");
    expect(mocks.hasSubmission).toHaveBeenCalledWith("challenge-1");
    expect(mocks.submit).toHaveBeenCalledWith("challenge-1", {
      answers: [0],
      score: 1,
      isPractice: false,
    });
    expect(mocks.submit.mock.invocationCallOrder[0]).toBeLessThan(mocks.award.mock.invocationCallOrder[0]);
  });
});

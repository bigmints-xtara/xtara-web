import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getSpark: vi.fn(),
  complete: vi.fn(),
  award: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "spark-1" }),
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "student-1", isAnonymous: false } }),
}));
vi.mock("@/lib/firebase/firestore-service", () => ({
  FirestoreService: {
    getSparkById: mocks.getSpark,
    markSparkCompleted: mocks.complete,
  },
}));
vi.mock("@/lib/firebase/achievements-service", () => ({
  AchievementsService: class {
    addPointsForSpark = mocks.award;
  },
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

import SparkQuizPage from "./page";

describe("Spark completion", () => {
  beforeEach(() => {
    mocks.getSpark.mockResolvedValue({
      id: "spark-1",
      title: "Notice user needs",
      rewardPerQuestion: 2,
      knowledgeChecks: [{
        question: "Which answer is right?",
        options: ["Observe", "Guess"],
        correctOptionIndex: 0,
      }],
    });
    mocks.complete.mockResolvedValue(undefined);
    mocks.award.mockResolvedValue(true);
  });

  it("supports the normalized knowledge-check shape and persists before rewards", async () => {
    render(<SparkQuizPage />);

    fireEvent.click(await screen.findByRole("button", { name: /observe/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit quiz/i }));

    await screen.findByText("Quiz Completed!");
    expect(mocks.complete).toHaveBeenCalledWith("spark-1");
    expect(mocks.complete.mock.invocationCallOrder[0]).toBeLessThan(mocks.award.mock.invocationCallOrder[0]);
    await waitFor(() => expect(screen.getByText("2 pt")).toBeInTheDocument());
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getGoodRead: vi.fn(),
  complete: vi.fn(),
  linkOpened: vi.fn(),
  award: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "read-1" }),
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "student-1", isAnonymous: false } }),
}));
vi.mock("@/lib/firebase/firestore-service", () => ({
  FirestoreService: {
    getGoodReadById: mocks.getGoodRead,
    markGoodReadCompleted: mocks.complete,
    markGoodReadLinkOpened: mocks.linkOpened,
  },
}));
vi.mock("@/lib/firebase/achievements-service", () => ({
  AchievementsService: class {
    addPointsForGoodRead = mocks.award;
  },
}));

import GoodReadPage from "./page";

describe("Good Read completion", () => {
  beforeEach(() => {
    mocks.getGoodRead.mockResolvedValue({
      id: "read-1",
      title: "Design decisions",
      summary: "A short read.",
      hyperlink: "https://example.com/read",
    });
    mocks.complete.mockResolvedValue(undefined);
    mocks.linkOpened.mockResolvedValue(undefined);
    mocks.award.mockResolvedValue(false);
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("saves and reads back completion before awarding points", async () => {
    render(<GoodReadPage />);

    await waitFor(() => expect(mocks.award).toHaveBeenCalledWith("student-1", "read-1"));
    expect(mocks.complete).toHaveBeenCalledWith("read-1");
    expect(mocks.complete.mock.invocationCallOrder[0]).toBeLessThan(mocks.award.mock.invocationCallOrder[0]);

    fireEvent.click(screen.getByRole("button", { name: /read full article/i }));
    await waitFor(() => expect(mocks.linkOpened).toHaveBeenCalledWith("read-1"));
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyCareerPathExperience } from "@/lib/experience-api";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "learner-1" } }),
}));
vi.mock("@/i18n/language-provider", () => ({
  useTranslations: () => ({ locale: "en" }),
}));
vi.mock("@/lib/experience-api", () => ({
  getMyCareerPathExperience: vi.fn(),
}));
vi.mock("@/components/home/DownloadAppModal", () => ({
  default: () => null,
}));

import PlayHub from "@/components/play/PlayHub";

describe("Play information architecture", () => {
  beforeEach(() => {
    vi.mocked(getMyCareerPathExperience).mockReset().mockResolvedValue({
      version: "1.3.0",
      surface: "my-career-path",
      progress: { completed: 0, total: 3, goals: [] },
      nextBest: null,
      alternatives: [],
      contentGroups: [
        {
          id: "games",
          title: "Games",
          description: "",
          items: [{ id: "game-1", title: "Design detective", mode: "quiz" }],
        },
        {
          id: "stories",
          title: "Stories",
          description: "",
          items: [{ id: "story-1", title: "A designer at work" }],
        },
      ],
      contentLibraries: [],
    } as never);
  });

  it("lists games and presents truthful tournament and leaderboard states", async () => {
    render(<PlayHub />);

    expect(await screen.findByText("Design detective")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Games" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tournaments" })).toBeInTheDocument();
    expect(screen.getByText("No tournament is open right now")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("The leaderboard is waiting for a tournament")).toBeInTheDocument();
    expect(screen.queryByText("A designer at work")).not.toBeInTheDocument();
  });

  it("shows an honest empty state when no games are published", async () => {
    vi.mocked(getMyCareerPathExperience).mockResolvedValueOnce({
      version: "1.3.0",
      surface: "my-career-path",
      progress: { completed: 0, total: 0, goals: [] },
      nextBest: null,
      alternatives: [],
      contentGroups: [],
      contentLibraries: [],
    } as never);

    render(<PlayHub />);

    expect(await screen.findByText("No games are available right now")).toBeInTheDocument();
    expect(screen.getByText("New games will appear here when they are ready.")).toBeInTheDocument();
  });
});

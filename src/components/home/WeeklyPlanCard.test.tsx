import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WeeklyPlanCard from "@/components/home/WeeklyPlanCard";
import { LanguageProvider } from "@/i18n/language-provider";
import { getWeeklyPlan, saveWeeklyPlan, type WeeklyPlan } from "@/lib/weekly-plan-api";

vi.mock("@/lib/weekly-plan-api", () => ({
  getWeeklyPlan: vi.fn(),
  saveWeeklyPlan: vi.fn(),
}));

const unconfigured: WeeklyPlan = {
  version: "1.0.0",
  configured: false,
  weekStart: "2026-08-17T00:00:00.000Z",
  weekEnd: "2026-08-23T23:59:59.999Z",
  commitments: [],
  suggestions: [
    { kind: "sparks", target: 5 },
    { kind: "games", target: 3 },
    { kind: "reads", target: 2 },
    { kind: "challenges", target: 4 },
  ],
  completed: 0,
  total: 0,
};

describe("WeeklyPlanCard", () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    localStorage.clear();
    vi.mocked(getWeeklyPlan).mockReset().mockResolvedValue(unconfigured);
    vi.mocked(saveWeeklyPlan).mockReset().mockImplementation(async (commitments) => ({
      ...unconfigured,
      configured: true,
      commitments: commitments.map((item) => ({
        ...item,
        completed: item.kind === "sparks" ? 2 : 0,
        done: false,
      })),
      completed: 2,
      total: commitments.reduce((sum, item) => sum + item.target, 0),
    }));
  });

  it("lets the learner choose goals and shows persisted weekly progress", async () => {
    renderCard();

    expect(await screen.findByText("3 of 3 goals chosen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Play games" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Take challenges" }));
    fireEvent.click(screen.getByRole("button", { name: "Increase Take challenges" }));
    fireEvent.click(screen.getByRole("button", { name: "Save my weekly goals" }));

    await waitFor(() => {
      expect(saveWeeklyPlan).toHaveBeenCalledWith([
        { kind: "sparks", target: 5 },
        { kind: "challenges", target: 5 },
        { kind: "reads", target: 2 },
      ]);
    });
    expect(await screen.findByText("2 of 12 activities complete")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("button", { name: "Change my goals" })).toBeInTheDocument();
    expect(screen.getByText("Progress starts fresh every Monday.")).toBeInTheDocument();
  });

  it("shows a retry without hiding the rest of Dashboard when loading fails", async () => {
    vi.mocked(getWeeklyPlan).mockRejectedValue(new Error("offline"));
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your weekly goals could not be loaded.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

function renderCard() {
  return render(
    <LanguageProvider initialLocale="en">
      <WeeklyPlanCard />
    </LanguageProvider>,
  );
}

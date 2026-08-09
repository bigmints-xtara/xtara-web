import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Question } from "@/types/assessment";
import AssessmentEngine from "./AssessmentEngine";

const questions: Question[] = [
  {
    id: "currentGrade",
    label: "Which grade?",
    fieldType: "singleSelect",
    validation: { required: true },
    options: [{ id: "grade8", label: "Grade 8" }],
  },
  {
    id: "interest",
    label: "What interests you?",
    fieldType: "singleSelect",
    validation: { required: true },
    options: [{ id: "building", label: "Building things" }],
  },
];

describe("AssessmentEngine navigation", () => {
  it("uses confirmed Exit on step one and Back on later steps", () => {
    const onExit = vi.fn();
    const onAnswersChange = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });

    render(
      <AssessmentEngine
        questions={questions}
        onComplete={vi.fn()}
        onExit={onExit}
        onAnswersChange={onAnswersChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(screen.getByRole("dialog", { name: "Exit assessment?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByText("Which grade?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Grade 8" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exit" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Grade 8" })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Exit" }));
    expect(onExit).toHaveBeenCalledOnce();
    expect(onAnswersChange).toHaveBeenCalledWith({ currentGrade: "grade8" });
  });
});

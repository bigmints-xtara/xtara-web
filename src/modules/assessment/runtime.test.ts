import { describe, expect, it } from "vitest";

import {
  aggregateScoreChannels,
  getAssessmentQuestions,
  getVisibleAssessmentQuestions,
  normalizeAssessmentAnswers,
  updateAssessmentMultiSelect,
  validateAssessmentAnswer,
  type AssessmentDefinition,
} from ".";

const definition: AssessmentDefinition<"basic" | "advanced"> = {
  id: "reusable-example",
  version: "1.0.0",
  contexts: ["basic", "advanced"],
  commonQuestions: [{
    id: "interest", fieldType: "multiSelect", label: "Interest",
    validation: { required: true, minSelect: 1, maxSelect: 2 },
    options: [
      { id: "build", label: "Build", metadata: { scores: { making: 2 } } },
      { id: "none", label: "None", metadata: { exclusive: true } },
    ],
  }],
  contextualQuestions: {
    basic: [],
    advanced: [{ id: "detail", fieldType: "singleSelect", label: "Detail", showIf: { questionId: "interest", operator: "includes", value: "build" }, options: [{ id: "yes", label: "Yes" }] }],
  },
};

describe("reusable assessment runtime", () => {
  it("composes common and contextual modules", () => {
    expect(getAssessmentQuestions(definition, "basic").map((question) => question.id)).toEqual(["interest"]);
    expect(getAssessmentQuestions(definition, "advanced").map((question) => question.id)).toEqual(["interest", "detail"]);
  });

  it("handles visibility and validation without product-specific logic", () => {
    const questions = getAssessmentQuestions(definition, "advanced");
    expect(getVisibleAssessmentQuestions(questions, {}).map((question) => question.id)).toEqual(["interest"]);
    expect(getVisibleAssessmentQuestions(questions, { interest: ["build"] }).map((question) => question.id)).toEqual(["interest", "detail"]);
    expect(validateAssessmentAnswer(questions[0], [])).toBe(false);
    expect(validateAssessmentAnswer(questions[0], ["build"])).toBe(true);
  });

  it("enforces exclusive selections and aggregates generic score channels", () => {
    const question = definition.commonQuestions[0];
    expect(updateAssessmentMultiSelect(question, ["build"], "none")).toEqual(["none"]);
    expect(updateAssessmentMultiSelect(question, ["none"], "build")).toEqual(["build"]);
    expect(normalizeAssessmentAnswers([question], { interest: ["build", "none"], old: "value" })).toEqual({ interest: ["none"] });
    expect(aggregateScoreChannels([question], { interest: ["build"] }).get("making")?.score).toBe(2);
  });
});

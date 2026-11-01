import { describe, expect, it } from "vitest";

import {
  assessmentV2Version,
  buildDiscoveryResult,
  getAssessmentV2Questions,
  getDistinctAreaReasons,
  getAssessmentDraftStorageKey,
  getAssessmentStageQuestion,
  getCareerAssessmentDefinition,
  localizeDiscoveryResult,
  parseAssessmentStage,
  parseOptionalAssessmentStage,
  parseDiscoveryResult,
  loadAssessmentDraft,
  saveAssessmentDraft,
  clearAssessmentDraft,
} from "./assessment-v2";
import { createEmptyDreamCareer } from "./admin/configs/curatedDreamCareersConfig";
import { createEmptyFutureDirection } from "./admin/configs/futureDirectionsConfig";

const technologyAnswers = {
  activityCuriosity: ["buildDigital", "makeRepair"],
  activityExperience: ["problemSolving", "handsOn"],
  strengthConfidence: ["understand", "make", "coordinate"],
  strengthEvidence: ["project", "practice"],
  weaknessPattern: ["improve"],
  groupProjectStyle: "plan",
  newProblemStyle: "facts",
  socialEnergy: "balanced",
  setbackStyle: "retry",
  workValues: ["mastery", "build", "security"],
  familyInfluence: "preferred",
  familyPriorities: ["security", "interest"],
  familyExposure: ["technology"],
  experienceLevel: "some",
  grade8Exposure: ["school", "online"],
};

describe("career discovery definition", () => {
  it("uses one reusable definition with grade-adaptive question modules", () => {
    const definition = getCareerAssessmentDefinition("en");
    expect(definition.id).toBe("career-discovery");
    expect(definition.contexts).toEqual(["grade8", "grade9", "grade10", "grade11", "grade12"]);
    expect(getAssessmentV2Questions("grade8", "en").some((question) => question.id === "grade8Exposure")).toBe(true);
    expect(getAssessmentV2Questions("grade9", "en").some((question) => question.id === "grade9Evidence")).toBe(true);
    expect(getAssessmentV2Questions("grade10", "en").some((question) => question.id === "grade10Decision")).toBe(true);
    expect(getAssessmentV2Questions("grade8", "en").some((question) => question.id === "grade8Focus")).toBe(false);
  });

  it("defaults unknown stages to Grade 8", () => {
    expect(parseAssessmentStage("grade10")).toBe("grade10");
    expect(parseAssessmentStage("college")).toBe("grade8");
    expect(parseAssessmentStage(null)).toBe("grade8");
    expect(parseOptionalAssessmentStage(null)).toBeNull();
    expect(getAssessmentStageQuestion("en").options?.map((option) => option.id)).toEqual(["grade8", "grade9", "grade10", "grade11", "grade12"]);
  });

  it.each(["grade11", "grade12"] as const)("preserves %s across result and stage parsing in every locale", (stage) => {
    expect(parseAssessmentStage(stage)).toBe(stage);
    for (const locale of ["en", "ml", "hi", "ta"] as const) {
      const questions = getAssessmentV2Questions(stage, locale);
      const contextual = questions.find((question) => question.id.startsWith(stage));
      expect(contextual?.label).toBeTruthy();
      expect(contextual?.options?.length).toBeGreaterThan(0);
      const result = buildDiscoveryResult(stage, locale, { ...technologyAnswers, currentGrade: stage });
      expect(parseDiscoveryResult(JSON.stringify(result))?.stage).toBe(stage);
      expect(localizeDiscoveryResult(result, locale).nextActions.length).toBeGreaterThan(0);
    }
  });

  it("rejects unsupported stored stages and retains existing 3.0 results", () => {
    const result = buildDiscoveryResult("grade10", "en", technologyAnswers);
    expect(parseDiscoveryResult(JSON.stringify({ ...result, version: "3.0.0" }))?.stage).toBe("grade10");
    expect(parseDiscoveryResult(JSON.stringify({ ...result, stage: "grade13" }))).toBeNull();
  });

  it("recovers unchanged 3.0 drafts, prefers current drafts, and clears both after completion", () => {
    localStorage.clear();
    const legacyKey = "xtara_assessment_v2:draft:3.0.0:grade10";
    localStorage.setItem(legacyKey, JSON.stringify({ currentGrade: "grade10", experienceLevel: "some" }));
    expect(loadAssessmentDraft("grade10").experienceLevel).toBe("some");
    saveAssessmentDraft("grade10", { currentGrade: "grade10", experienceLevel: "new" });
    expect(loadAssessmentDraft("grade10").experienceLevel).toBe("new");
    clearAssessmentDraft("grade10");
    expect(loadAssessmentDraft("grade10")).toEqual({});
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it("keeps Tamil assessment identities aligned with English", () => {
    expect(getAssessmentV2Questions("grade8", "ta").map((question) => question.id)).toEqual(
      getAssessmentV2Questions("grade8", "en").map((question) => question.id),
    );
    expect(getAssessmentStageQuestion("ta").label).not.toBe(
      getAssessmentStageQuestion("en").label,
    );
  });

  it("versions drafts so a changed questionnaire never silently reuses stale answers", () => {
    expect(getAssessmentDraftStorageKey("grade8")).toContain(assessmentV2Version);
  });

  it("builds multidimensional directions without a fit percentage", () => {
    const result = buildDiscoveryResult("grade8", "en", technologyAnswers);
    expect(result.version).toBe(assessmentV2Version);
    expect(result.definitionId).toBe("career-discovery");
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.traits.length).toBeGreaterThan(0);
    expect(result.areas.some((area) => area.id === "technology")).toBe(true);
    expect(result.areas.find((area) => area.id === "technology")?.roleIds.length).toBeGreaterThan(0);
    expect(result.areas.find((area) => area.id === "business")?.evidenceRefs).toContainEqual({
      questionId: "strengthConfidence",
      optionId: "coordinate",
    });
    expect(result).not.toHaveProperty("matchScore");
  });

  it("shares distinct reasons across direction choices instead of repeating the same list", () => {
    const reasons = getDistinctAreaReasons([
      { id: "technology", reasons: ["Build a digital tool", "Test an idea", "Solve a puzzle"] },
      { id: "science", reasons: ["Build a digital tool", "Test an idea", "Solve a puzzle"] },
      { id: "business", reasons: ["Build a digital tool", "Test an idea", "Solve a puzzle"] },
    ]);

    expect(reasons).toEqual({
      technology: ["Build a digital tool"],
      science: ["Test an idea"],
      business: ["Solve a puzzle"],
    });
    expect(new Set(Object.values(reasons).flat()).size).toBe(3);
  });

  it("does not turn one singing answer into a career or adjacent-role suggestion", () => {
    const result = buildDiscoveryResult("grade8", "en", {
      activityCuriosity: ["performMusic"],
      experienceLevel: "new",
      familyInfluence: "open",
      familyPriorities: ["interest"],
      weaknessPattern: ["notSure"],
    });
    expect(result.signals.map((signal) => signal.id)).toContain("creativeExpression");
    expect(result.areas).toEqual([]);
  });

  it("keeps family pressure separate from career direction scoring", () => {
    const open = buildDiscoveryResult("grade8", "en", { ...technologyAnswers, familyInfluence: "open" });
    const strong = buildDiscoveryResult("grade8", "en", { ...technologyAnswers, familyInfluence: "strong" });
    expect(strong.areas.map((area) => area.id)).toEqual(open.areas.map((area) => area.id));
    expect(strong.context.familyInfluence).toBe("strong");
  });

  it("selects reviewed database directions deterministically and snapshots their content version", () => {
    const direction = {
      ...createEmptyFutureDirection(),
      id: "technology",
      slug: "technology",
      version: 7,
      status: "published" as const,
      published: true,
      translations: {
        en: { title: "Curated Technology", summary: "Reviewed summary", reflectionPrompt: "Try it" },
        ml: { title: "ക്യൂറേറ്റഡ് ടെക്നോളജി", summary: "പരിശോധിച്ച സംഗ്രഹം", reflectionPrompt: "പരീക്ഷിക്കൂ" },
      },
      signalWeights: { analysis: 2, making: 1 },
      minimumEvidence: { distinctQuestions: 2, distinctSignals: 2, totalScore: 2 },
      roleIds: ["software-developer"],
      skillIds: ["analysis", "making"],
      gradeGuidance: {
        en: { grade8: ["Try one reviewed activity"], grade9: [], grade10: [] },
        ml: { grade8: ["ഒരു പ്രവർത്തനം പരീക്ഷിക്കൂ"], grade9: [], grade10: [] },
      },
    };
    const role = {
      ...createEmptyDreamCareer(),
      id: "software-developer",
      slug: "software-developer",
      status: "published" as const,
      published: true,
      futureDirectionIds: ["technology"],
      primaryFutureDirectionId: "technology",
      translations: {
        en: { ...createEmptyDreamCareer().translations.en, title: "Reviewed Developer", summary: "Reviewed role" },
        ml: { ...createEmptyDreamCareer().translations.en, title: "പരിശോധിച്ച ഡെവലപ്പർ", summary: "പരിശോധിച്ച റോൾ" },
      },
    };
    const result = buildDiscoveryResult("grade8", "en", technologyAnswers, { directions: [direction], roles: [role] });
    expect(result.areas.map((area) => area.id)).toEqual(["technology"]);
    expect(result.areas[0].contentVersion).toBe(7);
    expect(result.catalogSnapshot?.directions[0].version).toBe(7);
    expect(localizeDiscoveryResult(result, "ml").areas[0].title).toBe("ടെക്നോളജി");
    expect(localizeDiscoveryResult(result, "en").areas[0].roles[0].title).toBe("Reviewed Developer");
  });

  it("relocalizes saved patterns, personality, roles, and context without rerunning", () => {
    const result = buildDiscoveryResult("grade8", "en", technologyAnswers);
    const english = localizeDiscoveryResult(result, "en");
    const malayalam = localizeDiscoveryResult(result, "ml");
    expect(english.signals[0].title).not.toBe(malayalam.signals[0].title);
    expect(english.traits[0].title).not.toBe(malayalam.traits[0].title);
    expect(english.areas.map((area) => area.id)).toEqual(malayalam.areas.map((area) => area.id));
    expect(english.areas[0].roles.map((role) => role.id)).toEqual(malayalam.areas[0].roles.map((role) => role.id));
    expect(malayalam.contextSummary.family).toBeTruthy();
  });
});

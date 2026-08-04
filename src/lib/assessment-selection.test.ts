import { describe, expect, it } from "vitest";

import type { Question } from "@/types/assessment";
import { normalizeAssessmentAnswers, updateMultiSelectSelection } from "./assessment-selection";

const evidenceQuestion: Question = {
    id: "evidence",
    label: "Evidence",
    fieldType: "multiSelect",
    options: [
        { id: "project", label: "Project" },
        { id: "conversation", label: "Conversation" },
        { id: "none", label: "None yet", metadata: { exclusive: true } },
    ],
};

describe("assessment multi-select rules", () => {
    it("replaces evidence selections with an exclusive none-yet option", () => {
        expect(updateMultiSelectSelection(evidenceQuestion, ["project", "conversation"], "none"))
            .toEqual(["none"]);
    });

    it("replaces an exclusive option when real evidence is selected", () => {
        expect(updateMultiSelectSelection(evidenceQuestion, ["none"], "project"))
            .toEqual(["project"]);
    });

    it("repairs contradictory drafts created before the exclusive rule", () => {
        expect(normalizeAssessmentAnswers([evidenceQuestion], {
            evidence: ["project", "none"],
        })).toEqual({ evidence: ["none"] });
    });
});

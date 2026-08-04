import {
    normalizeAssessmentAnswers as normalizeAnswers,
    updateAssessmentMultiSelect,
} from "@/modules/assessment";
import type { AssessmentAnswers, Question } from "@/types/assessment";

export function updateMultiSelectSelection(
    question: Question,
    selectedValues: string[],
    optionId: string,
): string[] {
    return updateAssessmentMultiSelect(question, selectedValues, optionId);
}

export function normalizeAssessmentAnswers(
    questions: Question[],
    answers: AssessmentAnswers,
): AssessmentAnswers {
    return normalizeAnswers(questions, answers);
}

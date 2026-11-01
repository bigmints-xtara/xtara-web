export type {
    AssessmentAnswer,
    AssessmentAnswers,
    AssessmentQuestion as Question,
    AssessmentQuestionCondition as QuestionCondition,
    AssessmentQuestionOption as QuestionOption,
    AssessmentQuestionType as QuestionType,
    AssessmentValidationRule as ValidationRule,
} from "@/modules/assessment";

export type AssessmentStage = "grade8" | "grade9" | "grade10" | "grade11" | "grade12";

export interface LocationData {
    state: string;
    district: string;
    city: string;
    locationPreference: string;
}

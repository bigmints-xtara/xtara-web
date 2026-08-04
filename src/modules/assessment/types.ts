export type AssessmentQuestionType =
  | "text"
  | "number"
  | "singleSelect"
  | "multiSelect"
  | "slider"
  | "group";

export interface AssessmentValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  minSelect?: number;
  maxSelect?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface AssessmentOptionMetadata extends Record<string, unknown> {
  exclusive?: boolean;
  scores?: Record<string, number>;
}

export interface AssessmentQuestionOption<TMetadata extends AssessmentOptionMetadata = AssessmentOptionMetadata> {
  id: string;
  label: string;
  description?: string;
  value?: unknown;
  metadata?: TMetadata;
}

export interface AssessmentQuestionCondition {
  questionId: string;
  operator: "equals" | "includes";
  value: string;
}

export interface AssessmentQuestion<TMetadata extends AssessmentOptionMetadata = AssessmentOptionMetadata> {
  id: string;
  label: string;
  description?: string;
  fieldType: AssessmentQuestionType;
  options?: AssessmentQuestionOption<TMetadata>[];
  validation?: AssessmentValidationRule;
  metadata?: Record<string, unknown>;
  showIf?: string | AssessmentQuestionCondition;
  children?: AssessmentQuestion<TMetadata>[];
  skipOnRetake?: boolean;
}

export type AssessmentAnswer = string | number | string[] | undefined;
export type AssessmentAnswers = Record<string, AssessmentAnswer>;

export interface AssessmentDefinition<
  TContext extends string,
  TMetadata extends AssessmentOptionMetadata = AssessmentOptionMetadata,
> {
  id: string;
  version: string;
  contexts: readonly TContext[];
  commonQuestions: AssessmentQuestion<TMetadata>[];
  contextualQuestions: Record<TContext, AssessmentQuestion<TMetadata>[]>;
}

export interface AssessmentResultEnvelope<TContext extends string, TResult> {
  definitionId: string;
  version: string;
  context: TContext;
  createdAt: string;
  answers: AssessmentAnswers;
  result: TResult;
}

export interface AssessmentStorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

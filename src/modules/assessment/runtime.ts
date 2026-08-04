import type {
  AssessmentAnswer,
  AssessmentAnswers,
  AssessmentDefinition,
  AssessmentOptionMetadata,
  AssessmentQuestion,
  AssessmentQuestionCondition,
} from "./types";

export function getAssessmentQuestions<
  TContext extends string,
  TMetadata extends AssessmentOptionMetadata,
>(definition: AssessmentDefinition<TContext, TMetadata>, context: TContext): AssessmentQuestion<TMetadata>[] {
  return [...definition.commonQuestions, ...definition.contextualQuestions[context]];
}

export function getVisibleAssessmentQuestions<TMetadata extends AssessmentOptionMetadata>(
  questions: AssessmentQuestion<TMetadata>[],
  answers: AssessmentAnswers,
  isRetake = false,
): AssessmentQuestion<TMetadata>[] {
  return questions.filter((question) => (
    !(isRetake && question.skipOnRetake) && isAssessmentQuestionVisible(question, answers)
  ));
}

export function isAssessmentQuestionVisible<TMetadata extends AssessmentOptionMetadata>(
  question: AssessmentQuestion<TMetadata>,
  answers: AssessmentAnswers,
): boolean {
  if (!question.showIf) return true;
  if (typeof question.showIf !== "string") return evaluateCondition(question.showIf, answers);

  return question.showIf.split(/\s*&&\s*/).every((expression) => {
    const match = expression.match(/^([A-Za-z0-9_]+)\s*==\s*['"]([^'"]+)['"]$/);
    return match ? answers[match[1]] === match[2] : false;
  });
}

export function validateAssessmentAnswer<TMetadata extends AssessmentOptionMetadata>(
  question: AssessmentQuestion<TMetadata>,
  answer: AssessmentAnswer,
): boolean {
  if (!question.validation?.required && answer === undefined) return true;
  if (answer === undefined || answer === "") return false;

  if (Array.isArray(answer)) {
    const min = question.validation?.minSelect ?? (question.validation?.required ? 1 : 0);
    const max = question.validation?.maxSelect;
    return answer.length >= min && (max === undefined || answer.length <= max);
  }

  if (typeof answer === "string") {
    const minLength = question.validation?.minLength ?? 0;
    const maxLength = question.validation?.maxLength;
    const pattern = question.validation?.pattern;
    return answer.length >= minLength
      && (maxLength === undefined || answer.length <= maxLength)
      && (!pattern || new RegExp(pattern).test(answer));
  }

  const min = question.validation?.minValue;
  const max = question.validation?.maxValue;
  return (min === undefined || answer >= min) && (max === undefined || answer <= max);
}

export function updateAssessmentMultiSelect<TMetadata extends AssessmentOptionMetadata>(
  question: AssessmentQuestion<TMetadata>,
  selectedValues: string[],
  optionId: string,
): string[] {
  const option = question.options?.find((candidate) => candidate.id === optionId);
  if (!option) return selectedValues;
  if (selectedValues.includes(optionId)) return selectedValues.filter((value) => value !== optionId);
  if (option.metadata?.exclusive === true) return [optionId];

  const exclusiveIds = new Set(
    question.options?.filter((candidate) => candidate.metadata?.exclusive === true).map((candidate) => candidate.id),
  );
  return [...selectedValues.filter((value) => !exclusiveIds.has(value)), optionId];
}

export function normalizeAssessmentAnswers<TMetadata extends AssessmentOptionMetadata>(
  questions: AssessmentQuestion<TMetadata>[],
  answers: AssessmentAnswers,
): AssessmentAnswers {
  const questionIds = new Set(questions.map((question) => question.id));
  const normalized = Object.fromEntries(
    Object.entries(answers).filter(([questionId]) => questionIds.has(questionId)),
  );

  for (const question of questions) {
    const answer = normalized[question.id];
    if (question.fieldType !== "multiSelect" || !Array.isArray(answer)) continue;
    const exclusiveId = answer.find((id) => (
      question.options?.find((candidate) => candidate.id === id)?.metadata?.exclusive === true
    ));
    if (exclusiveId) normalized[question.id] = [exclusiveId];
  }
  return normalized;
}

export function aggregateScoreChannels<TMetadata extends AssessmentOptionMetadata>(
  questions: AssessmentQuestion<TMetadata>[],
  answers: AssessmentAnswers,
): Map<string, { score: number; evidenceRefs: Array<{ questionId: string; optionId: string }> }> {
  const channels = new Map<string, { score: number; evidenceRefs: Array<{ questionId: string; optionId: string }> }>();

  for (const question of questions) {
    const answer = answers[question.id];
    const selectedIds = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    for (const optionId of selectedIds) {
      const option = question.options?.find((candidate) => candidate.id === optionId);
      for (const [channel, weight] of Object.entries(option?.metadata?.scores ?? {})) {
        if (!Number.isFinite(weight)) continue;
        const current = channels.get(channel) ?? { score: 0, evidenceRefs: [] };
        current.score += weight;
        current.evidenceRefs.push({ questionId: question.id, optionId });
        channels.set(channel, current);
      }
    }
  }
  return channels;
}

function evaluateCondition(condition: AssessmentQuestionCondition, answers: AssessmentAnswers): boolean {
  const answer = answers[condition.questionId];
  return condition.operator === "includes"
    ? Array.isArray(answer) && answer.includes(condition.value)
    : answer === condition.value;
}

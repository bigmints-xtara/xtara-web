import { xtaraApi } from '@/lib/api/client';
import type { Locale } from '@/i18n/config';
import type { DiscoveryResult } from '@/lib/assessment-v2';
import type { AssessmentAnswers, AssessmentStage } from '@/types/assessment';
import type { Question } from '@/types/assessment';

export interface ActiveAssessmentDefinition {
  id: DiscoveryResult['definitionId'];
  documentId: string;
  version: string;
  schemaVersion: number;
  locale: Locale;
  stage: AssessmentStage;
  source: 'database' | 'bundled_fallback';
  ui: Record<string, unknown>;
  questions: Question[];
}

export async function getActiveAssessmentDefinition(
  stage: AssessmentStage,
  locale: Locale,
): Promise<ActiveAssessmentDefinition> {
  return xtaraApi.get<ActiveAssessmentDefinition>(`/assessment/definition?stage=${stage}&locale=${locale}`);
}

export async function evaluateAssessmentOnServer(options: {
  definitionId: DiscoveryResult['definitionId'];
  version: string;
  stage: AssessmentStage;
  locale: Locale;
  answers: AssessmentAnswers;
}): Promise<DiscoveryResult> {
  return xtaraApi.post<DiscoveryResult>('/assessment/evaluate', options);
}

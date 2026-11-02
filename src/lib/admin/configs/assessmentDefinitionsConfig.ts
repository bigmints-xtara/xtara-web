import type { AdminConfig, AdminEntity, EntityStatus } from '@/types/admin';
export const assessmentLocales = ['en', 'ml', 'hi', 'ta'] as const;
export const assessmentGrades = ['grade8', 'grade9', 'grade10', 'grade11', 'grade12'] as const;
export type DefinitionLocale = typeof assessmentLocales[number];
export type DefinitionGrade = typeof assessmentGrades[number];
export interface DefinitionQuestion {
  id: string; fieldType: string; label: string; description?: string;
  options?: Array<{ id: string; label: string; description?: string; metadata?: Record<string, unknown> }>;
  validation?: Record<string, unknown>; showIf?: unknown;
}
export interface DefinitionTranslation {
  ui: Record<string, unknown> & { gradeQuestion: { label: string; description: string; options: Record<DefinitionGrade, string> } };
  questions: DefinitionQuestion[]; stageQuestions: Record<DefinitionGrade, DefinitionQuestion[]>;
}
export interface AssessmentDefinitionAdmin extends AdminEntity {
  definitionId: 'career-discovery'; documentId: string; recordType: 'assessment_definition'; schemaVersion: 1;
  version: string; status: 'draft' | 'inReview' | 'published' | 'retired'; published: boolean;
  defaultLocale: DefinitionLocale; contexts: DefinitionGrade[];
  translations: Record<DefinitionLocale, DefinitionTranslation>;
  compatibleCareerSchemaVersion: number; provenance: Record<string, unknown>;
}
export function emptyAssessmentDefinition(): Omit<AssessmentDefinitionAdmin, 'id'> {
  return { definitionId: 'career-discovery', documentId: 'career-discovery-v3-1-0', recordType: 'assessment_definition', schemaVersion: 1,
    version: '3.1.0', status: 'draft', published: false, defaultLocale: 'en', contexts: [...assessmentGrades], compatibleCareerSchemaVersion: 1,
    provenance: { origin: 'editorial', sourceVersion: 'admin-draft-import', sourceIds: [] },
    translations: Object.fromEntries(assessmentLocales.map((locale) => [locale, { ui: { gradeQuestion: { label: '', description: '', options: Object.fromEntries(assessmentGrades.map((grade) => [grade, ''])) } }, questions: [], stageQuestions: Object.fromEntries(assessmentGrades.map((grade) => [grade, []])) }])) as unknown as AssessmentDefinitionAdmin['translations'],
  };
}
/** Import content only. An uploaded file cannot supply review approval or publication state. */
export function importAssessmentDraft(raw: unknown): Omit<AssessmentDefinitionAdmin, 'id'> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Choose an assessment definition JSON object.');
  const data = raw as Record<string, unknown>;
  if (data.recordType !== 'assessment_definition' || data.schemaVersion !== 1 || typeof data.version !== 'string' || !data.translations || typeof data.translations !== 'object') throw new Error('The file is not an assessment definition.');
  for (const locale of assessmentLocales) {
    const translation = (data.translations as Record<string, unknown>)[locale] as DefinitionTranslation | undefined;
    if (!translation?.ui?.gradeQuestion?.options || !Array.isArray(translation.questions)
      || assessmentGrades.some((grade) => !Array.isArray(translation.stageQuestions?.[grade]))) throw new Error(`${locale} requires grade labels, common questions and all five stage-question arrays.`);
    for (const question of [...translation.questions, ...assessmentGrades.flatMap((grade) => translation.stageQuestions[grade])]) {
      if (!question || typeof question.id !== 'string' || typeof question.label !== 'string' || typeof question.fieldType !== 'string'
        || (question.options !== undefined && (!Array.isArray(question.options) || question.options.some((option) => !option || typeof option.id !== 'string' || typeof option.label !== 'string')))) throw new Error(`${locale} contains a malformed question or option.`);
    }
  }
  const base = emptyAssessmentDefinition();
  return { ...base, version: data.version, translations: data.translations as AssessmentDefinitionAdmin['translations'], provenance: data.provenance && typeof data.provenance === 'object' ? data.provenance as Record<string, unknown> : base.provenance };
}
export const assessmentDefinitionsConfig: AdminConfig<AssessmentDefinitionAdmin> = {
  entityName: 'Assessment definition', entityNamePlural: 'Assessment definitions', collectionName: 'assessment_definitions', supportsApproval: true, versionControlled: true,
  orderByField: 'updatedAt', orderByDirection: 'desc', createEmpty: emptyAssessmentDefinition,
  getId: (record) => record.id, getTitle: (record) => `Career discovery ${record.version}`,
  getSubtitle: () => 'Grades 8–12 · English, Malayalam, Hindi, Tamil', getStatus: (record): EntityStatus => record.status === 'retired' ? 'archived' : record.status,
  getDomain: () => 'career-discovery', getSearchText: (record) => `${record.documentId} ${record.version}`.toLowerCase(),
  availableStatuses: ['all', 'draft', 'inReview', 'published', 'archived'], getAvailableDomains: () => ['all', 'career-discovery'],
  validateEntity: (record) => /^\d+\.\d+\.\d+$/.test(record.version || '') ? null : 'A semantic version such as 3.1.1 is required.',
  toFirestore: (record) => { const { id: _id, ...content } = record; void _id; return content; },
  fromFirestore: (data, id) => ({ ...emptyAssessmentDefinition(), ...data, id, definitionId: 'career-discovery' }) as AssessmentDefinitionAdmin,
};

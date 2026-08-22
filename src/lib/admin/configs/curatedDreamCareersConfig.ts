import type { AdminConfig, EntityStatus } from '@/types/admin';
import type { CareerRoleTranslation, CuratedDreamCareer } from '@/types/curated-career';

export const curatedDreamCareersConfig: AdminConfig<CuratedDreamCareer> = {
  entityName: 'Dream Career',
  entityNamePlural: 'Dream Careers',
  collectionName: 'dream_careers',
  supportsApproval: true,
  orderByField: 'slug',
  orderByDirection: 'asc',
  createEmpty: () => createEmptyDreamCareer(),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.translations?.en?.title || entity.slug || 'Untitled Dream Career',
  getSubtitle: (entity) => entity.translationOperation
    ? `${translationCoverage(entity) === null ? 'coverage unavailable' : `${translationCoverage(entity)}/4 languages`} • ${entity.translationOperation.sourceReleaseId} • ${entity.translationOperation.runId}`
    : `${entity.futureDirectionIds?.length || 0} directions • ${entity.skillIds?.length || 0} skills`,
  getStatus: (entity): EntityStatus => entity.status === 'retired' ? 'archived' : entity.status,
  getDomain: (entity) => entity.primaryFutureDirectionId || 'unassigned',
  getSearchText: (entity) => [
    entity.slug,
    entity.translations?.en?.title,
    entity.translations?.ml?.title,
    entity.translations?.en?.summary,
    ...(entity.futureDirectionIds || []),
  ].filter(Boolean).join(' ').toLowerCase(),
  availableStatuses: ['all', 'draft', 'inReview', 'published', 'archived'],
  getAvailableDomains: (entities) => ['all', ...Array.from(new Set(entities.map((entity) => entity.primaryFutureDirectionId).filter(Boolean))).sort()],
  validateEntity: validateDreamCareer,
  toFirestore: (entity) => ({ ...entity }),
  fromFirestore: (data, id) => normalizeDreamCareer(data, id),
};

export function createEmptyDreamCareer(): Omit<CuratedDreamCareer, 'id'> {
  return {
    slug: '',
    recordType: 'career_role',
    schemaVersion: 1,
    version: 1,
    status: 'draft',
    published: false,
    inReview: false,
    defaultLocale: 'en',
    translations: {
      en: emptyTranslation(),
      ml: emptyTranslation(),
      hi: emptyTranslation(),
    },
    futureDirectionIds: [],
    primaryFutureDirectionId: '',
    skillIds: [],
    toolIds: [],
    sourceIds: [],
    regulated: false,
    review: {},
    provenance: { origin: 'editorial', sourceVersion: 'admin-editor', sourceIds: [], legacyDocumentIds: [] },
  };
}

function emptyTranslation(): CareerRoleTranslation {
  return {
    title: '', summary: '', dailyWork: [], workSetting: '', pathway: '',
    tradeoffs: [], specializations: [], tryThis: '',
  };
}

function normalizeDreamCareer(data: Record<string, unknown>, id: string): CuratedDreamCareer {
  const empty = createEmptyDreamCareer();
  const legacyTitle = String(data.title || data.careerName || '');
  const legacyDescription = String(data.description || data.whatYouDo || '');
  const translations = isRecord(data.translations) ? data.translations : {};
  return {
    ...empty,
    ...data,
    id,
    slug: String(data.slug || id),
    translations: {
      en: normalizeTranslation(translations.en, legacyTitle, legacyDescription),
      ml: normalizeTranslation(translations.ml),
      hi: normalizeTranslation(translations.hi),
      ...(translations.ta ? { ta: normalizeTranslation(translations.ta) } : {}),
    },
    futureDirectionIds: (data.futureDirectionIds as string[]) || (data.career_clusters as string[]) || [],
    primaryFutureDirectionId: String(data.primaryFutureDirectionId || (data.careerCluster as string) || ''),
    skillIds: (data.skillIds as string[]) || (data.required_skills as string[]) || [],
    toolIds: (data.toolIds as string[]) || [],
    sourceIds: (data.sourceIds as string[]) || [],
    regulated: data.regulation && typeof data.regulation === 'object'
      ? isRegulatedStatus((data.regulation as CuratedDreamCareer['regulation'])?.status)
      : data.regulated === true,
    salaryRange: String(data.salaryRange || data.expectedSalaryRange || data.salary || ''),
    growthOutlook: String(data.growthOutlook || data.outlook || data.sectorOutlook || ''),
    imageUrl: String(data.imageUrl || data.image || ''),
    review: data.review as CuratedDreamCareer['review'] || {},
    provenance: data.provenance as CuratedDreamCareer['provenance'] || {
      origin: 'legacy_migration', sourceVersion: 'unknown-legacy', sourceIds: [], legacyDocumentIds: [id],
    },
  } as CuratedDreamCareer;
}

function normalizeTranslation(value: unknown, fallbackTitle = '', fallbackSummary = ''): CareerRoleTranslation {
  const translation = isRecord(value) ? value : {};
  return {
    ...emptyTranslation(),
    ...translation,
    title: typeof translation.title === 'string' ? translation.title : fallbackTitle,
    summary: typeof translation.summary === 'string' ? translation.summary : fallbackSummary,
    dailyWork: stringArray(translation.dailyWork),
    tradeoffs: stringArray(translation.tradeoffs),
    specializations: stringArray(translation.specializations),
  } as CareerRoleTranslation;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export type TranslationCoverageState = 'complete' | 'partial' | 'missing' | 'unavailable';

export interface TranslationLocaleCoverage {
  state: TranslationCoverageState;
  translatedFields: number | null;
  totalFields: number | null;
}

const TRANSLATION_LOCALES = ['en', 'ml', 'hi', 'ta'] as const;
const FIELD_TOKEN_PATTERN = /^T\d{5}$/;

function unavailableTranslationCoverage(): TranslationLocaleCoverage {
  return { state: 'unavailable', translatedFields: null, totalFields: null };
}

function validatedTranslationCoverage(
  entity: CuratedDreamCareer,
): Record<(typeof TRANSLATION_LOCALES)[number], TranslationLocaleCoverage> | null {
  const coverage = entity.translationOperation?.translationCoverage;
  if (!coverage || coverage.canonicalLocale !== 'en' || coverage.releaseBlocking !== false) return null;
  if (!isRecord(coverage.locales) || Object.keys(coverage.locales).sort().join(',') !== 'en,hi,ml,ta') return null;

  let expectedTotal: number | null = null;
  let expectedTokens: string[] | null = null;
  const result = {} as Record<(typeof TRANSLATION_LOCALES)[number], TranslationLocaleCoverage>;
  for (const locale of TRANSLATION_LOCALES) {
    const receipt = coverage.locales[locale];
    if (!isRecord(receipt)) return null;
    const canonical = receipt.canonical;
    const complete = receipt.complete;
    const totalFields = receipt.totalFields;
    const translatedFieldTokens = receipt.translatedFieldTokens;
    const fieldStatus = receipt.fieldStatus;
    if (canonical !== (locale === 'en') || typeof complete !== 'boolean') return null;
    if (!Number.isInteger(totalFields) || (totalFields as number) <= 0) return null;
    if (expectedTotal === null) expectedTotal = totalFields as number;
    if (totalFields !== expectedTotal || !Array.isArray(translatedFieldTokens) || !isRecord(fieldStatus)) return null;

    const statusEntries = Object.entries(fieldStatus);
    const statusTokens = statusEntries.map(([token]) => token).sort();
    if (statusEntries.length !== totalFields || statusTokens.some((token) => !FIELD_TOKEN_PATTERN.test(token))) return null;
    if (new Set(statusTokens).size !== statusTokens.length) return null;
    if (expectedTokens === null) expectedTokens = statusTokens;
    if (statusTokens.join(',') !== expectedTokens.join(',')) return null;
    if (translatedFieldTokens.some((token) => typeof token !== 'string' || !FIELD_TOKEN_PATTERN.test(token))) return null;
    const translatedTokens = translatedFieldTokens as string[];
    if (new Set(translatedTokens).size !== translatedTokens.length) return null;
    if (translatedTokens.some((token) => !(token in fieldStatus))) return null;

    const translatedFromStatus = statusEntries
      .filter(([, status]) => status === 'translated')
      .map(([token]) => token)
      .sort();
    if (locale === 'en') {
      if (!complete || translatedTokens.length !== 0 || statusEntries.some(([, status]) => status !== 'canonical')) return null;
    } else {
      if (statusEntries.some(([, status]) => status !== 'translated' && status !== 'missing')) return null;
      if (translatedTokens.slice().sort().join(',') !== translatedFromStatus.join(',')) return null;
      if (complete !== (translatedTokens.length === totalFields)) return null;
    }

    const translatedFields = locale === 'en' ? totalFields as number : translatedTokens.length;
    result[locale] = {
      state: complete ? 'complete' : translatedFields > 0 ? 'partial' : 'missing',
      translatedFields,
      totalFields: totalFields as number,
    };
  }
  return result;
}

export function translationLocaleCoverage(
  entity: CuratedDreamCareer,
  locale: (typeof TRANSLATION_LOCALES)[number],
): TranslationLocaleCoverage {
  return validatedTranslationCoverage(entity)?.[locale] || unavailableTranslationCoverage();
}

export function translationLocaleCoverageState(entity: CuratedDreamCareer, locale: 'en' | 'ml' | 'hi' | 'ta'): TranslationCoverageState {
  return translationLocaleCoverage(entity, locale).state;
}

function translationCoverage(entity: CuratedDreamCareer): number | null {
  const states = TRANSLATION_LOCALES.map((locale) => translationLocaleCoverageState(entity, locale));
  return states.some((state) => state === 'unavailable')
    ? null
    : states.filter((state) => state === 'complete').length;
}

function validateDreamCareer(entity: Partial<CuratedDreamCareer>): string | null {
  if (!entity.slug?.trim()) return 'Stable slug is required';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.slug)) return 'Slug must use lowercase words separated by hyphens';
  if (!entity.translations?.en?.title?.trim()) return 'English title is required';
  if (!entity.translations?.en?.summary?.trim()) return 'English summary is required';
  if (!entity.futureDirectionIds?.length) return 'At least one Future Direction is required';
  if (!entity.skillIds?.length) return 'At least one skill is required';
  if (!entity.provenance?.sourceIds?.length) return 'At least one provenance source is required';
  if (entity.regulation && entity.regulated !== isRegulatedStatus(entity.regulation.status)) {
    return 'Regulated must match the selected regulation status';
  }
  return null;
}

export function isRegulatedStatus(status?: NonNullable<CuratedDreamCareer['regulation']>['status']): boolean {
  return status === 'regulated' || status === 'education-regulated';
}

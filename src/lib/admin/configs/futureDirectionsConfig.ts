import type { AdminConfig, EntityStatus } from '@/types/admin';
import type { FutureDirection } from '@/types/curated-career';

export const futureDirectionsConfig: AdminConfig<FutureDirection> = {
  entityName: 'Future Direction',
  entityNamePlural: 'Future Directions',
  collectionName: 'future_directions',
  orderByField: 'displayOrder',
  orderByDirection: 'asc',
  createEmpty: () => createEmptyFutureDirection(),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.translations?.en?.title || entity.slug || 'Untitled Future Direction',
  getSubtitle: (entity) => `${entity.roleIds?.length || 0} roles • ${entity.skillIds?.length || 0} skills`,
  getStatus: (entity): EntityStatus => entity.status === 'retired' ? 'archived' : entity.status,
  getDomain: (entity) => entity.slug || 'unassigned',
  getSearchText: (entity) => [
    entity.slug,
    entity.translations?.en?.title,
    entity.translations?.ml?.title,
    entity.translations?.en?.summary,
    ...(entity.roleIds || []),
  ].filter(Boolean).join(' ').toLowerCase(),
  availableStatuses: ['all', 'draft', 'inReview', 'published', 'archived'],
  getAvailableDomains: (entities) => ['all', ...entities.map((entity) => entity.slug).filter(Boolean).sort()],
  validateEntity: validateFutureDirection,
  toFirestore: (entity) => ({ ...entity }),
  fromFirestore: (data, id) => {
    const empty = createEmptyFutureDirection();
    return {
      ...empty,
      ...data,
      id,
      minimumEvidence: { ...empty.minimumEvidence, ...(data.minimumEvidence as Record<string, number> || {}) },
    } as FutureDirection;
  },
};

export function createEmptyFutureDirection(): Omit<FutureDirection, 'id'> {
  return {
    slug: '',
    recordType: 'future_direction',
    schemaVersion: 1,
    version: 1,
    status: 'draft',
    published: false,
    inReview: false,
    defaultLocale: 'en',
    translations: {
      en: { title: '', summary: '', reflectionPrompt: '' },
      ml: { title: '', summary: '', reflectionPrompt: '' },
      hi: { title: '', summary: '', reflectionPrompt: '' },
    },
    signalWeights: {},
    minimumEvidence: { distinctQuestions: 2, distinctSignals: 2, totalScore: 4 },
    roleIds: [],
    skillIds: [],
    toolIds: [],
    courseQueries: [],
    gradeGuidance: {
      en: { grade8: [], grade9: [], grade10: [] },
      ml: { grade8: [], grade9: [], grade10: [] },
      hi: { grade8: [], grade9: [], grade10: [] },
    },
    displayOrder: 0,
    review: {},
    provenance: { origin: 'editorial', sourceVersion: 'admin-editor', sourceIds: [], legacyDocumentIds: [] },
  };
}

function validateFutureDirection(entity: Partial<FutureDirection>): string | null {
  if (!entity.slug?.trim()) return 'Stable slug is required';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.slug)) return 'Slug must use lowercase words separated by hyphens';
  if (!entity.translations?.en?.title?.trim()) return 'English title is required';
  if (!entity.translations?.en?.summary?.trim()) return 'English summary is required';
  if (!entity.roleIds?.length) return 'At least one curated role is required';
  if (!entity.skillIds?.length) return 'At least one skill is required';
  if (!entity.provenance?.sourceIds?.length) return 'At least one provenance source is required';
  if (!entity.signalWeights || Object.keys(entity.signalWeights).length === 0) return 'At least one deterministic signal weight is required';
  if ((entity.minimumEvidence?.distinctQuestions || 0) < 2) return 'Directions must require evidence from at least two questions';
  if ((entity.minimumEvidence?.distinctSignals || 0) < 2) return 'Directions must require at least two contributing signals';
  for (const grade of ['grade8', 'grade9', 'grade10'] as const) {
    if (!entity.gradeGuidance?.en?.[grade]?.length) return `English guidance for ${grade.replace('grade', 'Grade ')} is required`;
  }
  return null;
}

import type { AdminConfig, Challenge, EntityStatus } from '@/types/admin';

function serializeDates(entity: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(entity).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  );
}

function normalizeDates<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      result[key as keyof T] = value.toDate() as T[keyof T];
    }
  }
  return result;
}

export const challengesConfig: AdminConfig<Challenge> = {
  entityName: 'Challenge',
  entityNamePlural: 'Challenges',
  collectionName: 'challenges',
  supportsApproval: true,
  createEmpty: () => ({
    title: '',
    image: '',
    domain: '',
    published: false,
    draft: true,
    inReview: false,
    type: '',
    rewardPerQuestion: 0,
    instructions: '',
    questions: [],
  }),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getStatus: (entity): EntityStatus => {
    if (entity.published) return 'published';
    if (entity.inReview) return 'inReview';
    return 'draft';
  },
  getDomain: (entity) => entity.domain,
  getSubtitle: (entity) => entity.type,
  getSearchText: (entity) => `${entity.title} ${entity.instructions}`.toLowerCase(),
  availableStatuses: ['all', 'published', 'draft', 'inReview'],
  getAvailableDomains: (entities) => ['all', ...Array.from(new Set(entities.map((entity) => entity.domain).filter(Boolean)))],
  validateEntity: (entity) => {
    if (!entity.title || entity.title.trim() === '') return 'Title is required';
    if (entity.rewardPerQuestion !== undefined && entity.rewardPerQuestion < 0) return 'Reward per question must be 0 or greater';
    return null;
  },
  toFirestore: (entity) => {
    const data = { ...entity } as Record<string, unknown>;
    delete data.id;
    return { ...serializeDates(data), updatedAt: new Date().toISOString() };
  },
  fromFirestore: (data, id) => ({ ...normalizeDates(data as Record<string, unknown>), id } as unknown as Challenge),
};

export default challengesConfig;

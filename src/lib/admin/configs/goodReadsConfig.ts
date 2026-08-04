import type { AdminConfig, EntityStatus, GoodRead } from '@/types/admin';

function serializeDates(entity: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(entity).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  );
}

function normalizeDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
}

export const goodReadsConfig: AdminConfig<GoodRead> = {
  entityName: 'Good Read',
  entityNamePlural: 'Good Reads',
  collectionName: 'good_reads',
  createEmpty: () => ({
    title: '',
    image: '',
    domain: '',
    published: false,
    draft: true,
    inReview: false,
    type: '',
    content: '',
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
  getSearchText: (entity) => `${entity.title} ${entity.content}`.toLowerCase(),
  availableStatuses: ['all', 'published', 'draft', 'inReview'],
  getAvailableDomains: (entities) => ['all', ...Array.from(new Set(entities.map((entity) => entity.domain).filter(Boolean)))],
  validateEntity: (entity) => (!entity.title || entity.title.trim() === '' ? 'Title is required' : null),
  toFirestore: (entity) => {
    const data = { ...entity } as Record<string, unknown>;
    delete data.id;
    return { ...serializeDates(data), updatedAt: new Date().toISOString() };
  },
  fromFirestore: (data, id) =>
    ({
      ...data,
      id,
      publishedAt: normalizeDate((data as Record<string, unknown>).publishedAt),
      publishedUntil: normalizeDate((data as Record<string, unknown>).publishedUntil),
      createdAt: normalizeDate((data as Record<string, unknown>).createdAt),
      updatedAt: normalizeDate((data as Record<string, unknown>).updatedAt),
    } as unknown as GoodRead),
};

export default goodReadsConfig;

import { AdminConfig, Spark } from '@/types/admin';

export const sparksConfig: AdminConfig<Spark> = {
  entityName: 'Spark',
  entityNamePlural: 'Sparks',
  collectionName: 'sparks',
  supportsApproval: true,

  createEmpty: () => ({
    title: '',
    type: '',
    published: false,
    draft: true,
    inReview: false,
  }),

  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => entity.type || '',

  getStatus: (entity) => {
    if (entity.published) return 'published';
    if (entity.inReview) return 'inReview';
    return 'draft';
  },

  getDomain: (entity) => entity.type || 'General',

  getSearchText: (entity) => `${entity.title} ${entity.type}`.toLowerCase(),

  availableStatuses: ['all', 'published', 'draft', 'inReview'],

  getAvailableDomains: (entities) => {
    const domains = new Set<string>();
    entities.forEach(entity => {
      if (entity.type) domains.add(entity.type);
    });
    return ['all', ...Array.from(domains)];
  },

  toFirestore: (entity) => {
    const data = { ...entity };
    delete data.id;
    return {
      ...data,
      updatedAt: new Date(),
    };
  },

  fromFirestore: (data, id) => ({
    ...(data as unknown as Spark),
    id,
  }),
};

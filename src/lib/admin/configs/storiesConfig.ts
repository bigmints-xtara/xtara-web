import { AdminConfig, Story, EntityStatus } from '@/types/admin';

export const storiesConfig: AdminConfig<Story> = {
  entityName: 'Story',
  entityNamePlural: 'Stories',
  collectionName: 'stories',
  supportsApproval: true,

  createEmpty: () => ({
    title: '',
    description: '',
    image: '',
    career_clusters: [],
    published: false,
    draft: true,
    inReview: false,
    featured: false,
    ad: false,
    byXtara: true,
    careerRelevance: [],
    slides: [],
  }),

  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => entity.description || '',
  
  getStatus: (entity) => {
    if (entity.published) return 'published';
    if (entity.inReview) return 'inReview';
    return 'draft';
  },
  
  getDomain: (entity) => {
    if (entity.career_clusters && entity.career_clusters.length > 0) {
      return entity.career_clusters[0];
    }
    return 'General';
  },

  getSearchText: (entity) => `${entity.title} ${entity.description || ''}`.toLowerCase(),

  availableStatuses: ['all', 'published', 'draft', 'inReview'],

  getAvailableDomains: (entities) => {
    const domains = new Set<string>();
    entities.forEach(entity => {
      entity.career_clusters?.forEach(cluster => domains.add(cluster));
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
    ...(data as unknown as Story),
    id,
  }),
};

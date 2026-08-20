import type { AdminConfig, GameTemplate } from '@/types/admin';

export const gameTemplatesConfig: AdminConfig<GameTemplate> = {
  entityName: 'Game Template',
  entityNamePlural: 'Game Templates',
  collectionName: 'game_templates',
  supportsApproval: true,
  createEmpty: () => ({
    title: '',
    description: '',
    mode: 'quiz',
    config: {},
    published: false,
    draft: true,
    inReview: false,
    futureDirectionIds: [],
    dreamCareerIds: [],
    skillIds: [],
    gradeStages: [],
    topics: [],
  }),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => entity.description || entity.mode,
  getStatus: (entity) => entity.published ? 'published' : entity.inReview ? 'inReview' : 'draft',
  getDomain: (entity) => entity.mode,
  getSearchText: (entity) => `${entity.title} ${entity.description} ${entity.mode}`.toLowerCase(),
  availableStatuses: ['all', 'published', 'draft', 'inReview'],
  getAvailableDomains: () => ['all', 'quiz', 'wordquest', 'puzzle', 'memory', 'simulation'],
  validateEntity: (entity) => {
    if (!entity.title?.trim()) return 'Title is required';
    if (!entity.description?.trim()) return 'Description is required';
    return null;
  },
  toFirestore: (entity) => {
    const data = { ...entity } as Record<string, unknown>;
    delete data.id;
    return { ...data, updatedAt: new Date().toISOString() };
  },
  fromFirestore: (data, id) => ({ ...data, id } as unknown as GameTemplate),
};

export default gameTemplatesConfig;

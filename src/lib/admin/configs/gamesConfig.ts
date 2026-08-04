import type { AdminConfig, GameInstance } from '@/types/admin';

function normalizeDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
}

export const gamesConfig: AdminConfig<GameInstance> = {
  entityName: 'Game',
  entityNamePlural: 'Games',
  collectionName: 'game_instances',
  createEmpty: () => ({
    title: '',
    mode: 'quiz',
    isPublished: false,
    schedule: {
      startDateTime: new Date(),
      endDateTime: new Date(Date.now() + 86400000 * 7),
    },
  }),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => entity.mode,
  getStatus: (entity) => (entity.isPublished ? 'published' : 'draft'),
  getDomain: (entity) => entity.mode,
  getSearchText: (entity) => `${entity.title} ${entity.mode}`.toLowerCase(),
  availableStatuses: ['all', 'published', 'draft'],
  getAvailableDomains: () => ['all', 'quiz', 'puzzle', 'memory'],
  validateEntity: (entity) => (!entity.title || entity.title.trim() === '' ? 'Title is required' : null),
  toFirestore: (entity) => {
    const data = { ...entity } as Record<string, unknown>;
    delete data.id;
    return { ...data, updatedAt: new Date().toISOString() };
  },
  fromFirestore: (data, id) => {
    const instance = { ...data, id } as GameInstance;
    if (instance.schedule) {
      instance.schedule.startDateTime = normalizeDate(instance.schedule.startDateTime) as Date;
      instance.schedule.endDateTime = normalizeDate(instance.schedule.endDateTime) as Date;
    }
    instance.createdAt = normalizeDate(instance.createdAt) as Date;
    instance.updatedAt = normalizeDate(instance.updatedAt) as Date;
    return instance;
  },
};

export default gamesConfig;

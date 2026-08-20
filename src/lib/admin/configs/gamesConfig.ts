import type { AdminConfig, GameInstance } from '@/types/admin';

function normalizeDate(value: unknown): Date | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function validDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const INDIA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function isIndiaMidnight(value: Date): boolean {
  const shifted = value.getTime() + INDIA_OFFSET_MS;
  return ((shifted % DAY_MS) + DAY_MS) % DAY_MS === 0;
}

function startOfIndiaDay(referenceDate: Date): Date {
  const india = new Date(referenceDate.getTime() + INDIA_OFFSET_MS);
  return new Date(Date.UTC(
    india.getUTCFullYear(),
    india.getUTCMonth(),
    india.getUTCDate(),
  ) - INDIA_OFFSET_MS);
}

function isDailyGame(entity: Partial<GameInstance>): boolean {
  if (entity.mode === 'wordquest') return true;
  if (entity.templateId?.toLowerCase().includes('daily')) return true;
  return entity.schedule?.cadence?.toLowerCase() === 'daily';
}

export function getGamePublicationIssues(entity: Partial<GameInstance>): string[] {
  const issues: string[] = [];
  const start = validDate(entity.schedule?.startDateTime);
  const end = validDate(entity.schedule?.endDateTime);
  const supportedMode = entity.mode === 'quiz' || entity.mode === 'wordquest';

  if (!supportedMode) issues.push('Only Quiz and WordQuest can be published.');

  if (!start) issues.push('Start date and time are required.');
  if (!end) issues.push('End date and time are required.');
  if (start && end && end.getTime() <= start.getTime()) {
    issues.push('End date and time must be after the start.');
  } else if (supportedMode && isDailyGame(entity) && start && end) {
    const duration = end.getTime() - start.getTime();
    if (duration !== DAY_MS || !isIndiaMidnight(start) || !isIndiaMidnight(end)) {
      issues.push('Daily games must run from midnight to midnight in Asia/Kolkata.');
    }
  }

  const embeddedQuestions = Array.isArray(entity.embeddedQuestions) ? entity.embeddedQuestions : [];
  const legacyQuestions = Array.isArray(entity.questions) ? entity.questions : [];
  const questions = embeddedQuestions.length > 0 ? embeddedQuestions : legacyQuestions;
  if (entity.mode === 'wordquest') {
    const targetWord = entity.content?.targetWord;
    if (typeof targetWord !== 'string' || !/^[a-z]{5}$/i.test(targetWord.trim())) {
      issues.push('WordQuest needs a five-letter target word.');
    }
  } else if (entity.mode === 'quiz') {
    if (questions.length === 0) {
      issues.push('Quiz needs at least one question.');
    }
  }

  return issues;
}

export const gamesConfig: AdminConfig<GameInstance> = {
  entityName: 'Game',
  entityNamePlural: 'Games',
  collectionName: 'game_instances',
  supportsApproval: true,
  createEmpty: () => {
    const startDateTime = startOfIndiaDay(new Date());
    return {
      title: '',
      mode: 'quiz',
      isPublished: false,
      published: false,
      draft: true,
      inReview: false,
      futureDirectionIds: [],
      dreamCareerIds: [],
      skillIds: [],
      gradeStages: [],
      topics: [],
      schedule: {
        startDateTime,
        endDateTime: new Date(startDateTime.getTime() + DAY_MS),
      },
    };
  },
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => entity.mode,
  getStatus: (entity) => (entity.isPublished ? 'published' : entity.inReview ? 'inReview' : 'draft'),
  getDomain: (entity) => entity.mode,
  getSearchText: (entity) => `${entity.title} ${entity.mode}`.toLowerCase(),
  availableStatuses: ['all', 'published', 'draft', 'inReview'],
  getAvailableDomains: () => ['all', 'quiz', 'wordquest', 'puzzle', 'memory', 'simulation'],
  validateEntity: (entity) => {
    if (!entity.title || entity.title.trim() === '') return 'Title is required';
    if (entity.isPublished) return getGamePublicationIssues(entity)[0] || null;
    return null;
  },
  toFirestore: (entity) => {
    const data = { ...entity } as Record<string, unknown>;
    delete data.id;
    return { ...data, updatedAt: new Date().toISOString() };
  },
  fromFirestore: (data, id) => {
    const instance = { ...data, id } as GameInstance;
    if (instance.schedule) {
      instance.schedule.startDateTime = normalizeDate(instance.schedule.startDateTime) as Date | undefined;
      instance.schedule.endDateTime = normalizeDate(instance.schedule.endDateTime) as Date | undefined;
    }
    instance.publishedAt = normalizeDate(instance.publishedAt);
    instance.createdAt = normalizeDate(instance.createdAt);
    instance.updatedAt = normalizeDate(instance.updatedAt);
    return instance;
  },
};

export default gamesConfig;

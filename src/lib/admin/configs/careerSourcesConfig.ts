import type { AdminConfig, EntityStatus } from '@/types/admin';
import type { CuratedCareerSource } from '@/types/curated-career';

export const careerSourcesConfig: AdminConfig<CuratedCareerSource> = {
  entityName: 'Career Source',
  entityNamePlural: 'Career Sources',
  collectionName: 'career_sources',
  orderByField: 'label',
  orderByDirection: 'asc',
  createEmpty: () => createEmptyCareerSource(),
  getId: (entity) => entity.id,
  getTitle: (entity) => entity.label || entity.slug || 'Untitled source',
  getSubtitle: (entity) => entity.lastVerifiedAt ? `Verified ${entity.lastVerifiedAt}` : 'Not yet verified',
  getStatus: (entity): EntityStatus => entity.status === 'retired' ? 'archived' : entity.status,
  getDomain: (entity) => entity.organization || 'unassigned',
  getSearchText: (entity) => [entity.slug, entity.label, entity.organization, entity.url].filter(Boolean).join(' ').toLowerCase(),
  availableStatuses: ['all', 'draft', 'inReview', 'published', 'archived'],
  getAvailableDomains: (entities) => ['all', ...Array.from(new Set(entities.map((entity) => entity.organization).filter(Boolean))).sort()],
  validateEntity: validateCareerSource,
  toFirestore: (entity) => ({ ...entity }),
  fromFirestore: (data, id) => normalizeCareerSource(data, id),
};

export function createEmptyCareerSource(): Omit<CuratedCareerSource, 'id'> {
  return {
    slug: '',
    recordType: 'career_source',
    schemaVersion: 1,
    version: 1,
    status: 'draft',
    published: false,
    inReview: false,
    label: '',
    organization: '',
    url: '',
    review: {},
  };
}

function normalizeCareerSource(data: Record<string, unknown>, id: string): CuratedCareerSource {
  const empty = createEmptyCareerSource();
  return {
    ...empty,
    ...data,
    id,
    slug: String(data.slug || id),
    label: String(data.label || ''),
    organization: String(data.organization || ''),
    url: String(data.url || ''),
    lastVerifiedAt: data.lastVerifiedAt ? String(data.lastVerifiedAt) : undefined,
    review: data.review as CuratedCareerSource['review'] || {},
  } as CuratedCareerSource;
}

function validateCareerSource(entity: Partial<CuratedCareerSource>): string | null {
  if (!entity.slug?.trim()) return 'Stable source ID is required';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.slug)) return 'Source ID must use lowercase words separated by hyphens';
  if (!entity.label?.trim()) return 'Source label is required';
  if (!entity.organization?.trim()) return 'Source organization is required';
  try {
    const url = new URL(entity.url || '');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'Use an absolute HTTP or HTTPS source URL';
  } catch {
    return 'Use an absolute HTTP or HTTPS source URL';
  }
  if (entity.status === 'published') {
    if (!entity.lastVerifiedAt) return 'Published sources require a verification date';
    if (!entity.review?.reviewedBy || !entity.review.reviewedAt) return 'Published sources require a named human review';
  }
  return null;
}

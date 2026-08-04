import { xtaraApi } from '@/lib/api/client';
import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import { createEmptyFutureDirection } from '@/lib/admin/configs/futureDirectionsConfig';
import type { CuratedDreamCareer, FutureDirection } from '@/types/curated-career';

type ListResponse<T> = { items?: T[] } | T[];

function itemsFrom<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items || [];
}

export async function getPublishedFutureDirections(): Promise<FutureDirection[]> {
  const response = await xtaraApi.get<ListResponse<Record<string, unknown>>>('/future-directions?limit=100');
  return itemsFrom(response).map((data) => {
    const empty = createEmptyFutureDirection();
    return {
      ...empty,
      ...data,
      id: String(data.id),
      slug: String(data.id),
      minimumEvidence: { ...empty.minimumEvidence, ...(data.minimumEvidence as Record<string, number> || {}) },
    } as FutureDirection;
  }).filter((direction) => direction.status === 'published' || direction.published);
}

export async function getPublishedDreamCareers(): Promise<CuratedDreamCareer[]> {
  const response = await xtaraApi.get<ListResponse<Record<string, unknown>>>('/dream-careers?limit=100');
  return itemsFrom(response).map(normalizeDreamCareer);
}

export async function getPublishedDreamCareer(id: string): Promise<CuratedDreamCareer> {
  const response = await xtaraApi.get<Record<string, unknown>>(
    `/dream-careers/${encodeURIComponent(id)}`,
  );
  return normalizeDreamCareer(response);
}

export async function getPublishedCareerCatalog(): Promise<{
  directions: FutureDirection[];
  roles: CuratedDreamCareer[];
}> {
  const [directions, roles] = await Promise.all([
    getPublishedFutureDirections(),
    getPublishedDreamCareers(),
  ]);
  return { directions, roles };
}

function normalizeDreamCareer(data: Record<string, unknown>): CuratedDreamCareer {
  const empty = createEmptyDreamCareer();
  const id = String(data.id);
  if (data.recordType === 'career_role' && data.translations) {
    return { ...empty, ...data, id, slug: id } as CuratedDreamCareer;
  }
  return {
    ...empty,
    id,
    slug: id,
    status: data.published === true ? 'published' : 'draft',
    published: data.published === true,
    translations: {
      en: {
        ...empty.translations.en,
        title: String(data.title || data.careerName || id),
        summary: String(data.description || data.whatYouDo || ''),
      },
      ml: empty.translations.ml,
    },
    futureDirectionIds: Array.isArray(data.career_clusters) ? data.career_clusters.map(String) : [],
    primaryFutureDirectionId: String(data.careerCluster || ''),
    skillIds: Array.isArray(data.required_skills) ? data.required_skills.map(String) : [],
    sourceIds: Array.isArray(data.sourceIds) ? data.sourceIds.map(String) : [],
    salaryRange: String(data.salaryRange || data.expectedSalaryRange || data.salary || ''),
    growthOutlook: String(data.growthOutlook || data.outlook || data.sectorOutlook || ''),
    imageUrl: String(data.imageUrl || data.image || ''),
    provenance: {
      origin: 'legacy_migration', sourceVersion: 'legacy-unversioned',
      sourceIds: Array.isArray(data.sourceIds) ? data.sourceIds.map(String) : [], legacyDocumentIds: [id],
    },
  } as CuratedDreamCareer;
}

import { xtaraApiOperationPath } from '@/lib/api/generated/xtara-api-operations';
import { xtaraApi } from '@/lib/api/client';
import type { CareerOverview } from '@/types/career-overview';
import { getDirectionOverview } from './direction-api';

export async function getCareerOverview(id: string, signal?: AbortSignal): Promise<CareerOverview> {
  const data = await xtaraApi.get<CareerOverview>(`${xtaraApiOperationPath('getDreamCareersCareerIdOverview', { careerId: id })}?locale=en`, { signal });
  if (data.schemaVersion !== 1 || data.id !== id || data.locale !== 'en' ||
      !Array.isArray(data.jobRoles) || !Array.isArray(data.whatYouDo?.activities) ||
      !Array.isArray(data.skills) || !Array.isArray(data.workplaces) || !Array.isArray(data.sources) ||
      !['grades8To10', 'afterGrade10', 'afterGrade12'].every(key => Array.isArray(data.studyPaths?.[key as keyof CareerOverview['studyPaths']]))) {
    throw new Error('The career overview did not match the requested career and schema.');
  }
  return data;
}

export async function getExplorerAccountContext(uid: string) {
  const [assessment, direction] = await Promise.all([
    xtaraApi.get<{ assessment: { id: string } | null }>('/assessment/latest', { expectedUserId: uid }),
    getDirectionOverview('en', uid),
  ]);
  if (!assessment || !Object.hasOwn(assessment, 'assessment') || (assessment.assessment !== null && typeof assessment.assessment?.id !== 'string') || !direction || !Object.hasOwn(direction, 'direction')) {
    throw new Error('Account context was incomplete.');
  }
  return { assessed: assessment.assessment !== null, direction };
}

import { xtaraApi } from '@/lib/api/client';
import { invalidateDashboardCache } from './dashboard-cache';
import type { DirectionPlan } from '@/lib/direction';
import { getFirebaseAuth } from '@/lib/firebase-client';
export type CareerPursuit = { careerId: string; dreamCareerId: string; directionId: string; specializationId?: string; savedAt: string };
export type CareerPursuitResponse = { pursuit: CareerPursuit | null; direction: DirectionPlan | null };
export async function pursueCareer(careerId: string, directionId: string, expectedUserId: string): Promise<CareerPursuitResponse> {
  invalidateDashboardCache();
  await xtaraApi.put<CareerPursuitResponse>('/me/career-pursuit', { careerId, directionId }, { expectedUserId });
  const result = await xtaraApi.get<CareerPursuitResponse>('/me/career-pursuit', { expectedUserId });
  if (getFirebaseAuth().currentUser?.uid !== expectedUserId) {
    throw new Error('The signed-in account changed while saving this career.');
  }
  if (!result.pursuit || result.pursuit.careerId !== careerId || result.pursuit.directionId !== directionId || !result.direction?.savedDirections[directionId]?.dreamCareerIds.includes(result.pursuit.dreamCareerId)) {
    throw new Error('Your career choice could not be verified. Please try again.');
  }
  invalidateDashboardCache();
  return result;
}

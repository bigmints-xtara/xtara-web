import { xtaraApi } from '@/lib/api/client';
import type { CareerPath } from '@/types/career';

type ListResponse<T> = { items?: T[] } | T[];

function itemsFrom<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items || [];
}

export const getUserCareerPaths = async (_userId: string): Promise<CareerPath[]> => {
  const response = await xtaraApi.get<ListResponse<CareerPath>>('/career-paths/me');
  return itemsFrom(response);
};

export const getCareerPathById = async (pathId: string): Promise<CareerPath | null> => {
  return xtaraApi.get<CareerPath>(`/career-paths/${pathId}`).catch(() => null);
};

export const getCareerTools = async (careerCluster?: string): Promise<any[]> => {
  const query = careerCluster ? `?careerCluster=${encodeURIComponent(careerCluster)}` : '';
  const response = await xtaraApi.get<ListResponse<any>>(`/career-tools${query}`);
  return itemsFrom(response);
};

export default getUserCareerPaths;

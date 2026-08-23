import { useApiQuery } from './useApiQuery';
import { getCareerPathById, getCareerTools } from '@/lib/firebase/career-helpers';
import { CareerPath } from '@/types/career';

export function useCareerPathQuery(pathId: string | undefined) {
  return useApiQuery<CareerPath | null>(
    ['career-path', pathId || ''],
    async () => {
      if (!pathId) return null;
      return getCareerPathById(pathId);
    },
    { 
      staleTime: 300000,
      enabled: !!pathId 
    }
  );
}

export function useCareerToolsQuery(careerCluster?: string) {
  return useApiQuery<any[]>(
    ['career-tools', careerCluster || 'all'],
    async () => {
      return getCareerTools(careerCluster);
    },
    { 
      staleTime: 300000,
      // We might want it always enabled if we want all tools when no cluster is provided
    }
  );
}

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export function useApiQuery<T>(
  key: string | unknown[],
  queryFactory: () => Promise<T>,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: queryFactory,
    staleTime: options?.staleTime ?? 300000,
    gcTime: options?.gcTime ?? 1800000,
    retry: options?.retry ?? 1,
    ...options,
  });
}

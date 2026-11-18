'use client';

import { useQuery } from '@tanstack/react-query';
import { getCareerExplorer } from '@/lib/career-explorer-api';
import type { Locale } from '@/i18n/config';

export function useCareerExplorer(locale: Locale) {
  return useQuery({
    queryKey: ['career-explorer', locale],
    queryFn: ({ signal }) => getCareerExplorer(locale, signal),
    meta: { authScope: 'public' },
    staleTime: 60_000,
    retry: false,
  });
}

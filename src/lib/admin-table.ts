export type AdminTableQuery = {
  page: number;
  pageSize: 10 | 20 | 25 | 50 | 100;
  search: string;
  filters: Record<string, string[]>;
  sort: { field: string; direction: 'asc' | 'desc' };
  groupBy?: string;
};

export type AdminTableFacet = {
  field: string;
  values: Array<{ value: string; label: string; count: number }>;
};

export type AdminTableResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  facets: AdminTableFacet[];
  groups: Array<{ value: string; label: string; count: number }>;
  summaries: Array<{ key: string; label: string; value: number }>;
};

export type AdminTableSelection =
  | { mode: 'ids'; ids: string[] }
  | { mode: 'query'; query: AdminTableQuery; excludedIds: string[]; expectedCount: number };

export type AdminBulkResult = {
  action: string;
  matched: number;
  succeeded: Array<{ id: string; title: string; status?: string }>;
  failed: Array<{ id: string; title?: string; code: string; message: string }>;
};

export function adminTableQueryParams(query: AdminTableQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page), pageSize: String(query.pageSize), search: query.search,
    sort: query.sort.field, direction: query.sort.direction,
  });
  if (query.groupBy) params.set('groupBy', query.groupBy);
  for (const [field, values] of Object.entries(query.filters)) {
    for (const value of values) params.append(`filter.${field}`, value);
  }
  return params;
}

export function parseAdminTableQueryParams(params: URLSearchParams, defaults: AdminTableQuery): AdminTableQuery {
  const page = Number(params.get('page'));
  const requestedSize = Number(params.get('pageSize'));
  const pageSize = ([10, 20, 25, 50, 100] as const).find((size) => size === requestedSize) || defaults.pageSize;
  const filters: Record<string, string[]> = {};
  for (const key of Array.from(new Set(params.keys()))) if (key.startsWith('filter.')) filters[key.slice(7)] = params.getAll(key);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : defaults.page,
    pageSize,
    search: params.get('search') || defaults.search,
    filters,
    sort: {
      field: params.get('sort') || defaults.sort.field,
      direction: params.get('direction') === 'asc' || params.get('direction') === 'desc' ? params.get('direction') as 'asc' | 'desc' : defaults.sort.direction,
    },
    ...(params.get('groupBy') ? { groupBy: params.get('groupBy') || undefined } : {}),
  };
}

export function useAdminTableQuery(defaults: AdminTableQuery) {
  const [query, setQuery] = useState<AdminTableQuery>(() => typeof window === 'undefined' ? defaults : parseAdminTableQueryParams(new URLSearchParams(window.location.search), defaults));
  useEffect(() => {
    const params = adminTableQueryParams(query);
    const url = `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
  }, [query]);
  return [query, setQuery] as const;
}
import { useEffect, useState } from 'react';

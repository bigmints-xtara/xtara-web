import { xtaraApi } from '@/lib/api/client';
import type { CollegeInfo } from '@/lib/firebase/college-service';

export type AdminCollegeSummary = {
  id: string;
  providerId?: string;
  name: string;
  aliases: string[];
  type?: string;
  city?: string;
  state?: string;
  country: string;
  website?: string;
  affiliatedTo?: string;
};

export type AdminCollegeCatalogPage = {
  release: {
    id: string;
    status: string;
    active: boolean;
    productionReady: boolean;
    importedAt?: string | null;
    activatedAt?: string | null;
  };
  counts: {
    institutions: number;
    courseConcepts: number;
    courseOfferings: number;
    careerCourseLinks: number;
  };
  items: AdminCollegeSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: { query: string; city: string; state: string; type: string };
  immutable: boolean;
};

export type AdminCollegeCatalogFilters = {
  page?: number;
  limit?: number;
  query?: string;
  city?: string;
  state?: string;
  type?: string;
};

export async function getAdminCollegeCatalog(filters: AdminCollegeCatalogFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 25),
  });
  if (filters.query?.trim()) params.set('query', filters.query.trim());
  if (filters.city?.trim()) params.set('city', filters.city.trim());
  if (filters.state?.trim()) params.set('state', filters.state.trim());
  if (filters.type?.trim()) params.set('type', filters.type.trim());
  return xtaraApi.get<AdminCollegeCatalogPage>(`/admin/catalog/colleges?${params.toString()}`);
}

export async function getAdminCollegeDetail(id: string) {
  return xtaraApi.get<CollegeInfo>(`/colleges/${encodeURIComponent(id)}`);
}

import { apiDownload, xtaraApi } from '@/lib/api/client';
import type { CollegeInfo } from '@/lib/firebase/college-service';
import { adminTableQueryParams, type AdminTableQuery, type AdminTableResult } from '@/lib/admin-table';

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

export type AdminCollegeCatalogPage = AdminTableResult<AdminCollegeSummary> & {
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
  immutable: boolean;
};
export async function getAdminCollegeCatalog(query: AdminTableQuery) { return xtaraApi.get<AdminCollegeCatalogPage>(`/admin/catalog/colleges?${adminTableQueryParams(query).toString()}`); }
export function adminCollegeExportUrl(query: AdminTableQuery, ids: string[] = []) { const params = adminTableQueryParams(query); ids.forEach((id) => params.append('id', id)); return `/api/v1/admin/catalog/colleges/export?${params.toString()}`; }
export async function downloadAdminCollegeCsv(query: AdminTableQuery, ids: string[] = []) { const blob = await apiDownload(adminCollegeExportUrl(query, ids)); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'xtara-colleges.csv'; link.click(); URL.revokeObjectURL(url); }

export async function getAdminCollegeDetail(id: string) {
  return xtaraApi.get<CollegeInfo>(`/colleges/${encodeURIComponent(id)}`);
}

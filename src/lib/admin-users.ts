import { xtaraApi } from '@/lib/api/client';
import type { AdminRole } from '@/lib/admin-access';
import { adminTableQueryParams, type AdminBulkResult, type AdminTableQuery, type AdminTableResult, type AdminTableSelection } from '@/lib/admin-table';

export type AdminUserProfileSummary = {
  fullName?: string;
  city?: string;
  state?: string;
  country?: string;
  currentGrade?: string;
  educationBoard?: string;
  currentStream?: string;
  gradeStage?: string;
};

export type AdminUser = {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  disabled: boolean;
  providers: string[];
  role: AdminRole | null;
  roleLabel: string;
  createdAt?: string;
  lastSignInAt?: string;
  profileUpdatedAt?: string;
  isCurrentUser: boolean;
  profile: AdminUserProfileSummary;
};

export type AdminUsersPage = AdminTableResult<AdminUser>;

export const adminUsersApi = {
  list: (input: AdminTableQuery) => xtaraApi.get<AdminUsersPage>(`/admin/users?${adminTableQueryParams(input).toString()}`),
  bulk: (action: string, selection: AdminTableSelection) => xtaraApi.post<AdminBulkResult>('/admin/users/bulk', { action, selection }),
  get: (uid: string) => xtaraApi.get<{ user: AdminUser }>(`/admin/users/${encodeURIComponent(uid)}`),
  update: (uid: string, input: { displayName: string; disabled: boolean; adminRole: AdminRole | null }) =>
    xtaraApi.patch<{ user: AdminUser }>(`/admin/users/${encodeURIComponent(uid)}`, input),
  revokeSessions: (uid: string) =>
    xtaraApi.post<{ uid: string; revoked: true }>(`/admin/users/${encodeURIComponent(uid)}/revoke-sessions`),
};

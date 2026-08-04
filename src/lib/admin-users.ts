import { xtaraApi } from '@/lib/api/client';
import type { AdminRole } from '@/lib/admin-access';

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

export type AdminUsersPage = {
  users: AdminUser[];
  pageSize: number;
  nextPageToken?: string;
  query?: string;
};

export const adminUsersApi = {
  list: (input: { pageSize: number; pageToken?: string; query?: string }) => {
    const params = new URLSearchParams({ pageSize: String(input.pageSize) });
    if (input.pageToken) params.set('pageToken', input.pageToken);
    if (input.query) params.set('query', input.query);
    return xtaraApi.get<AdminUsersPage>(`/admin/users?${params.toString()}`);
  },
  get: (uid: string) => xtaraApi.get<{ user: AdminUser }>(`/admin/users/${encodeURIComponent(uid)}`),
  update: (uid: string, input: { displayName: string; disabled: boolean; adminRole: AdminRole | null }) =>
    xtaraApi.patch<{ user: AdminUser }>(`/admin/users/${encodeURIComponent(uid)}`, input),
  revokeSessions: (uid: string) =>
    xtaraApi.post<{ uid: string; revoked: true }>(`/admin/users/${encodeURIComponent(uid)}/revoke-sessions`),
};

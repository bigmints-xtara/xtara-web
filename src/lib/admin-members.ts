import { xtaraApi } from '@/lib/api/client';

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export type AdminMember = {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: AdminRole;
  roleLabel: string;
  permissions: string[];
  createdAt?: string;
  lastSignInAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  isCurrentUser: boolean;
};

export type AdminMembersResponse = {
  members: AdminMember[];
  currentRole: AdminRole;
  permissions: string[];
};

export const adminMembersApi = {
  list: () => xtaraApi.get<AdminMembersResponse>('/admin/members'),
  add: (input: { email: string; role: AdminRole }) =>
    xtaraApi.post<{ member: AdminMember }>('/admin/members', input),
  update: (member: Pick<AdminMember, 'uid' | 'email'>, role: AdminRole) =>
    xtaraApi.patch<{ member: AdminMember }>(`/admin/members/${encodeURIComponent(member.uid)}`, {
      email: member.email,
      role,
    }),
  remove: (uid: string) =>
    xtaraApi.delete<{ uid: string; removed: true }>(`/admin/members/${encodeURIComponent(uid)}`),
};

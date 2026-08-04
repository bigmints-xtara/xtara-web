import type { UserProfile } from '@/lib/firebase/auth-helpers';

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export function resolveAdminRole(profile: UserProfile | null | undefined): AdminRole | null {
  if (!profile) return null;
  if (profile.adminRole === 'super_admin' || profile.adminRole === 'admin' || profile.adminRole === 'editor') {
    return profile.adminRole;
  }
  if (profile.isSuperAdmin || profile.roles?.isSuperAdmin) return 'super_admin';
  if (profile.roles?.isAdmin || profile.isAdmin === true) return 'admin';
  if (profile.roles?.isEditor || profile.isEditor === true) return 'editor';
  return null;
}

export function canManageSystem(role: AdminRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageUsers(role: AdminRole | null): boolean {
  return role === 'super_admin';
}

export function canPublishContent(role: AdminRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canDeleteContent(role: AdminRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

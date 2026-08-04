import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOrganizationContext } from '@/lib/organization';

export type TenantType = 'individual' | 'institution';
export type TenantCategory = 'student' | 'parent' | 'career_coach' | 'mentor' | 'school' | 'college' | 'university';

export interface Tenant {
  id: string;
  type: TenantType;
  category: TenantCategory;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  profile?: {
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function useTenant() {
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return () => { cancelled = true; };
    if (!user) {
      setTenant(null);
      setLoading(false);
      return () => { cancelled = true; };
    }

    async function fetchTenant() {
      try {
        const context = await getOrganizationContext();
        if (!cancelled) setTenant(context ? {
          ...context.organization,
          type: 'institution',
          category: context.organization.kind === 'educational_institution' ? 'school' : context.organization.kind,
          displayName: context.organization.name,
          role: context.membership.role,
          unitIds: context.membership.unitIds,
          effectiveStatus: context.effectiveStatus,
        } as Tenant : null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load tenant'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTenant();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return { tenant, loading, error };
}

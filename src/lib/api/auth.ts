import { xtaraApi } from '@/lib/api/client';

export type ApiSessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture?: string | null;
  emailVerified?: boolean;
};

export async function createApiSession(idToken: string): Promise<ApiSessionUser> {
  return xtaraApi.post<ApiSessionUser>('/auth/session', { idToken });
}

export async function logoutApiSession(): Promise<void> {
  await xtaraApi.post('/auth/logout');
}

export async function verifyApiSession(): Promise<{ authenticated: boolean; user?: ApiSessionUser }> {
  return xtaraApi.get('/auth/verify');
}

export async function getPostAuthDestination(): Promise<string> {
  try {
    const context = await xtaraApi.get<{
      membership?: { role?: string };
      accessMode?: string;
    } | null>('/organizations/context');
    if (context?.membership?.role && context.membership.role !== 'student') return '/organization';
  } catch {
    // Continue through the learner destination checks.
  }

  try {
    const careerPaths = await xtaraApi.get<{ items?: Array<{ id: string }> }>('/career-paths/me');
    const firstPath = careerPaths.items?.[0];
    if (firstPath?.id) return '/';
  } catch {
    // Fall through to the assessment route.
  }

  try {
    const latest = await xtaraApi.get<{ assessment?: unknown }>('/assessment/latest');
    return latest.assessment ? '/' : '/assessment';
  } catch {
    return '/assessment';
  }
}

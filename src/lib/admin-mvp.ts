import { MVP_NAVIGATION_ENABLED } from '@/lib/mvp-navigation';

// Reversible presentation scope; content, contracts and workflow history remain intact.
const enabledRoots = [
  '/admin/mvp-readiness', '/admin/assessment-definitions', '/admin/dream-careers',
  '/admin/future-directions', '/admin/career-sources', '/admin/users', '/admin/settings',
];
export function isAdminMvpRouteEnabled(pathname: string): boolean {
  if (!MVP_NAVIGATION_ENABLED) return true;
  const path = pathname.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return path === '/admin' || enabledRoots.some((root) => path === root || path.startsWith(`${root}/`));
}

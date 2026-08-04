'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Menu } from 'lucide-react';

import AdminLogin, { AdminAccessRequired } from '@/components/admin/AdminLogin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { canManageSystem, canManageUsers, resolveAdminRole } from '@/lib/admin-access';
import { WORKSPACE_MANIFESTS } from '@/lib/workspace-manifest';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/assistant': 'Admin assistant',
  '/admin/stories': 'Stories',
  '/admin/challenges': 'Challenges',
  '/admin/good-reads': 'Good reads',
  '/admin/sparks': 'Sparks',
  '/admin/games': 'Games',
  '/admin/colleges': 'College catalogue',
  '/admin/dream-careers': 'Dream careers',
  '/admin/future-directions': 'Future directions',
  '/admin/career-sources': 'Career sources',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const adminRole = resolveAdminRole(userProfile);

  useEffect(() => {
    if (!loading && !user) {
      if (pathname !== WORKSPACE_MANIFESTS.admin.entryPath) {
        router.replace(WORKSPACE_MANIFESTS.admin.entryPath);
      }
      return;
    }
    if (!loading && user && !adminRole) {
      if (pathname !== WORKSPACE_MANIFESTS.admin.homePath) {
        router.replace(WORKSPACE_MANIFESTS.admin.homePath);
      }
      return;
    }
    if (!loading && user && pathname.startsWith('/admin/settings') && !canManageSystem(adminRole)) {
      router.replace('/admin');
      return;
    }
    if (!loading && user && pathname.startsWith('/admin/users') && !canManageUsers(adminRole)) {
      router.replace('/admin');
    }
  }, [adminRole, loading, pathname, router, user]);

  const redirectingNestedLogin = !loading && !user && pathname !== WORKSPACE_MANIFESTS.admin.entryPath;
  const redirectingUnauthorized = !loading && Boolean(user) && !adminRole && pathname !== WORKSPACE_MANIFESTS.admin.homePath;
  const redirectingSettings = !loading && Boolean(user) && Boolean(adminRole)
    && pathname.startsWith('/admin/settings') && !canManageSystem(adminRole);
  const redirectingUsers = !loading && Boolean(user) && Boolean(adminRole)
    && pathname.startsWith('/admin/users') && !canManageUsers(adminRole);

  if (loading || redirectingNestedLogin || redirectingUnauthorized || redirectingSettings || redirectingUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          {loading ? 'Checking admin access…' : !user ? 'Opening admin sign in…' : 'Opening an allowed admin page…'}
        </div>
      </div>
    );
  }

  if (!user) return <AdminLogin />;
  if (!adminRole) return <AdminAccessRequired email={user.email} />;

  const title = Object.entries(PAGE_TITLES)
    .filter(([path]) => path === '/admin' ? pathname === path : pathname.startsWith(`${path}/`) || pathname === path)
    .sort(([left], [right]) => right.length - left.length)[0]?.[1] || 'Admin';

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/20">
      <AdminSidebar className="hidden shrink-0 lg:flex" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <AdminSidebar
            className="relative z-10 shadow-2xl"
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Button
            aria-label="Open navigation"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Manage Xtara content and platform operations</p>
          </div>
          {pathname !== '/admin/assistant' ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/assistant">
                <Bot />
                <span className="hidden sm:inline">Ask admin assistant</span>
              </Link>
            </Button>
          ) : null}
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

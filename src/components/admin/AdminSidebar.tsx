'use client';
import { isAdminMvpRouteEnabled } from '@/lib/admin-mvp';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  BookOpen,
  Bot,
  Building2,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Route,
  ShieldCheck,
  Settings,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { canManageSystem, canManageUsers, resolveAdminRole } from '@/lib/admin-access';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Admin assistant', href: '/admin/assistant', icon: Bot },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Stories', href: '/admin/stories', icon: BookOpen },
      { name: 'Good reads', href: '/admin/good-reads', icon: FileText },
      { name: 'Sparks', href: '/admin/sparks', icon: Sparkles },
      { name: 'Challenges', href: '/admin/challenges', icon: Trophy },
      { name: 'Games', href: '/admin/games', icon: Gamepad2 },
      { name: 'Game templates', href: '/admin/game-templates', icon: Gamepad2 },
    ],
  },
  {
    label: 'Catalogues',
    items: [
      { name: 'Colleges', href: '/admin/colleges', icon: Building2 },
    ],
  },
  {
    label: 'Guidance',
    items: [
      { name: 'MVP readiness', href: '/admin/mvp-readiness', icon: ShieldCheck },
      { name: 'Dream careers', href: '/admin/dream-careers', icon: Star },
      { name: 'Assessment definitions', href: '/admin/assessment-definitions', icon: FileText },
      { name: 'Future directions', href: '/admin/future-directions', icon: Route },
      { name: 'Phase 1 review', href: '/admin/dream-career-phase1-review', icon: ShieldCheck },
      { name: 'Career sources', href: '/admin/career-sources', icon: BadgeCheck },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({
  className,
  onNavigate,
  onClose,
}: {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  const active = (href: string) => href === '/admin'
    ? pathname === href
    : pathname.startsWith(href);

  const displayName = userProfile?.displayName || user?.displayName || user?.email || 'Administrator';
  const adminRole = resolveAdminRole(userProfile);
  const role = adminRole === 'super_admin'
    ? 'Super admin'
    : adminRole === 'admin' ? 'Administrator' : 'Content editor';
  const managesSystem = canManageSystem(adminRole);
  const managesUsers = canManageUsers(adminRole);

  return (
    <aside className={cn('flex h-full w-[17rem] flex-col border-r bg-sidebar text-sidebar-foreground', className)}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-black text-sidebar-primary-foreground">
          X
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">Xtara Admin</p>
          <p className="truncate text-xs text-sidebar-foreground/60">Platform control plane</p>
        </div>
        {onClose ? (
          <Button
            aria-label="Close navigation"
            className="text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {groups.map((group) => ({
          ...group,
          items: group.items.filter((item) => (
            isAdminMvpRouteEnabled(item.href)
        && (item.href !== '/admin/settings' || managesSystem)
            && (item.href !== '/admin/users' || managesUsers)
          )),
        })).filter((group) => group.items.length > 0).map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active(item.href);
                return (
                  <Link
                    key={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground/72 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground',
                    )}
                    href={item.href}
                    onClick={onNavigate}
                  >
                    <Icon className="size-4" />
                    <span>{item.name}</span>
                    {item.href === '/admin/assistant' ? (
                      <Badge className="ml-auto border-white/15 bg-white/10 px-1.5 text-[10px] text-inherit" variant="outline">
                        AI
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <Separator className="mb-3 bg-sidebar-border" />
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <Avatar className="size-9 border border-white/10">
            <AvatarImage alt={displayName} src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

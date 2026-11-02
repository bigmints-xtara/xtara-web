'use client';
import { isAdminMvpRouteEnabled } from '@/lib/admin-mvp';
import { MVP_NAVIGATION_ENABLED } from '@/lib/mvp-navigation';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
  Gamepad2,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { xtaraApi } from '@/lib/api/client';

type Stats = {
  grandTotal: number;
  totalByCollection: Record<string, number>;
  collections: Array<{ byStatus: { published?: number; draft?: number; inReview?: number } }>;
};

const modules = [
  { title: 'MVP readiness', description: 'Review launch coverage and missing content', href: '/admin/mvp-readiness', key: '', icon: ShieldCheck },
  { title: 'Assessment definitions', description: 'Manage the grades 8–12 assessment', href: '/admin/assessment-definitions', key: 'assessment_definitions', icon: FileText },
  { title: 'Career sources', description: 'Verify evidence behind career guidance', href: '/admin/career-sources', key: 'career_sources', icon: FileText },
  { title: 'Stories', description: 'Career narratives and slide content', href: '/admin/stories', key: 'stories', icon: BookOpen },
  { title: 'Good reads', description: 'Articles and external learning resources', href: '/admin/good-reads', key: 'good-reads', icon: FileText },
  { title: 'Sparks', description: 'Short motivational learning moments', href: '/admin/sparks', key: 'sparks', icon: Sparkles },
  { title: 'Challenges', description: 'Quizzes, prompts, and rewards', href: '/admin/challenges', key: 'challenges', icon: Trophy },
  { title: 'Games', description: 'Interactive activities and schedules', href: '/admin/games', key: 'games', icon: Gamepad2 },
  { title: 'Colleges', description: 'Accepted institutions, courses, and career mappings', href: '/admin/colleges', key: '', icon: Building2 },
  { title: 'Dream careers', description: 'Curated career role profiles', href: '/admin/dream-careers', key: 'dream_careers', icon: Star },
  { title: 'Future directions', description: 'Assessment pathways and evidence rules', href: '/admin/future-directions', key: 'future_directions', icon: Route },
  { title: 'Phase 1 review', description: 'Review 229 canonical Future Direction decisions', href: '/admin/dream-career-phase1-review', key: '', icon: ShieldCheck },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (MVP_NAVIGATION_ENABLED) return;
    let active = true;
    xtaraApi.get<Stats>('/admin/content/stats')
      .then((value) => active && setStats(value))
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const published = stats?.collections.reduce((total, collection) => total + (collection.byStatus.published || 0), 0) || 0;
  const drafts = stats?.collections.reduce((total, collection) => total + (collection.byStatus.draft || 0), 0) || 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border bg-primary px-6 py-8 text-primary-foreground shadow-sm md:px-8">
          <div className="absolute -right-20 -top-24 size-72 rounded-full bg-white/8" />
          <div className="absolute -bottom-24 right-24 size-56 rounded-full bg-secondary/15" />
          <div className="relative max-w-2xl">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white" variant="outline">Platform workspace</Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Run Xtara from one clear workspace.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              Manage the grades 8–12 assessment, career directions, career guides and launch review.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-primary hover:bg-white/90">
                <Link href="/admin/mvp-readiness"><ShieldCheck /> Review MVP readiness</Link>
              </Button>
              <Button asChild className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white" variant="outline">
                <Link href="/admin/assessment-definitions">Manage assessment <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </section>

        {stats && !MVP_NAVIGATION_ENABLED ? (
          <section className="grid gap-4 sm:grid-cols-3" aria-label="Content totals">
            <Card className="gap-2 py-5 shadow-none">
              <CardHeader className="px-5"><CardDescription>Total content</CardDescription><CardTitle className="text-3xl">{stats.grandTotal}</CardTitle></CardHeader>
            </Card>
            <Card className="gap-2 py-5 shadow-none">
              <CardHeader className="px-5"><CardDescription>Published</CardDescription><CardTitle className="text-3xl">{published}</CardTitle></CardHeader>
            </Card>
            <Card className="gap-2 py-5 shadow-none">
              <CardHeader className="px-5"><CardDescription>Drafts</CardDescription><CardTitle className="text-3xl">{drafts}</CardTitle></CardHeader>
            </Card>
          </section>
        ) : null}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Content and guidance</h2>
            <p className="text-sm text-muted-foreground">Open a workspace to review and manage its records.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.filter((module) => isAdminMvpRouteEnabled(module.href)).map((module) => {
              const Icon = module.icon;
              return (
                <Link className="group" href={module.href} key={module.href}>
                  <Card className="h-full gap-0 py-5 shadow-none transition-colors group-hover:border-primary/35 group-hover:bg-accent/5">
                    <CardHeader className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary"><Icon className="size-5" /></div>
                      <div className="min-w-0"><CardTitle className="text-base">{module.title}</CardTitle><CardDescription className="mt-1 line-clamp-1">{module.description}</CardDescription></div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </CardHeader>
                    {module.key && stats ? <p className="mt-4 px-5 text-xs text-muted-foreground">{stats.totalByCollection[module.key] || 0} records</p> : module.href === '/admin/colleges' ? <p className="mt-4 px-5 text-xs text-muted-foreground">Active Supabase release</p> : null}
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

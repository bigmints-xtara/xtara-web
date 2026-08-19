'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ShieldCheck } from 'lucide-react';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { downloadAdminCollegeCsv, getAdminCollegeCatalog, type AdminCollegeCatalogPage, type AdminCollegeSummary } from '@/lib/admin-college-catalog';
import { useAdminTableQuery, type AdminTableSelection } from '@/lib/admin-table';

const EMPTY: AdminCollegeCatalogPage = { items: [], page: 1, pageSize: 25, total: 0, totalPages: 0, facets: [], groups: [], summaries: [], release: { id: '', status: '', active: false, productionReady: false }, counts: { institutions: 0, courseConcepts: 0, courseOfferings: 0, careerCourseLinks: 0 }, immutable: true };

export default function AdminCollegesPage() {
  const [query, setQuery] = useAdminTableQuery(
    { page: 1, pageSize: 25, search: '', filters: {}, sort: { field: 'name', direction: 'asc' } },
    { sortFields: ['name', 'city', 'state', 'type', 'providerId'] },
  );
  const [catalog, setCatalog] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; getAdminCollegeCatalog(query).then((data) => { if (active) { setCatalog(data); setError(null); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load colleges'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [query]);
  const columns = useMemo<AdminDataColumn<AdminCollegeSummary>[]>(() => [
    { id: 'name', label: 'Name', sortable: true, cell: (college) => <Link aria-label={`Open ${college.name}`} className="block max-w-lg" href={`/admin/colleges/${encodeURIComponent(college.id)}`}><span className="block truncate font-medium">{college.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{college.providerId || college.id}</span></Link> },
    { id: 'city', label: 'City', sortable: true, className: 'hidden md:table-cell', cell: (college) => college.city || 'Not recorded' },
    { id: 'state', label: 'State', sortable: true, className: 'hidden md:table-cell', cell: (college) => college.state || 'Not recorded' },
    { id: 'type', label: 'Type', sortable: true, cell: (college) => <Badge variant="outline">{college.type || 'Institution'}</Badge> },
    { id: 'providerId', label: 'Provider ID', sortable: true, className: 'hidden lg:table-cell', cell: (college) => college.providerId || '—' },
  ], []);
  const exportSelection = async (_action: string, selection: AdminTableSelection) => { await downloadAdminCollegeCsv(query, selection.mode === 'ids' ? selection.ids : []); };
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-[100rem] space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">College catalogue</h1><Badge variant="secondary">Supabase</Badge>{catalog.release.active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">Inspect, group and export the accepted production release.</p></div><Badge variant="outline"><ShieldCheck />Read-only release</Badge></div>{catalog.release.id ? <Card className="py-0 shadow-none"><CardContent className="flex flex-wrap justify-between gap-3 p-4"><div><p className="text-xs text-muted-foreground">Active release</p><p className="font-mono text-sm font-medium">{catalog.release.id}</p></div><p className="text-xs text-muted-foreground">{catalog.counts.institutions.toLocaleString()} verified institutions · {catalog.counts.courseOfferings.toLocaleString()} offerings</p></CardContent></Card> : null}<AdminDataTable bulkActions={[{ value: 'export', label: 'Export CSV' }]} columns={columns} error={error} groupFields={[{ value: 'state', label: 'State' }, { value: 'type', label: 'Type' }]} loading={loading} onBulkAction={exportSelection} onQueryChange={(next) => { setLoading(true); setQuery(next); }} query={query} result={catalog} rowId={(college) => college.id} title="College catalogue" /><Card className="border-amber-200 bg-amber-50/70 py-0 shadow-none"><CardContent className="flex gap-4 p-5"><Download className="size-5 text-amber-800" /><div><p className="font-semibold text-amber-950">Release records are immutable</p><p className="mt-1 text-sm text-amber-950/75">Select rows to export them, or explicitly select all matching records. Corrections go through the accepted-release import workflow.</p></div></CardContent></Card></div></div>;
}

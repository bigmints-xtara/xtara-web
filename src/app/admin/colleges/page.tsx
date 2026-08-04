'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getAdminCollegeCatalog,
  type AdminCollegeCatalogPage,
} from '@/lib/admin-college-catalog';

const PAGE_SIZE = 25;

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

export default function AdminCollegesPage() {
  const [catalog, setCatalog] = useState<AdminCollegeCatalogPage | null>(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const debouncedCity = useDebouncedValue(city);
  const debouncedState = useDebouncedValue(state);
  const debouncedType = useDebouncedValue(institutionType);

  useEffect(() => {
    let active = true;
    getAdminCollegeCatalog({
      page, limit: PAGE_SIZE, query: debouncedQuery, city: debouncedCity,
      state: debouncedState, type: debouncedType,
    }).then((result) => {
      if (!active) return;
      setCatalog(result);
      setError('');
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'College catalogue could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedCity, debouncedQuery, debouncedState, debouncedType, page]);

  const filtersActive = Boolean(query || city || state || institutionType);
  const range = useMemo(() => {
    const total = catalog?.pagination.total || 0;
    const start = total ? ((catalog?.pagination.page || 1) - 1) * PAGE_SIZE + 1 : 0;
    return { start, end: Math.min(start + (catalog?.items.length || 0) - 1, total) };
  }, [catalog]);

  const clearFilters = () => {
    setLoading(true);
    setQuery(''); setCity(''); setState(''); setInstitutionType(''); setPage(1);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[100rem] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">College catalogue</h1><Badge variant="secondary">Supabase</Badge>{catalog?.release.active ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">Inspect the accepted production release, institution records, courses, and career mappings.</p></div>
          <Badge variant="outline"><ShieldCheck />Read-only release</Badge>
        </div>

        {catalog ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="College catalogue totals">
              <Stat label="Institutions" value={catalog.counts.institutions} />
              <Stat label="Course concepts" value={catalog.counts.courseConcepts} />
              <Stat label="Course offerings" value={catalog.counts.courseOfferings} />
              <Stat label="Career-course links" value={catalog.counts.careerCourseLinks} />
            </section>
            <Card className="gap-0 border-primary/10 py-0 shadow-none"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active release</p><p className="mt-1 truncate font-mono text-sm font-medium">{catalog.release.id}</p></div><div className="text-xs text-muted-foreground sm:text-right"><p>Production ready: {catalog.release.productionReady ? 'Yes' : 'No'}</p><p>Activated: {formatDate(catalog.release.activatedAt)}</p></div></CardContent></Card>
          </>
        ) : null}

        <div className="min-h-[34rem]">
          <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
            <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterInput label="Search colleges" value={query} onChange={(value) => { setLoading(true); setQuery(value); setPage(1); }} placeholder="Name" icon={Search} />
              <FilterInput label="Filter by city" value={city} onChange={(value) => { setLoading(true); setCity(value); setPage(1); }} placeholder="City" icon={MapPin} />
              <FilterInput label="Filter by state" value={state} onChange={(value) => { setLoading(true); setState(value); setPage(1); }} placeholder="State" icon={MapPin} />
              <FilterInput label="Filter by type" value={institutionType} onChange={(value) => { setLoading(true); setInstitutionType(value); setPage(1); }} placeholder="College, university…" icon={Building2} />
              <div className="flex items-center gap-3 md:col-span-2 xl:col-span-4"><p className="text-xs text-muted-foreground">Showing {range.start}–{range.end} of {catalog?.pagination.total || 0}</p>{filtersActive ? <Button className="ml-auto" size="sm" variant="ghost" onClick={clearFilters}><X />Clear filters</Button> : null}</div>
            </div>

            {error ? <div className="flex min-h-72 items-center justify-center p-8 text-center"><div><p className="font-medium">Unable to load colleges</p><p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p></div></div> : loading ? <div aria-label="Loading colleges" className="space-y-px">{Array.from({ length: 8 }).map((_, index) => <div className="h-16 animate-pulse bg-muted/30" key={index} />)}</div> : catalog?.items.length ? (
              <Table className="table-fixed"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[65%] md:w-[48%]">Name</TableHead><TableHead className="hidden w-[32%] md:table-cell">Location</TableHead><TableHead className="w-[35%] md:w-[20%]">Type</TableHead></TableRow></TableHeader><TableBody>{catalog.items.map((college) => <TableRow key={college.id}><TableCell className="min-w-0 overflow-hidden"><Link aria-label={`Open ${college.name}`} className="block w-full text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring" href={`/admin/colleges/${encodeURIComponent(college.id)}`}><span className="block truncate font-medium">{college.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{college.providerId || college.id}</span></Link></TableCell><TableCell className="hidden truncate md:table-cell">{[college.city, college.state].filter(Boolean).join(', ') || 'Not recorded'}</TableCell><TableCell><Badge className="max-w-full truncate" variant="outline">{college.type || 'Institution'}</Badge></TableCell></TableRow>)}</TableBody></Table>
            ) : <div className="flex min-h-72 items-center justify-center p-8 text-center"><div><Building2 className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-medium">No colleges found</p><p className="mt-1 text-sm text-muted-foreground">Try a broader name or remove a location filter.</p></div></div>}

            <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-muted-foreground">Page {catalog?.pagination.page || 1} of {Math.max(1, catalog?.pagination.totalPages || 1)}</p><div className="flex gap-2"><Button aria-label="Previous page" disabled={loading || !catalog || catalog.pagination.page <= 1} onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }} size="icon-sm" variant="outline"><ChevronLeft /></Button><Button aria-label="Next page" disabled={loading || !catalog || catalog.pagination.page >= catalog.pagination.totalPages} onClick={() => { setLoading(true); setPage((current) => current + 1); }} size="icon-sm" variant="outline"><ChevronRight /></Button></div></div>
          </Card>
        </div>

        <Card className="gap-0 border-amber-200 bg-amber-50/70 py-0 shadow-none"><CardContent className="flex gap-4 p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-800" /><div><p className="font-semibold text-amber-950">Release records are immutable</p><p className="mt-1 text-sm leading-6 text-amber-950/75">Fixes must go through the source curation and accepted-release import workflow. This prevents one-off admin edits from breaking course offerings or career mappings.</p></div></CardContent></Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <Card className="gap-1 py-4 shadow-none"><CardContent className="px-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p></CardContent></Card>;
}

function FilterInput({ label, value, onChange, placeholder, icon: Icon }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; icon: typeof Search }) {
  return <label className="relative"><span className="sr-only">{label}</span><Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label={label} className="pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

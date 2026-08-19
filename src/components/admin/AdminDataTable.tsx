'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminTableQuery, AdminTableResult, AdminTableSelection } from '@/lib/admin-table';

export type AdminDataColumn<T> = {
  id: string;
  label: string;
  sortable?: boolean;
  className?: string;
  cell: (row: T) => ReactNode;
};

type Props<T> = {
  title: string;
  query: AdminTableQuery;
  result: AdminTableResult<T>;
  columns: AdminDataColumn<T>[];
  rowId: (row: T) => string;
  onQueryChange: (query: AdminTableQuery) => void;
  groupFields?: Array<{ value: string; label: string }>;
  bulkActions?: Array<{ value: string; label: string; destructive?: boolean }>;
  onBulkAction?: (action: string, selection: AdminTableSelection) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  selectionResetKey?: number;
};

export default function AdminDataTable<T>({
  title, query, result, columns, rowId, onQueryChange, groupFields = [], bulkActions = [], onBulkAction,
  loading = false, error = null, selectionResetKey = 0,
}: Props<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const filterKey = JSON.stringify(query.filters);

  useEffect(() => {
    setSelectedIds(new Set()); setAllMatching(false); setExcludedIds(new Set());
  }, [query.search, query.pageSize, query.sort.field, query.sort.direction, query.groupBy, filterKey, selectionResetKey]);

  const tableColumns = useMemo<ColumnDef<T>[]>(() => columns.map((column) => ({
    id: column.id,
    header: column.label,
    cell: ({ row }) => column.cell(row.original),
  })), [columns]);
  const table = useReactTable({ data: result.items, columns: tableColumns, getCoreRowModel: getCoreRowModel(), manualPagination: true, manualSorting: true });
  const pageIds = result.items.map(rowId);
  const pageSelected = pageIds.length > 0 && pageIds.every((id) => allMatching ? !excludedIds.has(id) : selectedIds.has(id));
  const selectionCount = allMatching ? result.total - excludedIds.size : selectedIds.size;

  const update = (patch: Partial<AdminTableQuery>) => onQueryChange({ ...query, ...patch });
  const togglePage = (checked: boolean) => {
    if (allMatching) {
      setExcludedIds((current) => {
        const next = new Set(current);
        for (const id of pageIds) { if (checked) next.delete(id); else next.add(id); }
        return next;
      });
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of pageIds) { if (checked) next.add(id); else next.delete(id); }
      return next;
    });
  };
  const toggleRow = (id: string, checked: boolean) => {
    if (allMatching) {
      setExcludedIds((current) => { const next = new Set(current); if (checked) next.delete(id); else next.add(id); return next; });
    } else {
      setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
    }
  };
  const runBulk = async (action: string) => {
    if (!onBulkAction || !selectionCount) return;
    setBusyAction(action);
    try {
      await onBulkAction(action, allMatching
        ? { mode: 'query', query, excludedIds: Array.from(excludedIds), expectedCount: result.total }
        : { mode: 'ids', ids: Array.from(selectedIds) });
    } finally { setBusyAction(null); }
  };
  const tableHeader = <TableHeader><TableRow><TableHead className="w-12"><input aria-label="Select all records on this page" checked={pageSelected} disabled={loading} onChange={(event) => togglePage(event.target.checked)} type="checkbox" /></TableHead>{columns.map((column) => <TableHead className={column.className} key={column.id}>{column.sortable ? <Button aria-label={`Sort by ${column.label}`} className="-ml-3" disabled={loading} onClick={() => update({ sort: { field: column.id, direction: query.sort.field === column.id && query.sort.direction === 'asc' ? 'desc' : 'asc' }, page: 1 })} size="sm" variant="ghost">{column.label}{query.sort.field === column.id ? query.sort.direction === 'asc' ? <ArrowUp /> : <ArrowDown /> : null}</Button> : column.label}</TableHead>)}</TableRow></TableHeader>;

  return <div className="space-y-4">
    {result.summaries.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label={`${title} summary`}>
      {result.summaries.map((summary) => <div className="rounded-xl border bg-card px-4 py-3" key={summary.key}><p className="text-xs text-muted-foreground">{summary.label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{summary.value}</p></div>)}
    </div> : null}
    <div aria-busy={loading} aria-label={`${title} table`} className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="relative min-w-56 flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label={`Search ${title}`} className="pl-9" disabled={loading} onChange={(event) => update({ search: event.target.value, page: 1 })} role="searchbox" value={query.search} /></div>
        {result.facets.map((facet) => <Select disabled={loading} key={facet.field} onValueChange={(value) => update({ filters: { ...query.filters, [facet.field]: value === 'all' ? [] : [value] }, page: 1 })} value={query.filters[facet.field]?.[0] || 'all'}><SelectTrigger aria-label={`Filter by ${facet.field}`} className="w-40"><SelectValue placeholder={facet.field} /></SelectTrigger><SelectContent><SelectItem value="all">All {facet.field}</SelectItem>{facet.values.map((value) => <SelectItem key={value.value} value={value.value}>{value.label} ({value.count})</SelectItem>)}</SelectContent></Select>)}
        {groupFields.length ? <Select disabled={loading} onValueChange={(value) => update({ groupBy: value === 'none' ? undefined : value, page: 1 })} value={query.groupBy || 'none'}><SelectTrigger aria-label="Group records" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No grouping</SelectItem>{groupFields.map((field) => <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>)}</SelectContent></Select> : null}
        {(query.search || Object.values(query.filters).some((values) => values.length) || query.groupBy) ? <Button disabled={loading} onClick={() => onQueryChange({ ...query, page: 1, search: '', filters: {}, groupBy: undefined })} size="sm" variant="ghost"><X />Clear</Button> : null}
        {loading ? <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 aria-hidden="true" className="size-4 animate-spin" />Loading records…</div> : null}
      </div>
      {result.groups.length ? <div className="flex flex-wrap gap-2 border-b bg-muted/20 px-4 py-3">{result.groups.map((group) => <Badge key={group.value} variant="outline">{group.label}: {group.count}</Badge>)}</div> : null}
      {selectionCount ? <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50 px-4 py-3 text-sm text-blue-950"><strong>{allMatching ? `All ${selectionCount} matching records selected` : `${selectionCount} selected`}</strong>{!allMatching && pageSelected && result.total > pageIds.length ? <Button aria-label={`Select all ${result.total} matching records`} disabled={loading} onClick={() => { setAllMatching(true); setSelectedIds(new Set()); }} size="sm" variant="link">Select all {result.total} matching</Button> : null}<div className="ml-auto flex gap-2">{bulkActions.map((action) => <Button aria-label={`${action.label} selected`} disabled={loading || Boolean(busyAction)} key={action.value} onClick={() => runBulk(action.value)} size="sm" variant={action.destructive ? 'destructive' : 'outline'}>{busyAction === action.value ? 'Working…' : action.label}</Button>)}</div></div> : null}
      {error ? <div className="p-8 text-center text-sm text-destructive">{error}</div> : loading ? <Table>{tableHeader}<TableBody aria-label="Loading records">{Array.from({ length: 7 }).map((_, index) => <TableRow key={index}><TableCell colSpan={columns.length + 1}><div className="h-8 animate-pulse rounded-md bg-muted/50" /></TableCell></TableRow>)}</TableBody></Table> : result.items.length ? <Table>{tableHeader}<TableBody>{table.getRowModel().rows.map((row) => { const id = rowId(row.original); const checked = allMatching ? !excludedIds.has(id) : selectedIds.has(id); return <TableRow key={id}><TableCell><input aria-label={`Select ${id}`} checked={checked} onChange={(event) => toggleRow(id, event.target.checked)} type="checkbox" /></TableCell>{row.getVisibleCells().map((cell, index) => <TableCell className={columns[index]?.className} key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>; })}</TableBody></Table> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><Inbox className="size-7 text-muted-foreground" /><p className="mt-3 font-medium">No matching records</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"><p className="text-xs text-muted-foreground">{result.total ? `${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} of ${result.total}` : '0 records'}</p><div className="flex items-center gap-2"><Select disabled={loading} onValueChange={(value) => update({ pageSize: Number(value) as AdminTableQuery['pageSize'], page: 1 })} value={String(query.pageSize)}><SelectTrigger aria-label="Rows per page" className="w-24"><SelectValue /></SelectTrigger><SelectContent>{[10, 20, 25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>)}</SelectContent></Select><Button aria-label="Previous page" disabled={loading || query.page <= 1} onClick={() => update({ page: query.page - 1 })} size="icon-sm" variant="outline"><ChevronLeft /></Button><span className="text-xs font-medium">Page {query.page} of {Math.max(1, result.totalPages)}</span><Button aria-label="Next page" disabled={loading || query.page >= result.totalPages} onClick={() => update({ page: query.page + 1 })} size="icon-sm" variant="outline"><ChevronRight /></Button></div></div>
    </div>
  </div>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Edit3, Filter, Inbox, MoreHorizontal, Plus, Search, Send, ShieldCheck, Trash2, Undo2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { canDeleteContent, canPublishContent, resolveAdminRole } from '@/lib/admin-access';
import { adminContentApprovalApi } from '@/lib/admin-content-approval';
import { AdminService } from '@/lib/services/adminService';
import { cn, formatSnakeCaseToTitleCase } from '@/lib/utils';
import type { AdminConfig, AdminEntity, EntityStatus } from '@/types/admin';
import { getAdminContentSlug } from './adminContentRegistry';

interface AdminMasterDetailProps<T extends AdminEntity> {
  config: AdminConfig<T>;
  renderEditor: (
    entity: T | null,
    onSave: (data: Partial<T>) => Promise<void>,
    onCancel: () => void,
  ) => React.ReactNode;
}

const STATUS_LABELS: Record<EntityStatus, string> = {
  all: 'All statuses', published: 'Published', draft: 'Draft', inReview: 'In review',
  created: 'Created', updated: 'Updated', archived: 'Archived',
};
const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);
  return debouncedValue;
}

export default function AdminMasterDetail<T extends AdminEntity>({ config }: AdminMasterDetailProps<T>) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const adminRole = resolveAdminRole(userProfile);
  const mayPublish = canPublishContent(adminRole);
  const mayDelete = canDeleteContent(adminRole);
  const [entities, setEntities] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EntityStatus>('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [availableDomains, setAvailableDomains] = useState<string[]>(['all']);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const service = useMemo(() => new AdminService(config), [config]);
  const supportsApproval = Boolean(config.supportsApproval);
  const routeSlug = getAdminContentSlug(config as unknown as AdminConfig<AdminEntity>);
  const listHref = `/admin/${routeSlug}`;
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  useEffect(() => service.streamPage({
    page, limit: PAGE_SIZE, status: statusFilter, domain: domainFilter, searchQuery: debouncedSearchQuery,
  }, (loadedPage) => {
    const uniqueEntities = Object.values(loadedPage.items.reduce((acc, entity) => {
      acc[entity.id] = entity;
      return acc;
    }, {} as Record<string, T>)) as T[];
    setEntities(uniqueEntities);
    setSelectedIds((current) => current.filter((id) => uniqueEntities.some((entity) => entity.id === id)));
    setTotal(loadedPage.total);
    setTotalPages(loadedPage.totalPages);
    setAvailableDomains(loadedPage.availableDomains.length ? loadedPage.availableDomains : ['all']);
    setIsLoading(false);
    setError(null);
  }, (streamError) => {
    setError(streamError.message);
    setIsLoading(false);
  }), [debouncedSearchQuery, domainFilter, page, reloadToken, service, statusFilter]);

  const visiblePage = totalPages ? Math.min(page, totalPages) : 1;
  const rangeStart = total ? (visiblePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = total ? Math.min(rangeStart + entities.length - 1, total) : 0;
  const reloadPage = () => setReloadToken((current) => current + 1);
  const openRecord = (entity: T) => router.push(`${listHref}/${encodeURIComponent(entity.id)}`);

  const refreshEntity = async (id: string) => {
    const refreshed = await service.getById(id);
    if (refreshed) setEntities((current) => current.map((entity) => entity.id === refreshed.id ? refreshed : entity));
  };

  const approveEntities = async (ids: string[]) => {
    if (!supportsApproval) throw new Error(`${config.entityName} does not support approval`);
    if (!mayPublish) throw new Error('Content editors cannot approve records');
    if (!ids.length || !confirm(`Approve ${ids.length} ${ids.length === 1 ? config.entityName : config.entityNamePlural}? This records you as the human reviewer.`)) return;

    setIsApproving(true);
    setActionMessage('');
    setActionError('');
    try {
      const result = await adminContentApprovalApi.approve(config.collectionName, ids);
      const failedIds = new Set(result.failed.map((failure) => failure.id));
      setSelectedIds(ids.filter((id) => failedIds.has(id)));
      if (result.approved.length) {
        setActionMessage(`${result.approved.length} ${result.approved.length === 1 ? config.entityName : config.entityNamePlural} approved and verified. ${result.failed.length ? `${result.failed.length} still need changes.` : 'They are ready to publish.'}`);
      }
      if (result.failed.length) {
        setActionError(result.failed.map((failure) => `${failure.id}: ${failure.error}`).join(' '));
      }
      reloadPage();
    } catch (approvalError) {
      setActionError(approvalError instanceof Error ? approvalError.message : `Unable to approve ${config.entityNamePlural.toLowerCase()}.`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleAction = async (action: string, entity: T) => {
    try {
      if (action === 'edit') {
        openRecord(entity);
      } else if (action === 'duplicate' && confirm(`Duplicate “${config.getTitle(entity)}”?`)) {
        const id = await service.duplicate(entity.id);
        router.push(`${listHref}/${encodeURIComponent(id)}`);
      } else if (action === 'publish') {
        if (!mayPublish) throw new Error('Content editors cannot publish records');
        await service.publish(entity.id);
        await refreshEntity(entity.id);
        reloadPage();
      } else if (action === 'approve') {
        await approveEntities([entity.id]);
      } else if (action === 'unpublish') {
        if (!mayPublish) throw new Error('Content editors cannot unpublish records');
        await service.unpublish(entity.id);
        await refreshEntity(entity.id);
        reloadPage();
      } else if (action === 'delete' && confirm(`Archive “${config.getTitle(entity)}”?`)) {
        if (!mayDelete) throw new Error('Content editors cannot archive records');
        await service.delete(entity.id);
        if (entities.length === 1 && page > 1) setPage((current) => current - 1);
        else reloadPage();
      }
    } catch (actionError) {
      alert(actionError instanceof Error ? actionError.message : 'Unable to complete that action');
    }
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm text-center"><p className="font-medium">Unable to load {config.entityNamePlural.toLowerCase()}</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-5" onClick={reloadPage} variant="outline">Try again</Button></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[100rem] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{config.entityNamePlural}</h1><Badge variant="secondary">{total}</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">Create, review, preview, and publish {config.entityNamePlural.toLowerCase()}.</p>
          </div>
          {!config.hideNewButton ? <Button asChild><Link href={`${listHref}/new`}><Plus />New {config.entityName}</Link></Button> : null}
        </div>

        <div className="rounded-xl border bg-background">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label={`Search ${config.entityNamePlural}`} className="pl-9" onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }} placeholder={`Search ${config.entityNamePlural.toLowerCase()}`} value={searchQuery} />
            </div>
            <Button aria-expanded={showFilters} onClick={() => setShowFilters((current) => !current)} variant={statusFilter !== 'all' || domainFilter !== 'all' ? 'default' : 'outline'}><Filter />Filters{statusFilter !== 'all' || domainFilter !== 'all' ? <Badge className="ml-1 bg-background/20 text-inherit">On</Badge> : null}</Button>
            <p className="text-xs text-muted-foreground sm:ml-auto">Showing {rangeStart}–{rangeEnd} of {total}</p>
          </div>

          {showFilters ? (
            <div className="grid gap-3 border-b bg-muted/20 p-4 sm:grid-cols-[minmax(10rem,14rem)_minmax(10rem,18rem)_auto]">
              <Select onValueChange={(value) => { setStatusFilter(value as EntityStatus); setPage(1); }} value={statusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{config.availableStatuses.map((status) => <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>)}</SelectContent></Select>
              <Select onValueChange={(value) => { setDomainFilter(value); setPage(1); }} value={domainFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableDomains.map((domain) => <SelectItem key={domain} value={domain}>{domain === 'all' ? 'All domains' : formatSnakeCaseToTitleCase(domain)}</SelectItem>)}</SelectContent></Select>
              {(statusFilter !== 'all' || domainFilter !== 'all') ? <Button onClick={() => { setStatusFilter('all'); setDomainFilter('all'); setPage(1); }} variant="ghost"><X />Clear filters</Button> : null}
            </div>
          ) : null}

          {actionMessage ? <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4 shrink-0" />{actionMessage}</div> : null}
          {actionError ? <div role="alert" className="border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{actionError}</div> : null}
          {supportsApproval && selectedIds.length ? (
            <div className="flex flex-wrap items-center gap-3 border-b bg-blue-50 px-4 py-3">
              <p className="mr-auto text-sm font-medium text-blue-950">{selectedIds.length} selected</p>
              <Button disabled={isApproving || !mayPublish} onClick={() => approveEntities(selectedIds)} size="sm"><ShieldCheck />{isApproving ? 'Approving…' : 'Approve selected'}</Button>
              <Button disabled={isApproving} onClick={() => setSelectedIds([])} size="sm" variant="ghost">Clear selection</Button>
            </div>
          ) : null}

          {isLoading ? (
            <div aria-label="Loading records" className="space-y-px">{Array.from({ length: 7 }).map((_, index) => <div className="h-16 animate-pulse bg-muted/30" key={index} />)}</div>
          ) : entities.length ? (
            <Table className="table-fixed">
              <TableHeader><TableRow className="hover:bg-transparent">{supportsApproval ? <TableHead className="w-12"><input aria-label="Select all records on this page" checked={entities.length > 0 && entities.every((entity) => selectedIds.includes(entity.id))} onChange={(event) => setSelectedIds(event.target.checked ? entities.map((entity) => entity.id) : [])} type="checkbox" /></TableHead> : null}<TableHead className="w-[62%] md:w-[46%]">Name</TableHead><TableHead className="w-28">Status</TableHead><TableHead className="hidden w-56 md:table-cell">Domain / type</TableHead><TableHead className="hidden w-36 lg:table-cell">Updated</TableHead><TableHead className="w-14"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{entities.map((entity) => {
                const entityStatus = config.getStatus(entity);
                const title = config.getTitle(entity) || `Untitled ${config.entityName}`;
                return (
                  <TableRow key={config.getId(entity)}>
                    {supportsApproval ? <TableCell><input aria-label={`Select ${title}`} checked={selectedIds.includes(entity.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? Array.from(new Set([...current, entity.id])) : current.filter((id) => id !== entity.id))} type="checkbox" /></TableCell> : null}
                    <TableCell className="min-w-0 overflow-hidden">
                      <button aria-label={`Open ${title}`} className="block w-full text-left outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openRecord(entity)} type="button">
                        <span className="block truncate font-medium">{title}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">{config.getSubtitle(entity) || entity.id}</span>
                      </button>
                    </TableCell>
                    <TableCell><StatusBadge status={entityStatus} /></TableCell>
                    <TableCell className="hidden max-w-64 truncate md:table-cell">{formatSnakeCaseToTitleCase(config.getDomain(entity) || 'General')}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{formatUpdated(entity.updatedAt || entity.createdAt)}</TableCell>
                    <TableCell><RowActions canApprove={supportsApproval} canDelete={mayDelete} canPublish={mayPublish} onAction={(action) => handleAction(action, entity)} published={entityStatus === 'published'} title={title} /></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center"><div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted"><Inbox className="size-5 text-muted-foreground" /></div><p className="text-sm font-medium">No records found</p><p className="mt-1 text-xs text-muted-foreground">Try a different search or create a new {config.entityName.toLowerCase()}.</p></div>
          )}

          <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Page {visiblePage} of {Math.max(1, totalPages)}</p>
            <div className="flex gap-2">
              <Button aria-label="Previous page" disabled={isLoading || visiblePage <= 1} onClick={() => { setIsLoading(true); setPage((current) => Math.max(1, current - 1)); }} size="icon-sm" variant="outline"><ChevronLeft /></Button>
              <Button aria-label="Next page" disabled={isLoading || !totalPages || visiblePage >= totalPages} onClick={() => { setIsLoading(true); setPage((current) => current + 1); }} size="icon-sm" variant="outline"><ChevronRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EntityStatus }) {
  return <Badge className={cn('border-0 capitalize', status === 'published' ? 'bg-emerald-100 text-emerald-800' : status === 'inReview' ? 'bg-blue-100 text-blue-800' : status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800')} variant="secondary">{status === 'inReview' ? 'In review' : status}</Badge>;
}

function RowActions({ canApprove, canDelete, canPublish, onAction, published, title }: { canApprove: boolean; canDelete: boolean; canPublish: boolean; onAction: (action: string) => void; published: boolean; title: string }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button aria-label={`Actions for ${title}`} size="icon-sm" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onSelect={() => onAction('edit')}><Edit3 />Edit</DropdownMenuItem><DropdownMenuItem onSelect={() => onAction('duplicate')}><Copy />Duplicate</DropdownMenuItem>{canApprove && canPublish && !published ? <DropdownMenuItem onSelect={() => onAction('approve')}><ShieldCheck />Approve</DropdownMenuItem> : null}{canPublish ? <DropdownMenuItem onSelect={() => onAction(published ? 'unpublish' : 'publish')}>{published ? <Undo2 /> : <Send />}{published ? 'Unpublish' : 'Publish'}</DropdownMenuItem> : null}{canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction('delete')} variant="destructive"><Trash2 />Archive</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu>;
}

function formatUpdated(value?: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(value);
}

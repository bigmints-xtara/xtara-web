'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Edit3, MoreHorizontal, Plus, Send, Trash2, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { canDeleteContent, canPublishContent, resolveAdminRole } from '@/lib/admin-access';
import { useAdminTableQuery, type AdminTableResult, type AdminTableSelection } from '@/lib/admin-table';
import { AdminService } from '@/lib/services/adminService';
import { cn, formatSnakeCaseToTitleCase } from '@/lib/utils';
import type { AdminConfig, AdminEntity, EntityStatus } from '@/types/admin';
import AdminDataTable, { type AdminDataColumn } from './AdminDataTable';
import { getAdminContentSlug } from './adminContentRegistry';

interface Props<T extends AdminEntity> { config: AdminConfig<T>; renderEditor: (entity: T | null, onSave: (data: Partial<T>) => Promise<void>, onCancel: () => void) => React.ReactNode }
const emptyResult = <T,>(): AdminTableResult<T> => ({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0, facets: [], groups: [], summaries: [] });

export default function AdminMasterDetail<T extends AdminEntity>({ config }: Props<T>) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const role = resolveAdminRole(userProfile);
  const mayPublish = canPublishContent(role);
  const mayDelete = canDeleteContent(role);
  const service = useMemo(() => new AdminService(config), [config]);
  const listHref = `/admin/${getAdminContentSlug(config as unknown as AdminConfig<AdminEntity>)}`;
  const [query, setQuery] = useAdminTableQuery({ page: 1, pageSize: 20, search: '', filters: {}, sort: { field: 'updatedAt', direction: 'desc' } });
  const [result, setResult] = useState<AdminTableResult<T>>(emptyResult<T>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try { setResult(await service.getTable(query)); setError(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : `Unable to load ${config.entityNamePlural.toLowerCase()}`); }
    finally { setLoading(false); }
  }, [config.entityNamePlural, query, service]);
  useEffect(() => { void load(); }, [load, reloadToken]);

  const singleAction = async (action: string, entity: T) => {
    try {
      if (action === 'edit') return router.push(`${listHref}/${encodeURIComponent(entity.id)}`);
      if (action === 'duplicate') return router.push(`${listHref}/${encodeURIComponent(await service.duplicate(entity.id))}`);
      if (action === 'publish') await service.publish(entity.id);
      if (action === 'unpublish') await service.unpublish(entity.id);
      if (action === 'archive' && confirm(`Archive “${config.getTitle(entity)}”?`)) await service.delete(entity.id);
      setReloadToken((value) => value + 1);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to complete action'); }
  };
  const bulkAction = async (action: string, selection: AdminTableSelection) => {
    const bulk = await service.bulk(action, selection);
    setNotice(`${bulk.succeeded.length} succeeded${bulk.failed.length ? `; ${bulk.failed.length} failed: ${bulk.failed.map((item) => item.message).join('; ')}` : ''}`);
    setReloadToken((value) => value + 1);
  };

  const columns: AdminDataColumn<T>[] = [
    { id: 'title', label: 'Name', sortable: true, cell: (entity) => <button aria-label={`Open ${config.getTitle(entity) || entity.id}`} className="block max-w-lg text-left" onClick={() => router.push(`${listHref}/${encodeURIComponent(entity.id)}`)}><span className="block truncate font-medium">{config.getTitle(entity) || `Untitled ${config.entityName}`}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{config.getSubtitle(entity) || entity.id}</span></button> },
    { id: 'status', label: 'Status', sortable: true, cell: (entity) => <StatusBadge status={((entity as AdminEntity & { deletedAt?: Date }).deletedAt ? 'archived' : config.getStatus(entity)) as EntityStatus} /> },
    { id: 'domain', label: 'Domain / type', sortable: true, className: 'hidden md:table-cell', cell: (entity) => formatSnakeCaseToTitleCase(config.getDomain(entity) || 'General') },
    { id: 'updatedAt', label: 'Updated', sortable: true, className: 'hidden lg:table-cell', cell: (entity) => formatDate(entity.updatedAt || entity.createdAt) },
    { id: 'actions', label: 'Actions', cell: (entity) => <RowActions canDelete={mayDelete} canPublish={mayPublish} onAction={(action) => void singleAction(action, entity)} published={config.getStatus(entity) === 'published'} title={config.getTitle(entity) || entity.id} versionControlled={config.versionControlled === true} /> },
  ];
  const bulkActions = [
    ...(config.supportsApproval && mayPublish ? [{ value: 'approve', label: 'Approve' }] : []),
    ...(mayPublish ? [{ value: 'publish', label: 'Publish' }] : []),
    ...(mayPublish && !config.versionControlled ? [{ value: 'unpublish', label: 'Unpublish' }] : []),
    ...(mayDelete ? [{ value: 'archive', label: 'Archive', destructive: true }] : []),
  ];

  return <div className="h-full overflow-y-auto"><div className="mx-auto w-full max-w-[100rem] space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{config.entityNamePlural}</h1><Badge variant="secondary">{result.total}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Create, review, preview, publish and organize {config.entityNamePlural.toLowerCase()}.</p></div>{!config.hideNewButton ? <Button asChild><Link href={`${listHref}/new`}><Plus />New {config.entityName}</Link></Button> : null}</div>
    {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</div> : null}
    <AdminDataTable bulkActions={bulkActions} columns={columns} error={error} groupFields={[{ value: 'status', label: 'Status' }, { value: 'domain', label: 'Domain' }]} loading={loading} onBulkAction={bulkAction} onQueryChange={setQuery} query={query} result={result} rowId={(entity) => entity.id} selectionResetKey={reloadToken} title={config.entityNamePlural} />
  </div></div>;
}

function StatusBadge({ status }: { status: EntityStatus }) { return <Badge className={cn('border-0 capitalize', status === 'published' ? 'bg-emerald-100 text-emerald-800' : status === 'inReview' ? 'bg-blue-100 text-blue-800' : status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800')} variant="secondary">{status === 'inReview' ? 'In review' : status}</Badge>; }
function RowActions({ canDelete, canPublish, onAction, published, title, versionControlled }: { canDelete: boolean; canPublish: boolean; onAction: (action: string) => void; published: boolean; title: string; versionControlled: boolean }) { return <DropdownMenu><DropdownMenuTrigger asChild><Button aria-label={`Actions for ${title}`} size="icon-sm" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onAction('edit')}><Edit3 />Edit</DropdownMenuItem><DropdownMenuItem onSelect={() => onAction('duplicate')}><Copy />Duplicate</DropdownMenuItem>{canPublish && (!published || !versionControlled) ? <DropdownMenuItem onSelect={() => onAction(published ? 'unpublish' : 'publish')}>{published ? <Undo2 /> : <Send />}{published ? 'Unpublish' : 'Publish'}</DropdownMenuItem> : null}{canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction('archive')} variant="destructive"><Trash2 />Archive</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu>; }
function formatDate(value?: Date) { if (!value) return 'Not recorded'; const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date); }

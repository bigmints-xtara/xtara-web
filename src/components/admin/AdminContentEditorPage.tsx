'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, FilePenLine, Loader2, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { canPublishContent, resolveAdminRole } from '@/lib/admin-access';
import { adminContentApprovalApi } from '@/lib/admin-content-approval';
import { AdminService } from '@/lib/services/adminService';
import type { AdminEntity } from '@/types/admin';
import { cn } from '@/lib/utils';
import { getAdminContentDefinition } from './adminContentRegistry';

export default function AdminContentEditorPage({ contentType, recordId }: { contentType: string; recordId: string }) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const definition = getAdminContentDefinition(contentType);
  const [entity, setEntity] = useState<AdminEntity | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(recordId === 'new' ? null : recordId);
  const [loading, setLoading] = useState(recordId !== 'new');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [approving, setApproving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const service = useMemo(
    () => definition ? new AdminService(definition.config) : null,
    [definition],
  );

  useEffect(() => {
    if (!definition || !service || recordId === 'new') return;

    let cancelled = false;
    service.getById(recordId)
      .then((loaded) => {
        if (cancelled) return;
        setEntity(loaded);
        setPersistedId(loaded?.id || recordId);
        if (!loaded) setError(`${definition.config.entityName} not found.`);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : `Unable to load this ${definition.config.entityName.toLowerCase()}.`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [definition, recordId, service]);

  if (!definition || !service) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div><h1 className="font-semibold">Unknown content type</h1><Button asChild className="mt-4" variant="outline"><Link href="/admin">Back to admin</Link></Button></div>
      </div>
    );
  }

  const listHref = `/admin/${definition.slug}`;
  const title = entity ? definition.config.getTitle(entity) : `New ${definition.config.entityName}`;
  const status = entity ? definition.config.getStatus(entity) : 'draft';
  const mayApprove = canPublishContent(resolveAdminRole(userProfile));

  const save = async (data: Partial<AdminEntity>) => {
    setError('');
    if (!persistedId) {
      const createdId = await service.create(data);
      const created = await service.getById(createdId);
      if (!created) throw new Error(`The ${definition.config.entityName.toLowerCase()} was created but could not be read back.`);
      setEntity(created);
      setPersistedId(createdId);
      setSavedAt(new Date());
      router.replace(`${listHref}/${encodeURIComponent(createdId)}`);
      return;
    }

    await service.update(persistedId, data);
    const updated = await service.getById(persistedId);
    if (!updated) throw new Error(`The ${definition.config.entityName.toLowerCase()} was saved but could not be read back.`);
    setEntity(updated);
    setSavedAt(new Date());
  };

  const approve = async () => {
    if (!persistedId || !definition.config.supportsApproval || !mayApprove) return;
    if (!confirm(`Approve this ${definition.config.entityName}? This records you as the human reviewer.`)) return;
    setApproving(true);
    setActionMessage('');
    setActionError('');
    try {
      const result = await adminContentApprovalApi.approve(definition.config.collectionName, [persistedId]);
      if (result.failed.length) {
        setActionError(result.failed.map((failure) => failure.error).join(' '));
        return;
      }
      const approved = await service.getById(persistedId);
      if (!approved) throw new Error(`The ${definition.config.entityName.toLowerCase()} was approved but could not be read back.`);
      setEntity(approved);
      setActionMessage('Approved and verified. This record is ready to publish.');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : `Unable to approve this ${definition.config.entityName.toLowerCase()}.`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/20">
      <div className="shrink-0 border-b bg-background px-4 pt-4 sm:px-6">
        <Button asChild className="-ml-2" size="sm" variant="ghost">
          <Link href={listHref}><ArrowLeft />Back to {definition.config.entityNamePlural}</Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{title || `Untitled ${definition.config.entityName}`}</h1>
              <Badge variant="secondary">{status === 'inReview' ? 'In review' : status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {persistedId ? `Record ${persistedId}` : 'Create and save this record before previewing it.'}
              {savedAt ? ` · Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
          {definition.config.supportsApproval && persistedId && status !== 'published' ? (
            <Button disabled={approving || !mayApprove} onClick={approve} type="button"><ShieldCheck />{approving ? 'Approving…' : 'Approve'}</Button>
          ) : null}
        </div>
        {actionMessage ? <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{actionMessage}</div> : null}
        {actionError ? <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{actionError}</div> : null}
        <div aria-label="Content editor views" className="flex gap-1" role="tablist">
          <TabButton active={activeTab === 'edit'} icon={FilePenLine} label="Edit" onClick={() => setActiveTab('edit')} />
          <TabButton active={activeTab === 'preview'} disabled={!entity} icon={Eye} label="Preview" onClick={() => setActiveTab('preview')} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading record…</div>
      ) : error && !entity ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center"><div><p className="font-medium">Unable to open record</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild className="mt-5" variant="outline"><Link href={listHref}>Back to list</Link></Button></div></div>
      ) : (
        <div className="min-h-0 flex-1">
          {activeTab === 'edit' ? (
            <div className="h-full" key={persistedId || 'new'} role="tabpanel">
              {definition.renderEditor(entity, save, () => router.push(listHref))}
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-background" role="tabpanel">{entity ? definition.renderPreview(entity) : null}</div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, disabled, icon: Icon, label, onClick }: { active: boolean; disabled?: boolean; icon: typeof Eye; label: string; onClick: () => void }) {
  return (
    <button
      aria-selected={active}
      className={cn(
        'relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45',
        active && 'text-foreground after:bg-primary',
      )}
      disabled={disabled}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon className="size-4" />{label}
    </button>
  );
}

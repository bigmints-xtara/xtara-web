'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, FilePenLine, GitBranch, Loader2, RotateCcw, Rocket, Send, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { canPublishContent, resolveAdminRole } from '@/lib/admin-access';
import { adminContentApprovalApi } from '@/lib/admin-content-approval';
import {
  careerContentVersionsApi,
  type CareerContentVersion,
  type CareerContentVersionHistory,
} from '@/lib/career-content-versions';
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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'versions'>('edit');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [approving, setApproving] = useState(false);
  const [versionAction, setVersionAction] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<CareerContentVersionHistory | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState('');
  const [liveEntity, setLiveEntity] = useState<AdminEntity | null>(null);
  const [previewVersion, setPreviewVersion] = useState<CareerContentVersion | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const service = useMemo(
    () => definition ? new AdminService(definition.config) : null,
    [definition],
  );
  const versionedCollection = definition && ['dream_careers', 'future_directions'].includes(definition.config.collectionName)
    ? definition.config.collectionName
    : null;

  useEffect(() => {
    if (!definition || !service || recordId === 'new') return;

    let cancelled = false;
    service.getById(recordId)
      .then((loaded) => {
        if (cancelled) return;
        setEntity(loaded);
        setLiveEntity(loaded);
        setPersistedId(loaded?.id || recordId);
        if (!loaded) setError(`${definition.config.entityName} not found.`);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : `Unable to load this ${definition.config.entityName.toLowerCase()}.`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [definition, recordId, service]);

  const loadVersions = async () => {
    if (!versionedCollection || !persistedId) return null;
    setVersionsLoading(true);
    setVersionsError('');
    try {
      const history = await careerContentVersionsApi.history(versionedCollection, persistedId);
      setVersionHistory(history);
      if (history.active) {
        setEntity(definition!.config.fromFirestore(history.active.content, persistedId));
      }
      return history;
    } catch (caught) {
      setVersionsError(caught instanceof Error ? caught.message : 'Unable to load version history.');
      return null;
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (!versionedCollection || !persistedId) return;
    void loadVersions();
    // The stable route identity is the version-history boundary. The helper is
    // intentionally not a dependency because it closes over view state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionedCollection, persistedId]);

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
  const activeVersion = versionHistory?.active || null;
  const versionManaged = Boolean(
    versionedCollection
    && persistedId
    && ((liveEntity && definition.config.getStatus(liveEntity) === 'published') || versionHistory?.versions.length),
  );
  const displayedStatus = activeVersion?.status || status;
  const selectedPreviewEntity = previewVersion
    ? definition.config.fromFirestore(previewVersion.content, previewVersion.recordId)
    : entity;

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

    if (versionManaged && versionedCollection) {
      let draft = activeVersion;
      if (!draft) draft = await careerContentVersionsApi.createDraft(versionedCollection, persistedId);
      if (draft.status !== 'draft') throw new Error(`Version ${draft.revision} is ${versionLabel(draft.status)}. Return it to draft before editing.`);
      const saved = await careerContentVersionsApi.saveDraft(
        versionedCollection,
        persistedId,
        draft,
        { ...draft.content, ...data, id: persistedId },
      );
      setEntity(definition.config.fromFirestore(saved.content, persistedId));
      setPreviewVersion(null);
      setVersionHistory((history) => replaceVersion(history, saved));
      setSavedAt(new Date());
      setActionMessage(`Version ${saved.revision} saved. The live item is unchanged.`);
      return;
    }

    await service.update(persistedId, data);
    const updated = await service.getById(persistedId);
    if (!updated) throw new Error(`The ${definition.config.entityName.toLowerCase()} was saved but could not be read back.`);
    setEntity(updated);
    setSavedAt(new Date());
  };

  const runVersionAction = async (action: 'create' | 'submit' | 'approve' | 'return-to-draft' | 'promote') => {
    if (!versionedCollection || !persistedId) return;
    if ((action === 'approve' || action === 'promote') && !mayApprove) return;
    const confirmations: Partial<Record<typeof action, string>> = {
      approve: 'Approve this version? Your Admin identity will be recorded as the reviewer.',
      promote: 'Promote this approved version to live? Learners will receive it immediately after the persisted write succeeds.',
      'return-to-draft': 'Return this version to draft for more editing?',
    };
    if (confirmations[action] && !confirm(confirmations[action]!)) return;
    setVersionAction(action);
    setActionMessage('');
    setActionError('');
    try {
      const result = action === 'create'
        ? await careerContentVersionsApi.createDraft(versionedCollection, persistedId)
        : await careerContentVersionsApi.action(versionedCollection, persistedId, activeVersion!, action);
      setVersionHistory((history) => replaceVersion(history, result));
      if (action === 'promote') {
        const readback = await service.getById(persistedId);
        if (!readback) throw new Error(`Version ${result.revision} was promoted but the live item could not be read back.`);
        setLiveEntity(readback);
        setEntity(readback);
        setPreviewVersion(null);
        setActionMessage(`Version ${result.revision} is live and verified.`);
      } else {
        setEntity(definition.config.fromFirestore(result.content, persistedId));
        setActionMessage(action === 'create'
          ? `Version ${result.revision} is ready to edit. The live item is unchanged.`
          : action === 'submit'
            ? `Version ${result.revision} is ready for review.`
            : action === 'approve'
              ? `Version ${result.revision} is approved and ready to promote.`
              : `Version ${result.revision} is back in draft.`);
      }
      await loadVersions();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to update this version.');
    } finally {
      setVersionAction(null);
    }
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
              <Badge variant="secondary">{versionLabel(displayedStatus)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {persistedId ? `Record ${persistedId}` : 'Create and save this record before previewing it.'}
              {savedAt ? ` · Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
          {versionManaged ? (
            <VersionActions
              active={activeVersion}
              busy={versionAction}
              mayApprove={mayApprove}
              onAction={runVersionAction}
            />
          ) : definition.config.supportsApproval && persistedId && status !== 'published' ? (
            <Button disabled={approving || !mayApprove} onClick={approve} type="button"><ShieldCheck />{approving ? 'Approving…' : 'Approve'}</Button>
          ) : null}
        </div>
        {actionMessage ? <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{actionMessage}</div> : null}
        {actionError ? <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{actionError}</div> : null}
        <div aria-label="Content editor views" className="flex gap-1" role="tablist">
          <TabButton active={activeTab === 'edit'} icon={FilePenLine} label="Edit" onClick={() => setActiveTab('edit')} />
          <TabButton active={activeTab === 'preview'} disabled={!entity} icon={Eye} label="Preview" onClick={() => setActiveTab('preview')} />
          {versionedCollection && persistedId ? (
            <TabButton active={activeTab === 'versions'} icon={GitBranch} label="Versions" onClick={() => setActiveTab('versions')} />
          ) : null}
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
          ) : activeTab === 'preview' ? (
            <div className="h-full overflow-y-auto bg-background" role="tabpanel">{selectedPreviewEntity ? definition.renderPreview(selectedPreviewEntity) : null}</div>
          ) : (
            <VersionHistoryPanel
              error={versionsError}
              history={versionHistory}
              loading={versionsLoading}
              onPreview={(version) => { setPreviewVersion(version); setActiveTab('preview'); }}
              onRetry={() => { void loadVersions(); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function VersionActions({ active, busy, mayApprove, onAction }: {
  active: CareerContentVersion | null;
  busy: string | null;
  mayApprove: boolean;
  onAction: (action: 'create' | 'submit' | 'approve' | 'return-to-draft' | 'promote') => Promise<void>;
}) {
  if (!active) return <Button disabled={Boolean(busy)} onClick={() => void onAction('create')} type="button"><GitBranch />{busy === 'create' ? 'Creating…' : 'Create draft'}</Button>;
  if (active.status === 'draft') return <Button disabled={Boolean(busy)} onClick={() => void onAction('submit')} type="button"><Send />{busy === 'submit' ? 'Submitting…' : 'Submit for review'}</Button>;
  if (active.status === 'inReview') return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={Boolean(busy)} onClick={() => void onAction('return-to-draft')} type="button" variant="outline"><RotateCcw />Back to draft</Button>
      <Button disabled={Boolean(busy) || !mayApprove} onClick={() => void onAction('approve')} type="button"><ShieldCheck />{busy === 'approve' ? 'Approving…' : 'Approve version'}</Button>
    </div>
  );
  if (active.status === 'approved') return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={Boolean(busy)} onClick={() => void onAction('return-to-draft')} type="button" variant="outline"><RotateCcw />Back to draft</Button>
      <Button disabled={Boolean(busy) || !mayApprove} onClick={() => void onAction('promote')} type="button"><Rocket />{busy === 'promote' ? 'Promoting…' : 'Promote to live'}</Button>
    </div>
  );
  return null;
}

function VersionHistoryPanel({ error, history, loading, onPreview, onRetry }: {
  error: string;
  history: CareerContentVersionHistory | null;
  loading: boolean;
  onPreview: (version: CareerContentVersion) => void;
  onRetry: () => void;
}) {
  if (loading) return <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading versions…</div>;
  if (error) return <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="font-medium">Unable to load versions</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={onRetry} variant="outline">Retry</Button></div></div>;
  if (!history?.versions.length) return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">No version history yet. Create a draft from the live item to begin.</div>;
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6" role="tabpanel">
      <div className="mx-auto max-w-3xl space-y-3">
        {history.versions.map((version) => (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-4" key={version.id}>
            <div>
              <div className="flex items-center gap-2"><span className="font-medium">Version {version.revision}</span><Badge variant="secondary">{versionLabel(version.status)}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">Updated {new Date(version.updatedAt).toLocaleString()} by {version.updatedBy}</p>
            </div>
            <Button onClick={() => onPreview(version)} size="sm" variant="outline"><Eye />Preview</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function replaceVersion(history: CareerContentVersionHistory | null, version: CareerContentVersion): CareerContentVersionHistory {
  const versions = history?.versions || [];
  const next = [version, ...versions.filter((item) => item.id !== version.id)].sort((left, right) => right.revision - left.revision);
  return { live: next.find((item) => item.status === 'live') || null, active: next.find((item) => ['draft', 'inReview', 'approved'].includes(item.status)) || null, versions: next };
}

function versionLabel(status: string): string {
  return status === 'inReview' ? 'In review' : status.charAt(0).toUpperCase() + status.slice(1);
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

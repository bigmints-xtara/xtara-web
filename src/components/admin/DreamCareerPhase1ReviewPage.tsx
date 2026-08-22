'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/i18n/language-provider';
import {
  createDraftReviewCommand,
  createFinalizeReviewCommand,
  downloadAuthorityArtifact,
  dreamCareerPhase1ReviewApi,
  type DraftReviewCommand,
  type DreamCareerPhase1AuthorityArtifact,
  type DreamCareerPhase1DirectionOption,
  type DreamCareerPhase1ReviewDetail,
  type DreamCareerPhase1ReviewQueue,
  type DreamCareerPhase1ReviewQueueItem,
  type DreamCareerPhase1ReviewSummary,
  type FinalizeReviewCommand,
} from '@/lib/dream-career-phase1-review';
import { cn } from '@/lib/utils';

const EXPECTED_TOTAL = 229;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function idempotencyKey(action: 'draft' | 'finalize', careerId: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `phase1-${action}-${careerId}-${random}`;
}

function queueIntegrityError(queue: DreamCareerPhase1ReviewQueue, summary: DreamCareerPhase1ReviewSummary): string | null {
  if (queue.expectedTotal !== EXPECTED_TOTAL || queue.records.length !== EXPECTED_TOTAL) return `Review queue unavailable: expected ${EXPECTED_TOTAL} canonical careers but received ${queue.records.length}.`;
  if (queue.reviewId !== summary.reviewId || queue.expectedTotal !== summary.expectedTotal) return 'Review queue unavailable: queue and completion identities do not match.';
  if (queue.directionOptions.length !== 6 || new Set(queue.directionOptions.map((item) => item.directionId)).size !== 6 || queue.directionOptions.some((item, index) => item.canonicalOrder !== index)) return 'Review queue unavailable: the server did not return exactly six canonical Direction choices.';
  if (queue.records.some((record, index) => record.canonicalOrder !== index)) return 'Review queue unavailable: canonical career order does not match the server contract.';
  return null;
}

function directionLabel(option: DreamCareerPhase1DirectionOption, locale: string): string {
  if (locale === 'ml' || locale === 'ta') return option.localizedLabels[locale];
  return option.localizedLabels.en || option.label;
}

function formatReviewTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function StatusBadge({ status }: { status: DreamCareerPhase1ReviewQueueItem['status'] }) {
  const styles = status === 'finalized'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
    : status === 'draft'
      ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
      : '';
  return <Badge className={styles} variant="outline">{status === 'finalized' ? 'Finalized' : status === 'draft' ? 'Draft' : 'Not started'}</Badge>;
}

function SourceBadge({ record }: { record: DreamCareerPhase1ReviewQueueItem }) {
  const current = record.sourceBinding.status === 'current';
  return <Badge className={cn(current ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200')} variant="outline">Source {record.sourceBinding.status}</Badge>;
}

function recordDecision(record: DreamCareerPhase1ReviewQueueItem, labels: Map<string, string>) {
  const ids = record.finalDecision?.futureDirectionIds ?? (record.draft ? [record.draft.primaryDirectionId, ...record.draft.secondaryDirectionIds] : []);
  return ids.length ? { primary: labels.get(ids[0]) ?? ids[0], secondary: ids.slice(1).map((id) => labels.get(id) ?? id) } : null;
}

function RecordedReview({ record }: { record: DreamCareerPhase1ReviewQueueItem }) {
  if (record.status === 'pending') return <p className="text-muted-foreground">Not started</p>;
  return <div className="space-y-2 text-xs"><div><p>{record.draft ? 'Draft author recorded' : 'No draft author'}</p>{record.draft ? <time className="text-muted-foreground" dateTime={record.draft.updatedAt}>{formatReviewTime(record.draft.updatedAt)}</time> : null}</div><div><p>{record.finalDecision ? 'Final reviewer recorded' : 'Not finalized'}</p>{record.finalDecision ? <time className="text-muted-foreground" dateTime={record.finalDecision.reviewedAt}>{formatReviewTime(record.finalDecision.reviewedAt)}</time> : null}</div></div>;
}

function FinalizeDialog({ detail, labels, busy, error, triggerRef, onCancel, onConfirm }: {
  detail: DreamCareerPhase1ReviewDetail; labels: Map<string, string>; busy: boolean; error: string | null;
  triggerRef: React.RefObject<HTMLButtonElement | null>; onCancel: () => void; onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger = triggerRef.current;
    const backgrounds = Array.from(document.body.children).filter((element) => !element.hasAttribute('data-phase1-dialog-root')) as HTMLElement[];
    const previous = backgrounds.map((element) => ({ element, ariaHidden: element.getAttribute('aria-hidden'), inert: element.inert }));
    backgrounds.forEach((element) => { element.setAttribute('aria-hidden', 'true'); element.inert = true; });
    cancelRef.current?.focus();
    return () => {
      previous.forEach(({ element, ariaHidden, inert }) => { if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden); element.inert = inert; });
      trigger?.focus();
    };
  }, [triggerRef]);
  const primary = detail.draft?.primaryDirectionId;
  const secondary = detail.draft?.secondaryDirectionIds ?? [];
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    if (!focusable.length) return;
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey
      ? focusable[index <= 0 ? focusable.length - 1 : index - 1]
      : focusable[index >= focusable.length - 1 ? 0 : index + 1];
    event.preventDefault();
    next.focus();
  };
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" data-phase1-dialog-root="true">
      <button aria-label="Close confirmation" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" disabled={busy} onClick={onCancel} tabIndex={-1} type="button" />
      <div aria-describedby="phase1-finalize-description" aria-labelledby="phase1-finalize-title" aria-modal="true" className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background p-5 shadow-2xl sm:p-6" onKeyDown={onKeyDown} ref={dialogRef} role="dialog">
        <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" /><div><h2 className="text-lg font-semibold" id="phase1-finalize-title">Finalize this decision?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground" id="phase1-finalize-description">Finalization is permanent in this interface; another authenticated reviewer must finalize work authored by someone else.</p></div></div>
        <dl className="mt-5 grid gap-3 rounded-xl border bg-muted/25 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Career</dt><dd className="mt-1 font-medium">{detail.careerDisplay?.title ?? 'Canonical display unavailable'}</dd><dd className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{detail.careerId}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Review identity</dt><dd className="mt-1 font-medium">Version {detail.version}</dd><dd className="mt-0.5 break-all text-xs text-muted-foreground">{detail.careerDisplay?.inventoryVersion}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Primary Direction</dt><dd className="mt-1 font-medium">{primary ? labels.get(primary) : 'Unavailable'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Secondary Directions</dt><dd className="mt-1 font-medium">{secondary.length ? secondary.map((id) => labels.get(id) ?? id).join(', ') : 'None'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Current source identity</dt><dd className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.sourcePath ?? 'Unavailable'}</dd><dd className="mt-1 break-all font-mono text-xs text-muted-foreground">{detail.careerDisplay?.releaseId ?? 'Unavailable'}</dd></div>
        </dl>
        {error ? <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button disabled={busy} onClick={onCancel} ref={cancelRef} type="button" variant="outline">Cancel</Button><Button disabled={busy} onClick={onConfirm} type="button" variant="destructive">{busy ? <Loader2 className="animate-spin" /> : <ShieldAlert />}Finalize permanently</Button></div>
      </div>
    </div>, document.body,
  );
}

function DecisionEditor({ detail, locale, onClose, onPersisted }: {
  detail: DreamCareerPhase1ReviewDetail; locale: string; onClose: () => void; onPersisted: (detail: DreamCareerPhase1ReviewDetail) => Promise<void>;
}) {
  const initialIds = detail.finalDecision?.futureDirectionIds ?? (detail.draft ? [detail.draft.primaryDirectionId, ...detail.draft.secondaryDirectionIds] : []);
  const [primary, setPrimary] = useState(initialIds[0] ?? '');
  const [secondary, setSecondary] = useState<string[]>(initialIds.slice(1));
  const [busy, setBusy] = useState<'save' | 'finalize' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftReviewCommand | null>(null);
  const [pendingFinalize, setPendingFinalize] = useState<FinalizeReviewCommand | null>(null);
  const finalizeTriggerRef = useRef<HTMLButtonElement>(null);
  const labels = useMemo(() => new Map(detail.directionOptions.map((option) => [option.directionId, directionLabel(option, locale)])), [detail.directionOptions, locale]);
  const exactDirections = detail.directionOptions.length === 6 && new Set(detail.directionOptions.map((item) => item.directionId)).size === 6 && detail.directionOptions.every((item, index) => item.canonicalOrder === index && detail.canonicalDirectionIds[index] === item.directionId);
  const sourceCurrent = detail.sourceBinding.isCurrent && detail.sourceBinding.status === 'current' && detail.sourceBinding.blockers.length === 0;
  const persisted = detail.draft;
  const selectionPersisted = Boolean(persisted && primary === persisted.primaryDirectionId && secondary.length === persisted.secondaryDirectionIds.length && secondary.every((id, index) => id === persisted.secondaryDirectionIds[index]));
  const editable = detail.status !== 'finalized' && sourceCurrent && exactDirections;

  const changed = () => { setPendingDraft(null); setPendingFinalize(null); setError(null); setNotice(null); };
  const choosePrimary = (id: string) => { setPrimary(id); setSecondary((current) => current.filter((item) => item !== id)); changed(); };
  const toggleSecondary = (id: string) => { setSecondary((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current); changed(); };
  const save = async () => {
    if (!primary) { setError('Choose one primary Direction before saving.'); return; }
    const command = pendingDraft ?? createDraftReviewCommand(detail, primary, secondary, idempotencyKey('draft', detail.careerId));
    setPendingDraft(command); setBusy('save'); setError(null); setNotice(null);
    try { const readback = await dreamCareerPhase1ReviewApi.saveDraft(command); setPendingDraft(null); await onPersisted(readback); setNotice('Persisted readback confirmed.'); }
    catch (caught) { setError(errorMessage(caught, 'Unable to save and verify the draft.')); }
    finally { setBusy(null); }
  };
  const finalize = async () => {
    const command = pendingFinalize ?? createFinalizeReviewCommand(detail, idempotencyKey('finalize', detail.careerId));
    setPendingFinalize(command); setBusy('finalize'); setError(null);
    try { const readback = await dreamCareerPhase1ReviewApi.finalize(command); setPendingFinalize(null); await onPersisted(readback); setConfirming(false); setNotice('Finalized decision readback confirmed.'); }
    catch (caught) { setError(errorMessage(caught, 'Unable to finalize and verify the decision.')); }
    finally { setBusy(null); }
  };
  return <section aria-label="Decision editor" className="rounded-2xl border bg-background shadow-sm" role="region">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{detail.careerDisplay?.title ?? 'Canonical display unavailable'}</h2><StatusBadge status={detail.status} /><SourceBadge record={detail} /></div><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{detail.careerId}</p></div><Button aria-label="Close decision editor" onClick={onClose} size="icon-sm" type="button" variant="ghost"><X /></Button></div>
    <div className="space-y-5 p-4 sm:p-5">
      <Card className="py-0 shadow-none"><CardContent className="grid gap-4 p-4 text-sm lg:grid-cols-3"><div><p className="text-xs text-muted-foreground">Canonical source</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.sourcePath ?? 'Unavailable'}</p></div><div><p className="text-xs text-muted-foreground">Release</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.releaseId ?? 'Unavailable'}</p></div><div><p className="text-xs text-muted-foreground">Current record</p><p className="mt-1">Version {detail.version} · Source {detail.sourceBinding.status}</p></div>{detail.careerDisplay?.description ? <p className="leading-6 text-muted-foreground lg:col-span-3">{detail.careerDisplay.description}</p> : null}</CardContent></Card>
      {!sourceCurrent || !exactDirections ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><p className="font-semibold">This record cannot be changed.</p><p className="mt-1">{!exactDirections ? 'The server did not provide exactly six canonical Direction choices.' : `Source binding is ${detail.sourceBinding.status}.`}</p>{detail.sourceBinding.blockers.length ? <p className="mt-2 break-all font-mono text-xs">{detail.sourceBinding.blockers.join(', ')}{detail.sourceBinding.mismatchFields.length ? ` · ${detail.sourceBinding.mismatchFields.join(', ')}` : ''}</p> : null}</div> : null}
      <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">Primary Direction <span className="text-destructive">Required</span></legend><p className="mt-1 text-sm text-muted-foreground">Choose the single best fit.</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{detail.directionOptions.map((option) => <label className={cn('cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring', primary === option.directionId && 'border-primary bg-primary/5')} key={option.directionId}><span className="flex items-start gap-3"><input aria-label={`Primary ${directionLabel(option, locale)}`} checked={primary === option.directionId} className="mt-1" name="primary-direction" onChange={() => choosePrimary(option.directionId)} type="radio" /><span><span className="block text-sm font-medium">{directionLabel(option, locale)}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></span></label>)}</div></fieldset>
      <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">Secondary Directions <span className="font-normal text-muted-foreground">Optional, up to two</span></legend><p className="mt-1 text-sm text-muted-foreground">Secondary choices remain ordered in the order selected.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{detail.directionOptions.map((option) => { const checked = secondary.includes(option.directionId); const disabled = option.directionId === primary || (!checked && secondary.length >= 2); return <label className={cn('flex items-center gap-3 rounded-xl border px-3 py-3 text-sm', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', checked && 'border-primary bg-primary/5')} key={option.directionId}><input aria-label={`Secondary ${directionLabel(option, locale)}`} checked={checked} disabled={disabled} onChange={() => toggleSecondary(option.directionId)} type="checkbox" /><span>{directionLabel(option, locale)}</span></label>; })}</div></fieldset>
      <div className="grid gap-3 rounded-xl bg-muted/35 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Draft review</p><p className="mt-1 font-medium">{detail.draft ? 'Draft author recorded' : 'Not started'}</p>{detail.draft ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.draft.updatedAt}>{formatReviewTime(detail.draft.updatedAt)}</time> : null}</div><div><p className="text-xs text-muted-foreground">Final review</p><p className="mt-1 font-medium">{detail.finalDecision ? 'Final reviewer recorded' : 'Not finalized'}</p>{detail.finalDecision ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.finalDecision.reviewedAt}>{formatReviewTime(detail.finalDecision.reviewedAt)}</time> : null}</div></div>
      {error && !confirming ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
      {notice ? <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300" role="status"><CheckCircle2 className="size-4" />{notice}</p> : null}
      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button disabled={!editable || !primary || Boolean(busy)} onClick={() => void save()} type="button" variant="outline">{busy === 'save' ? <Loader2 className="animate-spin" /> : null}{pendingDraft ? 'Retry save' : 'Save draft'}</Button><Button disabled={!editable || !detail.draft || !selectionPersisted || Boolean(busy)} onClick={() => { setError(null); setConfirming(true); }} ref={finalizeTriggerRef} type="button">Review final decision</Button></div>
    </div>
    {confirming ? <FinalizeDialog busy={busy === 'finalize'} detail={detail} error={error} labels={labels} onCancel={() => { if (!busy) { setConfirming(false); setError(null); } }} onConfirm={() => void finalize()} triggerRef={finalizeTriggerRef} /> : null}
  </section>;
}

function DecisionSummary({ record, labels }: { record: DreamCareerPhase1ReviewQueueItem; labels: Map<string, string> }) {
  const decision = recordDecision(record, labels);
  return decision ? <div className="space-y-1 text-xs"><p><span className="text-muted-foreground">Primary:</span> {decision.primary}</p><p><span className="text-muted-foreground">Secondaries:</span> {decision.secondary.length ? decision.secondary.join(', ') : 'None'}</p><p className="text-muted-foreground">Version {record.version}</p></div> : <div className="space-y-1 text-xs"><p className="text-muted-foreground">Not started</p><p className="text-muted-foreground">Version {record.version}</p></div>;
}

export default function DreamCareerPhase1ReviewPage() {
  const { locale } = useTranslations();
  const [queue, setQueue] = useState<DreamCareerPhase1ReviewQueue | null>(null);
  const [summary, setSummary] = useState<DreamCareerPhase1ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [blocked, setBlocked] = useState('all');
  const [detail, setDetail] = useState<DreamCareerPhase1ReviewDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<DreamCareerPhase1AuthorityArtifact | null>(null);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true; setLoading(true); setError(null); setQueue(null); setSummary(null); setDetail(null);
    Promise.all([dreamCareerPhase1ReviewApi.listQueue(), dreamCareerPhase1ReviewApi.getComplete()])
      .then(([queueValue, summaryValue]) => { if (active) { const integrity = queueIntegrityError(queueValue, summaryValue); if (integrity) throw new Error(integrity); setQueue(queueValue); setSummary(summaryValue); } })
      .catch((caught) => { if (active) setError(errorMessage(caught, 'Unable to load the authenticated review queue.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const labels = useMemo(() => new Map(queue?.directionOptions.map((option) => [option.directionId, directionLabel(option, locale)]) ?? []), [locale, queue]);
  const visible = useMemo(() => queue?.records.filter((record) => {
    const textValue = `${record.careerId} ${record.careerDisplay?.title ?? ''} ${record.careerDisplay?.sourcePath ?? ''}`.toLowerCase();
    const isBlocked = record.sourceBinding.blockers.length > 0;
    return (!search.trim() || textValue.includes(search.trim().toLowerCase())) && (status === 'all' || record.status === status) && (source === 'all' || record.sourceBinding.status === source) && (blocked === 'all' || (blocked === 'blocked') === isBlocked);
  }) ?? [], [blocked, queue, search, source, status]);
  const eligible = Boolean(summary && summary.blockers.length === 0);

  const open = useCallback(async (record: DreamCareerPhase1ReviewQueueItem) => {
    setDetailLoading(record.careerId); setError(null);
    try { setDetail(await dreamCareerPhase1ReviewApi.getDetail(record.careerId)); }
    catch (caught) { setError(errorMessage(caught, 'Unable to load the persisted review detail.')); }
    finally { setDetailLoading(null); }
  }, []);
  const persisted = async (readback: DreamCareerPhase1ReviewDetail) => {
    setDetail(readback); setQueue((current) => current ? { ...current, records: current.records.map((record) => record.careerId === readback.careerId ? readback : record) } : current);
    setSummary(null); setError(null);
    try { setSummary(await dreamCareerPhase1ReviewApi.getComplete()); }
    catch (caught) { setError(errorMessage(caught, 'Decision persisted, but the server completion summary could not be verified. Exports remain unavailable.')); }
  };
  const runExport = async (kind: 'mapping' | 'taxonomy') => {
    setExportBusy(kind); setExportError(null); setArtifact(null);
    try { setArtifact(kind === 'mapping' ? await dreamCareerPhase1ReviewApi.exportFutureDirections() : await dreamCareerPhase1ReviewApi.exportTaxonomyRejection()); }
    catch (caught) { setExportError(errorMessage(caught, 'Authority export failed.')); }
    finally { setExportBusy(null); }
  };

  const filters = <div className="flex flex-wrap items-center gap-3 border-b p-4"><div className="relative min-w-56 flex-1 sm:max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search careers" className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search title, career ID, or source path" role="searchbox" value={search} /></div><select aria-label="Filter by review status" className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="pending">Not started</option><option value="draft">Draft</option><option value="finalized">Finalized</option></select><select aria-label="Filter by source state" className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setSource(event.target.value)} value={source}><option value="all">All source states</option><option value="current">Current</option><option value="stale">Stale</option><option value="mismatch">Mismatch</option></select><select aria-label="Filter by blocked state" className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setBlocked(event.target.value)} value={blocked}><option value="all">All blocker states</option><option value="blocked">Blocked</option><option value="unblocked">Unblocked</option></select><p className="ml-auto text-xs text-muted-foreground" role="status">{visible.length} of {queue?.records.length ?? 0}</p></div>;

  return <div className="h-full overflow-y-auto bg-muted/20"><div className="mx-auto max-w-[110rem] space-y-5 p-4 sm:p-6 lg:p-8"><header><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">Dream Career Phase 1 review</h1><Badge variant="secondary">Human review required</Badge></div><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Review the server-bound Future Direction decisions for all 229 canonical careers. Drafts are resumable; finalization requires a different authenticated reviewer.</p></header>
    {loading ? <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border bg-background text-sm text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" />Loading authenticated review queue…</div> : error && (!queue || !summary) ? <div className="rounded-2xl border border-destructive/30 bg-background p-6" role="alert"><p className="font-semibold text-destructive">Review queue unavailable</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => setReload((value) => value + 1)} type="button" variant="outline"><RefreshCw />Retry queue</Button></div> : queue && summary ? <>
      <section aria-label="Review counts" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="region">{([['Total', summary.counts.total], ['Not started', summary.counts.pending], ['Draft', summary.counts.draft], ['Finalized', summary.counts.finalized]] as const).map(([label, value]) => <Card className="gap-1 py-4 shadow-none" key={label}><CardHeader className="px-4"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card>)}</section>
      {summary.blockers.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="status"><span className="font-semibold">Export blocked by server completion summary:</span> <span className="font-mono text-xs">{summary.blockers.join(', ')}</span></div> : null}
      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{error}</div> : null}
      {detail ? <DecisionEditor detail={detail} locale={locale} onClose={() => setDetail(null)} onPersisted={persisted} /> : null}
      <section aria-label="Career review queue" className="overflow-hidden rounded-2xl border bg-background">{filters}
        <div className="hidden max-h-[48rem] overflow-auto md:block"><table className="w-full min-w-[70rem] text-sm"><thead className="sticky top-0 z-10 bg-muted/95 text-left backdrop-blur"><tr><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Career and source</th><th className="px-4 py-3 font-medium">Decision</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Source binding and blockers</th><th className="px-4 py-3 font-medium">Recorded review</th><th className="px-4 py-3 font-medium"><span className="sr-only">Action</span></th></tr></thead><tbody>{visible.map((record) => <tr className="border-t align-top" data-testid={`desktop-career-${record.careerId}`} key={record.careerId}><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.canonicalOrder + 1}</td><td className="max-w-md px-4 py-3"><p className="font-medium">{record.careerDisplay?.title ?? 'Canonical display unavailable'}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{record.careerId}</p><p className="mt-1 break-all text-xs text-muted-foreground">{record.careerDisplay?.sourcePath ?? 'Source path unavailable'}</p></td><td className="px-4 py-3"><DecisionSummary labels={labels} record={record} /></td><td className="px-4 py-3"><StatusBadge status={record.status} /></td><td className="px-4 py-3"><SourceBadge record={record} />{record.sourceBinding.blockers.length ? <p className="mt-2 max-w-52 break-all font-mono text-[0.7rem] text-amber-800 dark:text-amber-300">{record.sourceBinding.blockers.join(', ')} · {record.sourceBinding.mismatchFields.join(', ')}</p> : <p className="mt-2 text-xs text-muted-foreground">No blockers</p>}</td><td className="px-4 py-3"><RecordedReview record={record} /></td><td className="px-4 py-3 text-right"><Button aria-label={`Review ${record.careerDisplay?.title ?? record.careerId}`} disabled={detailLoading === record.careerId} onClick={() => void open(record)} size="sm" type="button" variant="outline">{detailLoading === record.careerId ? <Loader2 className="animate-spin" /> : null}Review</Button></td></tr>)}</tbody></table></div>
        <div className="divide-y md:hidden" data-testid="compact-career-list">{visible.map((record) => <article className="space-y-3 p-4" data-testid={`compact-career-${record.careerId}`} key={record.careerId}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{record.careerDisplay?.title ?? 'Canonical display unavailable'}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{record.careerId} · Version {record.version}</p></div><StatusBadge status={record.status} /></div><p className="break-all text-xs text-muted-foreground">{record.careerDisplay?.sourcePath ?? 'Source path unavailable'}</p><DecisionSummary labels={labels} record={record} /><div className="flex flex-wrap items-center gap-2"><SourceBadge record={record} />{record.sourceBinding.blockers.length ? <span className="break-all font-mono text-[0.7rem] text-amber-800 dark:text-amber-300">{record.sourceBinding.blockers.join(', ')}</span> : <span className="text-xs text-muted-foreground">No blockers</span>}</div><RecordedReview record={record} /><Button aria-label={`Review ${record.careerDisplay?.title ?? record.careerId} compact`} className="w-full" disabled={detailLoading === record.careerId} onClick={() => void open(record)} type="button" variant="outline">{detailLoading === record.careerId ? <Loader2 className="animate-spin" /> : null}Review career</Button></article>)}</div>
        {visible.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No careers match these filters.</div> : null}
      </section>
      <section className="grid gap-4 lg:grid-cols-2"><Card aria-label="Taxonomy rejection acknowledgement" className="shadow-none" role="region"><CardHeader><CardTitle>Taxonomy rejection acknowledgement</CardTitle><CardDescription>The frozen source contains one malformed legacy assignment.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><dl className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Career</dt><dd className="font-mono">language-policy-officer</dd></div><div><dt className="text-xs text-muted-foreground">Family</dt><dd className="font-mono">traits</dd></div><div><dt className="text-xs text-muted-foreground">Category</dt><dd className="font-mono">traitIds</dd></div><div><dt className="text-xs text-muted-foreground">Raw value</dt><dd className="font-mono">ytical</dd></div><div><dt className="text-xs text-muted-foreground">Assignment count</dt><dd className="font-mono">1</dd></div><div><dt className="text-xs text-muted-foreground">Tag ID</dt><dd className="font-mono">null</dd></div><div><dt className="text-xs text-muted-foreground">Disposition</dt><dd className="font-mono">rejected</dd></div></dl><p className="leading-6 text-muted-foreground">The malformed raw value is omitted, not corrected to analytical. This acknowledgement does not invent a replacement tag.</p></CardContent></Card><Card className="border-amber-300 shadow-none dark:border-amber-800"><CardHeader><CardTitle>Final release remains blocked</CardTitle><CardDescription>Accepted-college release authority and final release acceptance are outside this Phase 1 review.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">This interface cannot create, edit, or imply either authority. They remain blocked until separate server-authoritative workflows and persisted readback exist.</p></CardContent></Card></section>
      {eligible ? <section className="rounded-2xl border bg-background p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Authority exports</h2><p className="mt-1 text-sm text-muted-foreground">The server completion summary reports this review eligible for export.</p></div><div className="flex flex-wrap gap-2"><Button aria-label="Export Future Direction mapping" disabled={Boolean(exportBusy)} onClick={() => void runExport('mapping')} type="button" variant="outline">{exportBusy === 'mapping' ? <Loader2 className="animate-spin" /> : <Download />}Export mapping</Button><Button aria-label="Export taxonomy rejection" disabled={Boolean(exportBusy)} onClick={() => void runExport('taxonomy')} type="button" variant="outline">{exportBusy === 'taxonomy' ? <Loader2 className="animate-spin" /> : <Download />}Export taxonomy rejection</Button></div></div>{exportError ? <p className="mt-4 text-sm text-destructive" role="alert">{exportError}</p> : null}{artifact ? <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">{artifact.filename}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">SHA-256 {artifact.artifactSha256}</p></div><Button aria-label={`Download ${artifact.artifactJson.length} authoritative bytes`} onClick={() => downloadAuthorityArtifact(artifact)} size="sm" type="button" variant="outline"><Download />Download authoritative file</Button></div><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">{artifact.artifactJson}</pre></div> : null}</section> : null}
    </> : null}
  </div></div>;
}

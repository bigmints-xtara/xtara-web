'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { canPublishContent, resolveAdminRole } from '@/lib/admin-access';
import {
  createDraftReviewCommand,
  createFinalizeReviewCommand,
  downloadAuthorityArtifact,
  dreamCareerPhase1ReviewApi,
  isDreamCareerPhase1ReviewComplete,
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
type ReviewTranslate = (key: string, vars?: Record<string, string | number>) => string;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function idempotencyKey(action: 'draft' | 'finalize', careerId: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `phase1-${action}-${careerId}-${random}`;
}

function queueIntegrityError(queue: DreamCareerPhase1ReviewQueue, summary: DreamCareerPhase1ReviewSummary, text: ReviewTranslate): string | null {
  if (queue.expectedTotal !== EXPECTED_TOTAL || queue.records.length !== EXPECTED_TOTAL) return text('errors.integrityCount', { expected: EXPECTED_TOTAL, received: queue.records.length });
  if (queue.reviewId !== summary.reviewId || queue.expectedTotal !== summary.expectedTotal) return text('errors.integrityIdentity');
  if (queue.directionOptions.length !== 6 || new Set(queue.directionOptions.map((item) => item.directionId)).size !== 6 || queue.directionOptions.some((item, index) => item.canonicalOrder !== index)) return text('errors.integrityDirections');
  if (queue.records.some((record, index) => record.canonicalOrder !== index)) return text('errors.integrityOrder');
  return null;
}

function directionLabel(option: DreamCareerPhase1DirectionOption, locale: string): string {
  if (locale === 'ml' || locale === 'ta') return option.localizedLabels[locale];
  return option.localizedLabels.en || option.label;
}

function formatReviewTime(value: string, locale: string, unavailable: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? unavailable : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function StatusBadge({ status, text }: { status: DreamCareerPhase1ReviewQueueItem['status']; text: ReviewTranslate }) {
  const styles = status === 'finalized'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
    : status === 'draft'
      ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
      : '';
  return <Badge className={styles} variant="outline">{text(`status.${status}`)}</Badge>;
}

function SourceBadge({ record, text }: { record: DreamCareerPhase1ReviewQueueItem; text: ReviewTranslate }) {
  const current = record.sourceBinding.status === 'current';
  return <Badge className={cn(current ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-100' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200')} variant="outline">{text('source.badge', { status: text(`source.${record.sourceBinding.status}`) })}</Badge>;
}

function recordDecision(record: DreamCareerPhase1ReviewQueueItem, labels: Map<string, string>) {
  const ids = record.finalDecision?.futureDirectionIds ?? (record.draft ? [record.draft.primaryDirectionId, ...record.draft.secondaryDirectionIds] : []);
  return ids.length ? { primary: labels.get(ids[0]) ?? ids[0], secondary: ids.slice(1).map((id) => labels.get(id) ?? id) } : null;
}

function RecordedReview({ record, locale, text }: { record: DreamCareerPhase1ReviewQueueItem; locale: string; text: ReviewTranslate }) {
  if (record.status === 'pending') return <p className="text-muted-foreground">{text('status.pending')}</p>;
  return <div className="space-y-2 text-xs"><div><p>{text(record.draft ? 'review.draftRecorded' : 'review.noDraftAuthor')}</p>{record.draft ? <time className="text-muted-foreground" dateTime={record.draft.updatedAt}>{formatReviewTime(record.draft.updatedAt, locale, text('review.timeUnavailable'))}</time> : null}</div><div><p>{text(record.finalDecision ? 'review.finalRecorded' : 'review.notFinalized')}</p>{record.finalDecision ? <time className="text-muted-foreground" dateTime={record.finalDecision.reviewedAt}>{formatReviewTime(record.finalDecision.reviewedAt, locale, text('review.timeUnavailable'))}</time> : null}</div></div>;
}

function FinalizeDialog({ detail, labels, busy, error, triggerRef, fallbackFocusRef, text, onCancel, onConfirm }: {
  detail: DreamCareerPhase1ReviewDetail; labels: Map<string, string>; busy: boolean; error: string | null;
  triggerRef: React.RefObject<HTMLButtonElement | null>; fallbackFocusRef: React.RefObject<HTMLElement | null>;
  text: ReviewTranslate; onCancel: () => void; onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger = triggerRef.current;
    const fallbackFocus = fallbackFocusRef.current;
    const backgrounds = Array.from(document.body.children).filter((element) => !element.hasAttribute('data-phase1-dialog-root')) as HTMLElement[];
    const previous = backgrounds.map((element) => ({ element, ariaHidden: element.getAttribute('aria-hidden'), inert: element.inert }));
    backgrounds.forEach((element) => { element.setAttribute('aria-hidden', 'true'); element.inert = true; });
    cancelRef.current?.focus();
    return () => {
      previous.forEach(({ element, ariaHidden, inert }) => { if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden); element.inert = inert; });
      if (trigger?.isConnected && !trigger.disabled) trigger.focus();
      else fallbackFocus?.focus();
    };
  }, [fallbackFocusRef, triggerRef]);
  useEffect(() => { if (busy) dialogRef.current?.focus(); }, [busy]);
  const primary = detail.draft?.primaryDirectionId;
  const secondary = detail.draft?.secondaryDirectionIds ?? [];
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    if (!focusable.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey
      ? focusable[index <= 0 ? focusable.length - 1 : index - 1]
      : focusable[index >= focusable.length - 1 ? 0 : index + 1];
    event.preventDefault();
    next.focus();
  };
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" data-phase1-dialog-root="true">
      <button aria-label={text('dialog.close')} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" disabled={busy} onClick={onCancel} tabIndex={-1} type="button" />
      <div aria-describedby="phase1-finalize-description" aria-labelledby="phase1-finalize-title" aria-modal="true" className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background p-5 shadow-2xl sm:p-6" onKeyDown={onKeyDown} ref={dialogRef} role="dialog" tabIndex={-1}>
        <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" /><div><h2 className="text-lg font-semibold" id="phase1-finalize-title">{text('dialog.title')}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground" id="phase1-finalize-description">{text('dialog.description')}</p></div></div>
        <dl className="mt-5 grid gap-3 rounded-xl border bg-muted/25 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">{text('dialog.career')}</dt><dd className="mt-1 font-medium">{detail.careerDisplay?.title ?? text('common.displayUnavailable')}</dd><dd className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{detail.careerId}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{text('dialog.reviewIdentity')}</dt><dd className="mt-1 font-medium">{text('common.version', { version: detail.version })}</dd><dd className="mt-0.5 break-all text-xs text-muted-foreground">{detail.careerDisplay?.inventoryVersion}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{text('editor.primary')}</dt><dd className="mt-1 font-medium">{primary ? labels.get(primary) : text('common.unavailable')}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{text('editor.secondary')}</dt><dd className="mt-1 font-medium">{secondary.length ? secondary.map((id) => labels.get(id) ?? id).join(', ') : text('common.none')}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">{text('dialog.currentSource')}</dt><dd className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.sourcePath ?? text('common.unavailable')}</dd><dd className="mt-1 break-all font-mono text-xs text-muted-foreground">{detail.careerDisplay?.releaseId ?? text('common.unavailable')}</dd></div>
        </dl>
        {error ? <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button disabled={busy} onClick={onCancel} ref={cancelRef} type="button" variant="outline">{text('dialog.cancel')}</Button><Button disabled={busy} onClick={onConfirm} type="button" variant="destructive">{busy ? <Loader2 className="animate-spin" /> : <ShieldAlert />}{text('dialog.confirm')}</Button></div>
      </div>
    </div>, document.body,
  );
}

function DecisionEditor({ detail, locale, publishCapable, fallbackFocusRef, text, onClose, onPersisted }: {
  detail: DreamCareerPhase1ReviewDetail; locale: string; publishCapable: boolean;
  fallbackFocusRef: React.RefObject<HTMLElement | null>; text: ReviewTranslate;
  onClose: () => void; onPersisted: (detail: DreamCareerPhase1ReviewDetail) => Promise<void>;
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
    if (!primary) { setError(text('editor.choosePrimaryError')); return; }
    const command = pendingDraft ?? createDraftReviewCommand(detail, primary, secondary, idempotencyKey('draft', detail.careerId));
    setPendingDraft(command); setBusy('save'); setError(null); setNotice(null);
    try { const readback = await dreamCareerPhase1ReviewApi.saveDraft(command); setPendingDraft(null); await onPersisted(readback); setNotice(text('editor.draftConfirmed')); }
    catch (caught) { setError(errorMessage(caught, text('editor.saveError'))); }
    finally { setBusy(null); }
  };
  const finalize = async () => {
    const command = pendingFinalize ?? createFinalizeReviewCommand(detail, idempotencyKey('finalize', detail.careerId));
    setPendingFinalize(command); setBusy('finalize'); setError(null);
    try { const readback = await dreamCareerPhase1ReviewApi.finalize(command); setPendingFinalize(null); await onPersisted(readback); setConfirming(false); setNotice(text('editor.finalizeConfirmed')); }
    catch (caught) { setError(errorMessage(caught, text('editor.finalizeError'))); }
    finally { setBusy(null); }
  };
  return <section aria-label={text('editor.region')} className="rounded-2xl border bg-background shadow-sm" role="region">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{detail.careerDisplay?.title ?? text('common.displayUnavailable')}</h2><StatusBadge status={detail.status} text={text} /><SourceBadge record={detail} text={text} /></div><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{detail.careerId}</p></div><Button aria-label={text('editor.close')} onClick={onClose} size="icon-sm" type="button" variant="ghost"><X /></Button></div>
    <div className="space-y-5 p-4 sm:p-5">
      <Card className="py-0 shadow-none"><CardContent className="grid gap-4 p-4 text-sm lg:grid-cols-3"><div><p className="text-xs text-muted-foreground">{text('editor.canonicalSource')}</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.sourcePath ?? text('common.unavailable')}</p></div><div><p className="text-xs text-muted-foreground">{text('editor.release')}</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.releaseId ?? text('common.unavailable')}</p></div><div><p className="text-xs text-muted-foreground">{text('editor.currentRecord')}</p><p className="mt-1">{text('editor.versionSource', { version: detail.version, status: text(`source.${detail.sourceBinding.status}`) })}</p></div>{detail.careerDisplay?.description ? <p className="leading-6 text-muted-foreground lg:col-span-3">{detail.careerDisplay.description}</p> : null}</CardContent></Card>
      {!sourceCurrent || !exactDirections ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><p className="font-semibold">{text('editor.locked')}</p><p className="mt-1">{!exactDirections ? text('editor.invalidDirections') : text('editor.sourceBinding', { status: text(`source.${detail.sourceBinding.status}`) })}</p>{detail.sourceBinding.blockers.length ? <p className="mt-2 break-all font-mono text-xs">{detail.sourceBinding.blockers.join(', ')}{detail.sourceBinding.mismatchFields.length ? ` · ${detail.sourceBinding.mismatchFields.join(', ')}` : ''}</p> : null}</div> : null}
      <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">{text('editor.primary')} <span className="text-destructive">{text('editor.required')}</span></legend><p className="mt-1 text-sm text-muted-foreground">{text('editor.primaryHelp')}</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{detail.directionOptions.map((option) => <label className={cn('cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring', primary === option.directionId && 'border-primary bg-primary/5')} key={option.directionId}><span className="flex items-start gap-3"><input aria-label={text('editor.primaryOption', { label: directionLabel(option, locale) })} checked={primary === option.directionId} className="mt-1" name="primary-direction" onChange={() => choosePrimary(option.directionId)} type="radio" /><span><span className="block text-sm font-medium">{directionLabel(option, locale)}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></span></label>)}</div></fieldset>
      <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">{text('editor.secondary')} <span className="font-normal text-muted-foreground">{text('editor.secondaryLimit')}</span></legend><p className="mt-1 text-sm text-muted-foreground">{text('editor.secondaryHelp')}</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{detail.directionOptions.map((option) => { const checked = secondary.includes(option.directionId); const disabled = option.directionId === primary || (!checked && secondary.length >= 2); return <label className={cn('flex items-center gap-3 rounded-xl border px-3 py-3 text-sm', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', checked && 'border-primary bg-primary/5')} key={option.directionId}><input aria-label={text('editor.secondaryOption', { label: directionLabel(option, locale) })} checked={checked} disabled={disabled} onChange={() => toggleSecondary(option.directionId)} type="checkbox" /><span>{directionLabel(option, locale)}</span></label>; })}</div></fieldset>
      <div className="grid gap-3 rounded-xl bg-muted/35 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">{text('review.draftReview')}</p><p className="mt-1 font-medium">{text(detail.draft ? 'review.draftRecorded' : 'status.pending')}</p>{detail.draft ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.draft.updatedAt}>{formatReviewTime(detail.draft.updatedAt, locale, text('review.timeUnavailable'))}</time> : null}</div><div><p className="text-xs text-muted-foreground">{text('review.finalReview')}</p><p className="mt-1 font-medium">{text(detail.finalDecision ? 'review.finalRecorded' : 'review.notFinalized')}</p>{detail.finalDecision ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.finalDecision.reviewedAt}>{formatReviewTime(detail.finalDecision.reviewedAt, locale, text('review.timeUnavailable'))}</time> : null}</div></div>
      {error && !confirming ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
      {notice ? <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300" role="status"><CheckCircle2 className="size-4" />{notice}</p> : null}
      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button disabled={!editable || !primary || Boolean(busy)} onClick={() => void save()} type="button" variant="outline">{busy === 'save' ? <Loader2 className="animate-spin" /> : null}{text(pendingDraft ? 'editor.retrySave' : 'editor.saveDraft')}</Button>{publishCapable ? <Button disabled={!editable || !detail.draft || !selectionPersisted || Boolean(busy)} onClick={() => { setError(null); setConfirming(true); }} ref={finalizeTriggerRef} type="button">{text('editor.reviewFinal')}</Button> : null}</div>
    </div>
    {confirming ? <FinalizeDialog busy={busy === 'finalize'} detail={detail} error={error} fallbackFocusRef={fallbackFocusRef} labels={labels} onCancel={() => { if (!busy) { setConfirming(false); setError(null); } }} onConfirm={() => void finalize()} text={text} triggerRef={finalizeTriggerRef} /> : null}
  </section>;
}

function DecisionSummary({ record, labels, text }: { record: DreamCareerPhase1ReviewQueueItem; labels: Map<string, string>; text: ReviewTranslate }) {
  const decision = recordDecision(record, labels);
  return decision ? <div className="space-y-1 text-xs"><p><span className="text-muted-foreground">{text('decision.primary')}</span> {decision.primary}</p><p><span className="text-muted-foreground">{text('decision.secondaries')}</span> {decision.secondary.length ? decision.secondary.join(', ') : text('common.none')}</p><p className="text-muted-foreground">{text('common.version', { version: record.version })}</p></div> : <div className="space-y-1 text-xs"><p className="text-muted-foreground">{text('status.pending')}</p><p className="text-muted-foreground">{text('common.version', { version: record.version })}</p></div>;
}

export default function DreamCareerPhase1ReviewPage() {
  const { userProfile } = useAuth();
  const { locale, t } = useTranslations();
  const text = useCallback<ReviewTranslate>((key, vars) => t(`admin.dreamCareerPhase1Review.${key}`, vars), [t]);
  const textRef = useRef(text);
  textRef.current = text;
  const publishCapable = canPublishContent(resolveAdminRole(userProfile));
  const headingRef = useRef<HTMLHeadingElement>(null);
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
      .then(([queueValue, summaryValue]) => { if (active) { const integrity = queueIntegrityError(queueValue, summaryValue, textRef.current); if (integrity) throw new Error(integrity); setQueue(queueValue); setSummary(summaryValue); } })
      .catch((caught) => { if (active) setError(errorMessage(caught, textRef.current('errors.loadQueue'))); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const labels = useMemo(() => new Map(queue?.directionOptions.map((option) => [option.directionId, directionLabel(option, locale)]) ?? []), [locale, queue]);
  const visible = useMemo(() => queue?.records.filter((record) => {
    const textValue = `${record.careerId} ${record.careerDisplay?.title ?? ''} ${record.careerDisplay?.sourcePath ?? ''}`.toLowerCase();
    const isBlocked = record.sourceBinding.blockers.length > 0;
    return (!search.trim() || textValue.includes(search.trim().toLowerCase())) && (status === 'all' || record.status === status) && (source === 'all' || record.sourceBinding.status === source) && (blocked === 'all' || (blocked === 'blocked') === isBlocked);
  }) ?? [], [blocked, queue, search, source, status]);
  const eligible = Boolean(publishCapable && summary && isDreamCareerPhase1ReviewComplete(summary));

  const open = useCallback(async (record: DreamCareerPhase1ReviewQueueItem) => {
    setDetailLoading(record.careerId); setError(null);
    try { setDetail(await dreamCareerPhase1ReviewApi.getDetail(record.careerId)); }
    catch (caught) { setError(errorMessage(caught, text('errors.loadDetail'))); }
    finally { setDetailLoading(null); }
  }, [text]);
  const persisted = async (readback: DreamCareerPhase1ReviewDetail) => {
    setDetail(readback); setQueue((current) => current ? { ...current, records: current.records.map((record) => record.careerId === readback.careerId ? readback : record) } : current);
    setSummary(null); setError(null);
    try { setSummary(await dreamCareerPhase1ReviewApi.getComplete()); }
    catch (caught) { setError(errorMessage(caught, text('errors.summaryReadback'))); }
  };
  const runExport = async (kind: 'mapping' | 'taxonomy') => {
    setExportBusy(kind); setExportError(null); setArtifact(null);
    try { setArtifact(kind === 'mapping' ? await dreamCareerPhase1ReviewApi.exportFutureDirections() : await dreamCareerPhase1ReviewApi.exportTaxonomyRejection()); }
    catch (caught) { setExportError(errorMessage(caught, text('errors.export'))); }
    finally { setExportBusy(null); }
  };

  const filters = <div className="flex flex-wrap items-center gap-3 border-b p-4">
    <div className="relative min-w-56 flex-1 sm:max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label={text('filters.searchLabel')} className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder={text('filters.searchPlaceholder')} role="searchbox" value={search} /></div>
    <select aria-label={text('filters.statusLabel')} className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">{text('filters.allStatuses')}</option><option value="pending">{text('status.pending')}</option><option value="draft">{text('status.draft')}</option><option value="finalized">{text('status.finalized')}</option></select>
    <select aria-label={text('filters.sourceLabel')} className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setSource(event.target.value)} value={source}><option value="all">{text('filters.allSources')}</option><option value="current">{text('source.current')}</option><option value="stale">{text('source.stale')}</option><option value="mismatch">{text('source.mismatch')}</option></select>
    <select aria-label={text('filters.blockedLabel')} className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setBlocked(event.target.value)} value={blocked}><option value="all">{text('filters.allBlockers')}</option><option value="blocked">{text('filters.blocked')}</option><option value="unblocked">{text('filters.unblocked')}</option></select>
    <p className="ml-auto text-xs text-muted-foreground" role="status">{text('filters.resultCount', { visible: visible.length, total: queue?.records.length ?? 0 })}</p>
  </div>;

  return <div className="h-full overflow-y-auto bg-muted/20"><div className="mx-auto max-w-[110rem] space-y-5 p-4 sm:p-6 lg:p-8"><header><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight" ref={headingRef} tabIndex={-1}>{text('title')}</h1><Badge variant="secondary">{text('badge')}</Badge></div><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{text('intro')}</p></header>
    {loading ? <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border bg-background text-sm text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" />{text('loading')}</div> : error && (!queue || !summary) ? <div className="rounded-2xl border border-destructive/30 bg-background p-6" role="alert"><p className="font-semibold text-destructive">{text('unavailable')}</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => setReload((value) => value + 1)} type="button" variant="outline"><RefreshCw />{text('retry')}</Button></div> : queue && summary ? <>
      <section aria-label={text('counts.region')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="region">{([['counts.total', summary.counts.total], ['status.pending', summary.counts.pending], ['status.draft', summary.counts.draft], ['status.finalized', summary.counts.finalized]] as const).map(([key, value]) => <Card className="gap-1 py-4 shadow-none" key={key}><CardHeader className="px-4"><CardDescription>{text(key)}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card>)}</section>
      {summary.blockers.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="status"><span className="font-semibold">{text('counts.exportBlocked')}</span> <span className="font-mono text-xs">{summary.blockers.join(', ')}</span></div> : null}
      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{error}</div> : null}
      {detail ? <DecisionEditor detail={detail} fallbackFocusRef={headingRef} locale={locale} onClose={() => setDetail(null)} onPersisted={persisted} publishCapable={publishCapable} text={text} /> : null}
      <section aria-label={text('queue.region')} className="overflow-hidden rounded-2xl border bg-background">{filters}
        <div className="hidden max-h-[48rem] overflow-auto md:block"><table className="w-full min-w-[70rem] text-sm"><thead className="sticky top-0 z-10 bg-muted/95 text-left backdrop-blur"><tr>{['order', 'career', 'decision', 'status', 'binding', 'recorded'].map((key) => <th className="px-4 py-3 font-medium" key={key}>{text(`queue.${key}`)}</th>)}<th className="px-4 py-3 font-medium"><span className="sr-only">{text('queue.action')}</span></th></tr></thead><tbody>{visible.map((record) => <tr className="border-t align-top" data-testid={`desktop-career-${record.careerId}`} key={record.careerId}><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.canonicalOrder + 1}</td><td className="max-w-md px-4 py-3"><p className="font-medium">{record.careerDisplay?.title ?? text('common.displayUnavailable')}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{record.careerId}</p><p className="mt-1 break-all text-xs text-muted-foreground">{record.careerDisplay?.sourcePath ?? text('common.sourcePathUnavailable')}</p></td><td className="px-4 py-3"><DecisionSummary labels={labels} record={record} text={text} /></td><td className="px-4 py-3"><StatusBadge status={record.status} text={text} /></td><td className="px-4 py-3"><SourceBadge record={record} text={text} />{record.sourceBinding.blockers.length ? <p className="mt-2 max-w-52 break-all font-mono text-[0.7rem] text-amber-800 dark:text-amber-300">{record.sourceBinding.blockers.join(', ')}{record.sourceBinding.mismatchFields.length ? ` · ${record.sourceBinding.mismatchFields.join(', ')}` : ''}</p> : <p className="mt-2 text-xs text-muted-foreground">{text('queue.noBlockers')}</p>}</td><td className="px-4 py-3"><RecordedReview locale={locale} record={record} text={text} /></td><td className="px-4 py-3 text-right"><Button aria-label={text('queue.reviewAria', { title: record.careerDisplay?.title ?? record.careerId })} disabled={detailLoading === record.careerId} onClick={() => void open(record)} size="sm" type="button" variant="outline">{detailLoading === record.careerId ? <Loader2 className="animate-spin" /> : null}{text('queue.review')}</Button></td></tr>)}</tbody></table></div>
        <div className="divide-y md:hidden" data-testid="compact-career-list">{visible.map((record) => <article className="space-y-3 p-4" data-testid={`compact-career-${record.careerId}`} key={record.careerId}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{record.careerDisplay?.title ?? text('common.displayUnavailable')}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{record.careerId}</p></div><StatusBadge status={record.status} text={text} /></div><p className="break-all text-xs text-muted-foreground">{record.careerDisplay?.sourcePath ?? text('common.sourcePathUnavailable')}</p><DecisionSummary labels={labels} record={record} text={text} /><div className="flex flex-wrap items-center gap-2"><SourceBadge record={record} text={text} />{record.sourceBinding.blockers.length ? <span className="break-all font-mono text-[0.7rem] text-amber-800 dark:text-amber-300">{record.sourceBinding.blockers.join(', ')}{record.sourceBinding.mismatchFields.length ? ` · ${record.sourceBinding.mismatchFields.join(', ')}` : ''}</span> : <span className="text-xs text-muted-foreground">{text('queue.noBlockers')}</span>}</div><RecordedReview locale={locale} record={record} text={text} /><Button aria-label={text('queue.reviewCompactAria', { title: record.careerDisplay?.title ?? record.careerId })} className="w-full" disabled={detailLoading === record.careerId} onClick={() => void open(record)} type="button" variant="outline">{detailLoading === record.careerId ? <Loader2 className="animate-spin" /> : null}{text('queue.reviewCareer')}</Button></article>)}</div>
        {visible.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">{text('queue.empty')}</div> : null}
      </section>
      <section className="grid gap-4 lg:grid-cols-2"><Card aria-label={text('taxonomy.title')} className="shadow-none" role="region"><CardHeader><CardTitle>{text('taxonomy.title')}</CardTitle><CardDescription>{text('taxonomy.description')}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><dl className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">{([['career', 'language-policy-officer'], ['family', 'traits'], ['category', 'traitIds'], ['rawValue', 'ytical'], ['assignmentCount', '1'], ['tagId', 'null'], ['disposition', 'rejected']] as const).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{text(`taxonomy.${key}`)}</dt><dd className="font-mono">{value}</dd></div>)}</dl><p className="leading-6 text-muted-foreground">{text('taxonomy.note')}</p></CardContent></Card><Card className="border-amber-300 shadow-none dark:border-amber-800"><CardHeader><CardTitle>{text('release.title')}</CardTitle><CardDescription>{text('release.description')}</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{text('release.note')}</p></CardContent></Card></section>
      {eligible ? <section className="rounded-2xl border bg-background p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{text('exports.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{text('exports.description')}</p></div><div className="flex flex-wrap gap-2"><Button aria-label={text('exports.mappingAria')} disabled={Boolean(exportBusy)} onClick={() => void runExport('mapping')} type="button" variant="outline">{exportBusy === 'mapping' ? <Loader2 className="animate-spin" /> : <Download />}{text('exports.mapping')}</Button><Button aria-label={text('exports.taxonomyAria')} disabled={Boolean(exportBusy)} onClick={() => void runExport('taxonomy')} type="button" variant="outline">{exportBusy === 'taxonomy' ? <Loader2 className="animate-spin" /> : <Download />}{text('exports.taxonomy')}</Button></div></div>{exportError ? <p className="mt-4 text-sm text-destructive" role="alert">{exportError}</p> : null}{artifact ? <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">{artifact.filename}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">SHA-256 {artifact.artifactSha256}</p></div><Button aria-label={text('exports.downloadAria', { bytes: artifact.artifactJson.length })} onClick={() => downloadAuthorityArtifact(artifact)} size="sm" type="button" variant="outline"><Download />{text('exports.download')}</Button></div><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">{artifact.artifactJson}</pre></div> : null}</section> : null}
    </> : null}
  </div></div>;
}

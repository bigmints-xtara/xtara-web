'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/i18n/language-provider';
import {
  downloadServerAuthority,
  dreamCareerPhase1ReviewApi,
  type DreamCareerPhase1DirectionOption,
  type DreamCareerPhase1ReviewDetail,
  type DreamCareerPhase1ReviewQueue,
  type DreamCareerPhase1ReviewQueueItem,
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

function queueIntegrityError(queue: DreamCareerPhase1ReviewQueue): string | null {
  if (queue.expectedTotal !== EXPECTED_TOTAL || queue.counts.total !== EXPECTED_TOTAL || queue.records.length !== EXPECTED_TOTAL) {
    return `Review queue unavailable: expected ${EXPECTED_TOTAL} canonical careers but received ${queue.records.length}.`;
  }
  if (queue.directionOptions.length !== 6 || new Set(queue.directionOptions.map((item) => item.directionId)).size !== 6
      || queue.directionOptions.some((item, index) => item.canonicalOrder !== index)) {
    return 'Review queue unavailable: the server did not return exactly six canonical Direction choices.';
  }
  if (queue.records.some((record, index) => record.canonicalOrder !== index)) {
    return 'Review queue unavailable: canonical career order does not match the server contract.';
  }
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

function updateQueueRecord(queue: DreamCareerPhase1ReviewQueue, detail: DreamCareerPhase1ReviewDetail): DreamCareerPhase1ReviewQueue {
  const records = queue.records.map((record) => record.careerId === detail.careerId ? detail : record);
  return {
    ...queue,
    records,
    counts: {
      total: records.length,
      pending: records.filter((record) => record.status === 'pending').length,
      draft: records.filter((record) => record.status === 'draft').length,
      finalized: records.filter((record) => record.status === 'finalized').length,
    },
  };
}

function StatusBadge({ status }: { status: DreamCareerPhase1ReviewQueueItem['status'] }) {
  const styles = status === 'finalized'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
    : status === 'draft'
      ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
      : '';
  return <Badge className={styles} variant="outline">{status === 'finalized' ? 'Finalized' : status === 'draft' ? 'Draft' : 'Pending'}</Badge>;
}

function SourceBadge({ record }: { record: DreamCareerPhase1ReviewQueueItem }) {
  const current = record.sourceBinding.status === 'current';
  return <Badge className={cn(current ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200')} variant="outline">Source {record.sourceBinding.status}</Badge>;
}

function FinalizeDialog({ detail, labels, busy, error, onCancel, onConfirm }: {
  detail: DreamCareerPhase1ReviewDetail;
  labels: Map<string, string>;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  const primary = detail.draft?.primaryDirectionId;
  const secondary = detail.draft?.secondaryDirectionIds ?? [];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onCancel(); }}>
      <button aria-label="Close confirmation" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" disabled={busy} onClick={onCancel} type="button" />
      <div aria-describedby="phase1-finalize-description" aria-labelledby="phase1-finalize-title" aria-modal="true" className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background p-5 shadow-2xl sm:p-6" role="dialog">
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
    </div>
  );
}

function DecisionEditor({ detail, locale, onClose, onPersisted }: {
  detail: DreamCareerPhase1ReviewDetail;
  locale: string;
  onClose: () => void;
  onPersisted: (detail: DreamCareerPhase1ReviewDetail) => void;
}) {
  const initialIds = detail.finalDecision?.futureDirectionIds ?? (detail.draft ? [detail.draft.primaryDirectionId, ...detail.draft.secondaryDirectionIds] : []);
  const [primary, setPrimary] = useState(initialIds[0] ?? '');
  const [secondary, setSecondary] = useState<string[]>(initialIds.slice(1));
  const [busy, setBusy] = useState<'save' | 'finalize' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const labels = useMemo(() => new Map(detail.directionOptions.map((option) => [option.directionId, directionLabel(option, locale)])), [detail.directionOptions, locale]);
  const exactDirections = detail.directionOptions.length === 6
    && new Set(detail.directionOptions.map((item) => item.directionId)).size === 6
    && detail.directionOptions.every((item, index) => item.canonicalOrder === index && detail.canonicalDirectionIds[index] === item.directionId);
  const sourceCurrent = detail.sourceBinding.isCurrent && detail.sourceBinding.status === 'current' && detail.sourceBinding.blockers.length === 0;
  const persisted = detail.draft;
  const selectionPersisted = Boolean(persisted && primary === persisted.primaryDirectionId && secondary.length === persisted.secondaryDirectionIds.length && secondary.every((id, index) => id === persisted.secondaryDirectionIds[index]));
  const editable = detail.status !== 'finalized' && sourceCurrent && exactDirections;

  const choosePrimary = (id: string) => { setPrimary(id); setSecondary((current) => current.filter((item) => item !== id)); setError(null); setNotice(null); };
  const toggleSecondary = (id: string) => { setSecondary((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current); setError(null); setNotice(null); };
  const save = async () => {
    if (!primary) { setError('Choose one primary Direction before saving.'); return; }
    setBusy('save'); setError(null); setNotice(null);
    try {
      const readback = await dreamCareerPhase1ReviewApi.saveDraft(detail, primary, secondary, idempotencyKey('draft', detail.careerId));
      onPersisted(readback); setNotice('Persisted readback confirmed.');
    } catch (caught) { setError(errorMessage(caught, 'Unable to save and verify the draft.')); }
    finally { setBusy(null); }
  };
  const finalize = async () => {
    setBusy('finalize'); setError(null);
    try {
      const readback = await dreamCareerPhase1ReviewApi.finalize(detail, idempotencyKey('finalize', detail.careerId));
      onPersisted(readback); setConfirming(false); setNotice('Finalized decision readback confirmed.');
    } catch (caught) { setError(errorMessage(caught, 'Unable to finalize and verify the decision.')); }
    finally { setBusy(null); }
  };

  return (
    <section aria-label="Decision editor" className="rounded-2xl border bg-background shadow-sm" role="region">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{detail.careerDisplay?.title ?? 'Canonical display unavailable'}</h2><StatusBadge status={detail.status} /><SourceBadge record={detail} /></div><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{detail.careerId}</p></div><Button aria-label="Close decision editor" onClick={onClose} size="icon-sm" type="button" variant="ghost"><X /></Button></div>
      <div className="space-y-5 p-4 sm:p-5">
        <Card className="py-0 shadow-none"><CardContent className="grid gap-4 p-4 text-sm lg:grid-cols-3"><div><p className="text-xs text-muted-foreground">Canonical source</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.sourcePath ?? 'Unavailable'}</p></div><div><p className="text-xs text-muted-foreground">Release</p><p className="mt-1 break-all font-mono text-xs">{detail.careerDisplay?.releaseId ?? 'Unavailable'}</p></div><div><p className="text-xs text-muted-foreground">Current record</p><p className="mt-1">Version {detail.version} · Source {detail.sourceBinding.status}</p></div>{detail.careerDisplay?.description ? <p className="leading-6 text-muted-foreground lg:col-span-3">{detail.careerDisplay.description}</p> : null}</CardContent></Card>
        {!sourceCurrent || !exactDirections ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><p className="font-semibold">This record cannot be changed.</p><p className="mt-1">{!exactDirections ? 'The server did not provide exactly six canonical Direction choices.' : `Source binding is ${detail.sourceBinding.status}.`}</p>{detail.sourceBinding.blockers.length ? <p className="mt-2 break-all font-mono text-xs">{detail.sourceBinding.blockers.join(', ')}{detail.sourceBinding.mismatchFields.length ? ` · ${detail.sourceBinding.mismatchFields.join(', ')}` : ''}</p> : null}</div> : null}
        <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">Primary Direction <span className="text-destructive">Required</span></legend><p className="mt-1 text-sm text-muted-foreground">Choose the single best fit.</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{detail.directionOptions.map((option) => <label className={cn('cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring', primary === option.directionId && 'border-primary bg-primary/5')} key={option.directionId}><span className="flex items-start gap-3"><input aria-label={`Primary ${directionLabel(option, locale)}`} checked={primary === option.directionId} className="mt-1" name="primary-direction" onChange={() => choosePrimary(option.directionId)} type="radio" /><span><span className="block text-sm font-medium">{directionLabel(option, locale)}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span></span></label>)}</div></fieldset>
        <fieldset disabled={!editable || Boolean(busy)}><legend className="font-semibold">Secondary Directions <span className="font-normal text-muted-foreground">Optional, up to two</span></legend><p className="mt-1 text-sm text-muted-foreground">Secondary choices remain ordered in the order selected.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{detail.directionOptions.map((option) => { const checked = secondary.includes(option.directionId); const disabled = option.directionId === primary || (!checked && secondary.length >= 2); return <label className={cn('flex items-center gap-3 rounded-xl border px-3 py-3 text-sm', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer', checked && 'border-primary bg-primary/5')} key={option.directionId}><input aria-label={`Secondary ${directionLabel(option, locale)}`} checked={checked} disabled={disabled} onChange={() => toggleSecondary(option.directionId)} type="checkbox" /><span>{directionLabel(option, locale)}</span></label>; })}</div></fieldset>
        <div className="grid gap-3 rounded-xl bg-muted/35 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Draft review</p><p className="mt-1 font-medium">{detail.draft ? 'Draft author recorded' : 'No saved draft'}</p>{detail.draft ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.draft.updatedAt}>{formatReviewTime(detail.draft.updatedAt)}</time> : null}</div><div><p className="text-xs text-muted-foreground">Final review</p><p className="mt-1 font-medium">{detail.finalDecision ? 'Final reviewer recorded' : 'Not finalized'}</p>{detail.finalDecision ? <time className="mt-0.5 block text-xs text-muted-foreground" dateTime={detail.finalDecision.reviewedAt}>{formatReviewTime(detail.finalDecision.reviewedAt)}</time> : null}</div></div>
        {error && !confirming ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
        {notice ? <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300" role="status"><CheckCircle2 className="size-4" />{notice}</p> : null}
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button disabled={!editable || !primary || Boolean(busy)} onClick={() => void save()} type="button" variant="outline">{busy === 'save' ? <Loader2 className="animate-spin" /> : null}{error ? 'Retry save' : 'Save draft'}</Button><Button disabled={!editable || !detail.draft || !selectionPersisted || Boolean(busy)} onClick={() => { setError(null); setConfirming(true); }} type="button">Review final decision</Button></div>
      </div>
      {confirming ? <FinalizeDialog busy={busy === 'finalize'} detail={detail} error={error} labels={labels} onCancel={() => { if (!busy) { setConfirming(false); setError(null); } }} onConfirm={() => void finalize()} /> : null}
    </section>
  );
}

export default function DreamCareerPhase1ReviewPage() {
  const { locale } = useTranslations();
  const [queue, setQueue] = useState<DreamCareerPhase1ReviewQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [detail, setDetail] = useState<DreamCareerPhase1ReviewDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [authority, setAuthority] = useState<{ label: string; document: unknown } | null>(null);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true; setLoading(true); setError(null); setQueue(null); setDetail(null);
    dreamCareerPhase1ReviewApi.listQueue().then((value) => { if (active) setQueue(value); }).catch((caught) => { if (active) setError(errorMessage(caught, 'Unable to load the authenticated review queue.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const integrityError = queue ? queueIntegrityError(queue) : null;
  const visible = useMemo(() => queue?.records.filter((record) => {
    const text = `${record.careerId} ${record.careerDisplay?.title ?? ''} ${record.careerDisplay?.sourcePath ?? ''}`.toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === 'all' || record.status === status) && (source === 'all' || record.sourceBinding.status === source);
  }) ?? [], [queue, search, source, status]);
  const eligible = Boolean(queue && !integrityError && queue.blockers.length === 0 && queue.counts.finalized === EXPECTED_TOTAL);

  const open = useCallback(async (record: DreamCareerPhase1ReviewQueueItem) => {
    setDetailLoading(record.careerId); setError(null);
    try { setDetail(await dreamCareerPhase1ReviewApi.getDetail(record.careerId)); }
    catch (caught) { setError(errorMessage(caught, 'Unable to load the persisted review detail.')); }
    finally { setDetailLoading(null); }
  }, []);
  const persisted = (readback: DreamCareerPhase1ReviewDetail) => { setDetail(readback); setQueue((current) => current ? updateQueueRecord(current, readback) : current); };
  const runExport = async (kind: 'mapping' | 'taxonomy') => {
    setExportBusy(kind); setExportError(null);
    try {
      const document = kind === 'mapping' ? await dreamCareerPhase1ReviewApi.exportFutureDirections() : await dreamCareerPhase1ReviewApi.exportTaxonomyRejection();
      setAuthority({ label: kind === 'mapping' ? 'Future Direction mapping authority' : 'Taxonomy rejection authority', document });
    } catch (caught) { setExportError(errorMessage(caught, 'Authority export failed.')); }
    finally { setExportBusy(null); }
  };

  return <div className="h-full overflow-y-auto bg-muted/20"><div className="mx-auto max-w-[110rem] space-y-5 p-4 sm:p-6 lg:p-8"><header><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">Dream Career Phase 1 review</h1><Badge variant="secondary">Human review required</Badge></div><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Review the server-bound Future Direction decisions for all 229 canonical careers. Drafts are resumable; finalization requires a different authenticated reviewer.</p></header>
    {loading ? <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border bg-background text-sm text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" />Loading authenticated review queue…</div> : error && !queue ? <div className="rounded-2xl border border-destructive/30 bg-background p-6" role="alert"><p className="font-semibold text-destructive">Review queue unavailable</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => setReload((value) => value + 1)} type="button" variant="outline"><RefreshCw />Retry queue</Button></div> : integrityError ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert"><p className="font-semibold">Canonical queue integrity check failed</p><p className="mt-2 text-sm">{integrityError}</p><Button className="mt-4" onClick={() => setReload((value) => value + 1)} type="button" variant="outline"><RefreshCw />Retry queue</Button></div> : queue ? <>
      <section aria-label="Review counts" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{([['Total', queue.counts.total], ['Pending', queue.counts.pending], ['Draft', queue.counts.draft], ['Finalized', queue.counts.finalized]] as const).map(([label, value]) => <Card className="gap-1 py-4 shadow-none" key={label}><CardHeader className="px-4"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card>)}</section>
      {queue.blockers.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="status"><span className="font-semibold">Export blocked by server summary:</span> <span className="font-mono text-xs">{queue.blockers.join(', ')}</span></div> : null}
      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{error}</div> : null}
      {detail ? <DecisionEditor detail={detail} locale={locale} onClose={() => setDetail(null)} onPersisted={persisted} /> : null}
      <section aria-label="Career review queue" className="overflow-hidden rounded-2xl border bg-background"><div className="flex flex-wrap items-center gap-3 border-b p-4"><div className="relative min-w-56 flex-1 sm:max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search careers" className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search title, career ID, or source path" role="searchbox" value={search} /></div><select aria-label="Filter by review status" className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="pending">Pending</option><option value="draft">Draft</option><option value="finalized">Finalized</option></select><select aria-label="Filter by source state" className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setSource(event.target.value)} value={source}><option value="all">All source states</option><option value="current">Current</option><option value="stale">Stale</option><option value="mismatch">Mismatch</option></select><p className="ml-auto text-xs text-muted-foreground" role="status">{visible.length} of {queue.records.length}</p></div>
        <div className="max-h-[48rem] overflow-auto"><table className="w-full min-w-[58rem] text-sm"><thead className="sticky top-0 z-10 bg-muted/95 text-left backdrop-blur"><tr><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Career and source</th><th className="px-4 py-3 font-medium">Review</th><th className="px-4 py-3 font-medium">Source binding</th><th className="px-4 py-3 font-medium">Recorded review</th><th className="px-4 py-3 font-medium"><span className="sr-only">Action</span></th></tr></thead><tbody>{visible.map((record) => <tr className="border-t align-top" key={record.careerId}><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.canonicalOrder + 1}</td><td className="max-w-lg px-4 py-3"><p className="font-medium">{record.careerDisplay?.title ?? 'Canonical display unavailable'}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">{record.careerId}</p><p className="mt-1 break-all text-xs text-muted-foreground">{record.careerDisplay?.sourcePath ?? 'Source path unavailable'}</p></td><td className="px-4 py-3"><StatusBadge status={record.status} /></td><td className="px-4 py-3"><SourceBadge record={record} />{record.sourceBinding.blockers.length ? <p className="mt-1 max-w-52 break-all font-mono text-[0.7rem] text-amber-800 dark:text-amber-300">{record.sourceBinding.blockers.join(', ')}</p> : null}</td><td className="px-4 py-3 text-xs"><p>{record.draft ? 'Draft author recorded' : 'No draft author'}</p>{record.draft ? <time className="text-muted-foreground" dateTime={record.draft.updatedAt}>{formatReviewTime(record.draft.updatedAt)}</time> : null}<p className="mt-2">{record.finalDecision ? 'Final reviewer recorded' : 'No final reviewer'}</p>{record.finalDecision ? <time className="text-muted-foreground" dateTime={record.finalDecision.reviewedAt}>{formatReviewTime(record.finalDecision.reviewedAt)}</time> : null}</td><td className="px-4 py-3 text-right"><Button aria-label={`Review ${record.careerDisplay?.title ?? record.careerId}`} disabled={detailLoading === record.careerId} onClick={() => void open(record)} size="sm" type="button" variant="outline">{detailLoading === record.careerId ? <Loader2 className="animate-spin" /> : null}Review</Button></td></tr>)}</tbody></table>{visible.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No careers match these filters.</div> : null}</div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2"><Card className="shadow-none"><CardHeader><CardTitle>Taxonomy rejection acknowledgement</CardTitle><CardDescription>The frozen source contains one malformed legacy assignment.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><dl className="grid gap-2 rounded-xl bg-muted/40 p-4 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Legacy family</dt><dd className="font-mono">traits</dd></div><div><dt className="text-xs text-muted-foreground">Category</dt><dd className="font-mono">traitIds</dd></div><div><dt className="text-xs text-muted-foreground">Raw value</dt><dd className="font-mono">Raw value: ytical</dd></div><div><dt className="text-xs text-muted-foreground">Disposition</dt><dd className="font-mono">rejected</dd></div></dl><p className="leading-6 text-muted-foreground">The malformed raw value is omitted, not corrected to analytical. This acknowledgement does not invent a replacement tag.</p></CardContent></Card><Card className="border-amber-300 shadow-none dark:border-amber-800"><CardHeader><CardTitle>Final release remains blocked</CardTitle><CardDescription>Accepted-college release authority and final release acceptance are outside this Phase 1 review.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">This interface cannot create, edit, or imply either authority. They remain blocked until separate server-authoritative workflows and persisted readback exist.</p></CardContent></Card></section>
      {eligible ? <section className="rounded-2xl border bg-background p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Authority exports</h2><p className="mt-1 text-sm text-muted-foreground">The server summary reports all 229 decisions eligible for export.</p></div><div className="flex flex-wrap gap-2"><Button aria-label="Export Future Direction mapping" disabled={Boolean(exportBusy)} onClick={() => void runExport('mapping')} type="button" variant="outline">{exportBusy === 'mapping' ? <Loader2 className="animate-spin" /> : <Download />}Export mapping</Button><Button aria-label="Export taxonomy rejection" disabled={Boolean(exportBusy)} onClick={() => void runExport('taxonomy')} type="button" variant="outline">{exportBusy === 'taxonomy' ? <Loader2 className="animate-spin" /> : <Download />}Export taxonomy rejection</Button></div></div>{exportError ? <p className="mt-4 text-sm text-destructive" role="alert">{exportError}</p> : null}{authority ? <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{authority.label}</h3><Button onClick={() => downloadServerAuthority(authority.document, authority.label.toLowerCase().replaceAll(' ', '-') + '.json')} size="sm" type="button" variant="outline"><Download />Download server JSON</Button></div><pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">{JSON.stringify(authority.document, null, 2)}</pre></div> : null}</section> : null}
    </> : null}
  </div></div>;
}

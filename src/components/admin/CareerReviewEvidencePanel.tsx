'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CareerContentVersion } from '@/lib/career-content-versions';
import { getReviewSnapshot, recordReviewEvidence, revokeReviewEvidence, type ReviewKind, type ReviewScope, type ReviewSnapshot, type ReviewTarget } from '@/lib/career-review-evidence';

const lines = (value: string) => [...new Set(value.split('\n').map((item) => item.trim()).filter(Boolean))];
const emptyScope = (): ReviewScope => ({ grades: [], locales: [], jurisdictions: [] });
export default function CareerReviewEvidencePanel({ collection, recordId, versions, mayRecord, onSnapshotMutation }: {
  collection: string; recordId: string; versions: CareerContentVersion[]; mayRecord: boolean; onSnapshotMutation?: (snapshot: ReviewSnapshot) => void;
}) {
  const [versionId, setVersionId] = useState('');
  return <section className="h-full space-y-5 overflow-y-auto p-4 sm:p-6" role="tabpanel">
    <h2 className="text-lg font-semibold">Human review evidence</h2>
    <p className="text-sm text-muted-foreground">Record what you actually reviewed against an exact saved content revision. Evidence does not approve or publish content. English fallback previews, machine translations and completeness labels are not proof of human review.</p>
    <label className="block text-sm font-medium">Content version
      <select className="mt-2 block w-full rounded-md border bg-background p-3" value={versionId} onChange={(event) => setVersionId(event.target.value)}>
        <option value="">Choose a version to review</option>
        {versions.map((version) => <option key={version.id} value={version.id}>Revision {version.revision} · {version.status} · {version.id}</option>)}
      </select>
    </label>
    {!versions.length ? <p>No saved versions are available. Create a content draft first.</p> : null}
    {versionId ? <VersionEvidence key={versionId} target={{ collection, recordId, versionId }} mayRecord={mayRecord} onSnapshotMutation={onSnapshotMutation} /> : null}
  </section>;
}
function VersionEvidence({ target, mayRecord, onSnapshotMutation }: { target: ReviewTarget; mayRecord: boolean; onSnapshotMutation?: (snapshot: ReviewSnapshot) => void }) {
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ReviewKind>('factual');
  const [scope, setScope] = useState<ReviewScope>(emptyScope);
  const [paths, setPaths] = useState('');
  const [sources, setSources] = useState('');
  const [claims, setClaims] = useState('');
  const [rationale, setRationale] = useState('');
  const [readSnapshot, setReadSnapshot] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const requests = useRef(new Map<string, string>());
  const { collection, recordId, versionId } = target;
  useEffect(() => {
    let cancelled = false;
    getReviewSnapshot({ collection, recordId, versionId }).then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((caught) => { if (!cancelled) setLoadError(caught instanceof Error ? caught.message : 'Unable to load review evidence.'); });
    return () => { cancelled = true; };
  }, [collection, recordId, versionId, attempt]); // target identity is the immutable route boundary
  const reload = () => { setSnapshot(null); setLoadError(''); setError(''); setMessage(''); setReadSnapshot(false); setAttempt((value) => value + 1); };
  const requestKey = (payload: unknown) => {
    const signature = JSON.stringify(payload);
    let key = requests.current.get(signature);
    if (!key) { key = crypto.randomUUID(); requests.current.set(signature, key); }
    return key;
  };
  if (loadError) return <div role="alert">{loadError}<Button onClick={reload} variant="outline">Retry snapshot</Button></div>;
  if (!snapshot) return <p role="status">Loading exact content snapshot…</p>;
  const allowed = snapshot.allowedScopes;
  const record = async () => {
    setError(''); setMessage('');
    if (!mayRecord || !readSnapshot || snapshot.status !== 'inReview') return;
    if (!scope.grades.length || !scope.locales.length || !scope.jurisdictions.length || !lines(paths).length || !lines(sources).length || !lines(claims).length || !rationale.trim()) {
      setError('Choose the scope you reviewed and provide content paths, sources, supported claims and an applicability rationale.'); return;
    }
    const payload = { expectedLockVersion: snapshot.lockVersion, expectedContentChecksum: snapshot.contentChecksum,
      kind, scope, contentPaths: lines(paths), sourceIds: lines(sources), supportedClaims: lines(claims), applicabilityRationale: rationale.trim() };
    setBusy(true);
    try {
      const next = await recordReviewEvidence(target, { ...payload, idempotencyKey: requestKey(payload) });
      setSnapshot(next); onSnapshotMutation?.(next); setReadSnapshot(false); setMessage('Review evidence saved and verified. Approval and publication are separate actions.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to record review evidence. Your notes are kept for retry.'); }
    finally { setBusy(false); }
  };
  const revoke = async (receiptId: string) => {
    const reason = reasons[receiptId]?.trim();
    if (!mayRecord || !reason) { setError('Provide a reason for revoking this review.'); return; }
    const payload = { expectedLockVersion: snapshot.lockVersion, expectedContentChecksum: snapshot.contentChecksum, reason };
    setBusy(true); setError(''); setMessage('');
    try {
      const next = await revokeReviewEvidence(target, receiptId, { ...payload, idempotencyKey: requestKey({ receiptId, ...payload }) });
      setSnapshot(next); onSnapshotMutation?.(next);
      setMessage('Review revocation saved and verified. The original review remains in the audit history.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to verify revocation.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div className="rounded-lg border bg-card p-4 text-sm"><p>Version {snapshot.versionId} · lock {snapshot.lockVersion} · {snapshot.status}</p><p className="mt-2 break-all font-mono">Content checksum: {snapshot.contentChecksum}</p>
      <Button className="mt-3" disabled={busy} onClick={reload} variant="outline">Reload snapshot</Button>
    </div>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Exact saved content (no translation fallback)</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(snapshot.content, null, 2)}</pre></details>
    <div className="rounded-lg border p-4"><h3 className="font-medium">Server review coverage</h3><p className="mt-2 text-sm">{snapshot.coverage.complete ? 'Recorded review coverage is complete. This is not publication approval.' : 'Review coverage is incomplete.'}</p><ul className="mt-2 list-disc pl-5 text-sm">{snapshot.coverage.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div>
    {!mayRecord ? <p className="rounded-lg border p-4 text-sm">Read-only access. A verified human Admin must record or revoke evidence.</p> : snapshot.status !== 'inReview' ? <p className="rounded-lg border p-4 text-sm">Evidence can be recorded only for a version submitted for review. Submit its draft first; historical receipts remain readable below.</p> : <fieldset disabled={busy} className="space-y-4 rounded-lg border p-4">
      <legend className="px-1 font-medium">Record a review</legend>
      <label className="block text-sm font-medium">Review type<select className="mt-1 block w-full rounded-md border bg-background p-2" value={kind} onChange={(event) => { setKind(event.target.value as ReviewKind); setScope(emptyScope()); setReadSnapshot(false); }}>
        <option value="factual">Factual accuracy</option><option value="translation">Language review</option><option value="grade">Grade suitability</option><option value="jurisdiction">State or union territory pathways</option>
      </select></label>
      <ScopeChoices label="Languages reviewed" values={allowed.locales} selected={scope.locales} onChange={(locales) => setScope({ ...scope, locales })} />
      <ScopeChoices label="Grades reviewed" values={allowed.grades} selected={scope.grades} onChange={(grades) => setScope({ ...scope, grades })} />
      <ScopeChoices label="States and union territories reviewed" values={allowed.jurisdictions} selected={scope.jurisdictions} onChange={(jurisdictions) => setScope({ ...scope, jurisdictions })} />
      <p className="text-sm text-muted-foreground">Choose at least one grade, language and jurisdiction for every review type. This receipt covers every combination of your selections. Select only combinations you actually checked; explain why the same evidence applies to each. Split different evidence into separate reviews.</p>
      <Notes label="Content paths reviewed (one per line)" value={paths} onChange={setPaths} hint={kind === 'grade' || kind === 'jurisdiction' ? 'Use exact pathway or subject-guidance paths, for example studentGuide.howToGetThere.subjects.0.guidance. Grade reviews must reference guidance for each selected grade.' : kind === 'translation' ? 'Use actual text paths in each selected locale, for example studentGuideTranslations.ml.aboutCareer.whatYouDo. English fallback is not translated text.' : 'For example: studentGuide.aboutCareer.whatYouDo'} />
      <Notes label="Evidence source IDs (one per line)" value={sources} onChange={setSources} hint="Use source IDs from the saved content snapshot." />
      <Notes label="Supported claims (one per line)" value={claims} onChange={setClaims} hint="Describe the specific statements you checked." />
      <Notes label="Applicability rationale" value={rationale} onChange={setRationale} hint="Explain the evidence, limitations and why it supports the selected scope. Record unresolved issues in the content draft rather than attesting that they are reviewed." />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={readSnapshot} onChange={(event) => setReadSnapshot(event.target.checked)} />I reviewed this exact saved snapshot and the stated evidence for the selected scope.</label>
      <Button disabled={!readSnapshot || busy} onClick={() => void record()} type="button">{busy ? 'Verifying…' : 'Record review evidence'}</Button>
    </fieldset>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    <section className="space-y-3"><h3 className="font-medium">Review receipts</h3>
      {!snapshot.receipts.length ? <p className="text-sm text-muted-foreground">No review receipts are recorded for this version.</p> : snapshot.receipts.map((receipt) => <article key={receipt.id} className="space-y-2 rounded-lg border p-4 text-sm">
        <p className="font-medium">{receipt.kind} · {receipt.revoked ? 'Revoked' : receipt.contentChecksum === snapshot.contentChecksum ? 'Current snapshot' : 'Stale content snapshot'}</p>
        <p>Reviewer: {receipt.reviewedBy} · {receipt.reviewedAt}</p><p className="break-all">Receipt: {receipt.id}</p>
        <p>Scope: {[...receipt.scope.locales, ...receipt.scope.grades, ...receipt.scope.jurisdictions].join(', ') || 'Factual content'}</p>
        <p>{receipt.applicabilityRationale}</p>
        <details><summary className="cursor-pointer">Claims, sources and content paths</summary><pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify({ claims: receipt.supportedClaims, sources: receipt.sourceIds, paths: receipt.contentPaths }, null, 2)}</pre></details>
        {mayRecord && !receipt.revoked ? <div><Notes label={`Revocation reason for ${receipt.id}`} value={reasons[receipt.id] || ''} onChange={(reason) => setReasons({ ...reasons, [receipt.id]: reason })} /><Button disabled={busy || !reasons[receipt.id]?.trim()} variant="outline" onClick={() => void revoke(receipt.id)}>Revoke review</Button></div> : null}
      </article>)}
    </section>
  </div>;
}
function Notes({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <label className="block text-sm font-medium">{label}{hint ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{hint}</span> : null}<textarea className="mt-2 block min-h-20 w-full rounded-md border bg-background p-2 font-normal" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function ScopeChoices({ label, values, selected, onChange }: { label: string; values: string[]; selected: string[]; onChange: (value: string[]) => void }) {
  return <fieldset className="rounded-md border p-3"><legend className="px-1 text-sm font-medium">{label}</legend><div className="grid max-h-60 gap-2 overflow-auto sm:grid-cols-2">{values.map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(value)} onChange={(event) => onChange(event.target.checked ? [...selected, value] : selected.filter((item) => item !== value))} />{value}</label>)}</div></fieldset>;
}

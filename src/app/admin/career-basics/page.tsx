'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { xtaraApi } from '@/lib/api/client';
import { xtaraApiOperationPath } from '@/lib/api/generated/xtara-api-operations';

interface StagedRelease {
  releaseId: string;
  catalogueCommit: string;
  deleteCounts: { directions: number; careers: number };
  insertCounts: { directions: number; dreamCareers: number; specializations: number };
  suggestions: Array<{ directionId: string; careerIds: string[] }>;
}

interface ReleaseReceipt {
  releaseId: string;
  directions: number;
  careers: number;
  removed: number;
  verified: boolean;
}

export default function CareerBasicsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [staged, setStaged] = useState<StagedRelease | null>(null);
  const [receipt, setReceipt] = useState<ReleaseReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = xtaraApiOperationPath('postAdminCareerCatalogBasicsRelease');

  async function run(action: 'stage' | 'activate') {
    setBusy(true);
    setError('');
    try {
      if (action === 'stage' && file) {
        setStaged(null);
        setReceipt(null);
        setStaged(await xtaraApi.post<StagedRelease>(path, { action, plan: JSON.parse(await file.text()) }));
      } else if (action === 'activate' && staged) {
        setReceipt(await xtaraApi.post<ReleaseReceipt>(path, { action, releaseId: staged.releaseId }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The catalogue release could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
    <h1 className="text-2xl font-semibold">Career catalogue replacement</h1>
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Catalogue plan JSON
        <input type="file" accept=".json,application/json" disabled={busy}
          className="mt-2 block w-full rounded-lg border p-3"
          onChange={(event) => { setFile(event.target.files?.[0] ?? null); setStaged(null); setReceipt(null); }} />
      </label>
      <Button disabled={busy || !file} onClick={() => void run('stage')}>Stage replacement</Button>
    </div>
    {busy && <p role="status">Verifying catalogue…</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {staged && <section className="space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Staged replacement</h2>
      <p>Delete {staged.deleteCounts.directions} Directions and {staged.deleteCounts.careers} career records.</p>
      <p>Insert {staged.insertCounts.directions} Directions, {staged.insertCounts.dreamCareers} Dream Careers and {staged.insertCounts.specializations} specializations.</p>
      <p className="break-all text-sm text-muted-foreground">Catalogue commit {staged.catalogueCommit}</p>
      <p className="break-all text-sm text-muted-foreground">Release {staged.releaseId}</p>
      <details>
        <summary>Assessment suggestions</summary>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {staged.suggestions.map((row) => <li key={row.directionId}>
            <strong>{row.directionId}</strong> {row.careerIds.join(', ')}
          </li>)}
        </ul>
      </details>
      {!receipt && <Button variant="destructive" disabled={busy} onClick={() => void run('activate')}>
        Replace production catalogue
      </Button>}
    </section>}
    {receipt?.verified && <p role="status">
      Verified production replacement. Removed {receipt.removed} records. Published {receipt.directions} Directions and {receipt.careers} career records.
    </p>}
  </main>;
}

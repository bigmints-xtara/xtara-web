'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { XtaraApiError, xtaraApi } from '@/lib/api/client';
import { xtaraApiOperationPath } from '@/lib/api/generated/xtara-api-operations';

type CoreEnglish = {
  summary: string;
  dailyWork: string[];
  skillsToBuild: string[];
  entryRoutes: string[];
  workSetting: string;
  tradeoffs: string[];
};

type Preview = {
  releaseId: string;
  candidates: Array<{ id: string; title: string; english: CoreEnglish }>;
};

type Receipt = { releaseId: string; publishedAt: string; versions: Array<{ id: string; versionId: string }> };

const fields = {
  summary: 'Overview', dailyWork: 'Duties', skillsToBuild: 'Skills',
  entryRoutes: 'Education and entry', workSetting: 'Workplaces', tradeoffs: 'Reality check',
} satisfies Record<keyof CoreEnglish, string>;

export default function CareerCoreEnglishPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = xtaraApiOperationPath('postAdminCareerCatalogCoreEnglishRelease');

  async function run(action: 'preview' | 'publish') {
    setBusy(true);
    setError('');
    try {
      if (action === 'preview') {
        setReceipt(null);
        setPreview(null);
        setPreview(await xtaraApi.post<Preview>(path, { action }));
      } else if (preview) {
        setReceipt(await xtaraApi.post<Receipt>(path, { action, releaseId: preview.releaseId }));
      }
    } catch (err) {
      if (err instanceof XtaraApiError && err.status === 409) setPreview(null);
      setError(err instanceof Error ? err.message : 'The core English release could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
    <h1 className="text-2xl font-semibold">Publish core English career copy</h1>
    <p className="text-sm text-muted-foreground">Review the six English fields for each eligible draft. Student Guides and translations have their own review workflow. <a className="underline" href="https://github.com/bigmints-xtara/xtara-catalog/tree/main/careers" target="_blank" rel="noreferrer">Catalogue sources</a></p>
    <Button disabled={busy} onClick={() => void run('preview')}>Preview drafts</Button>
    {busy && <p role="status">Checking the release…</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {preview && preview.candidates.length === 0 && <p>No core English drafts are eligible for publication.</p>}
    {preview && preview.candidates.length > 0 && !receipt && <section className="space-y-4">
      <h2 className="text-lg font-semibold">Career drafts ({preview.candidates.length})</h2>
      <div className="divide-y rounded-lg border">
        {preview.candidates.map((row) => <details className="p-4" key={row.id}>
          <summary className="cursor-pointer font-medium">{row.title}</summary>
          <dl className="mt-3 space-y-3 text-sm">
            {(Object.keys(fields) as Array<keyof CoreEnglish>).map((field) => <div key={field}>
              <dt className="font-medium">{fields[field]}</dt>
              <dd className="mt-1 text-muted-foreground">{typeof row.english[field] === 'string'
                ? row.english[field]
                : <ul className="list-disc space-y-1 pl-5">{row.english[field].map((item, index) => <li key={index}>{item}</li>)}</ul>}
              </dd>
            </div>)}
          </dl>
        </details>)}
      </div>
      <Button disabled={busy} onClick={() => void run('publish')}>
        Approve and publish {preview.candidates.length} {preview.candidates.length === 1 ? 'English draft' : 'English drafts'}
      </Button>
    </section>}
    {receipt && <p role="status">Core English versions published and verified ({receipt.versions.length}).</p>}
  </main>;
}

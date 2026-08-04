'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { xtaraApi } from '@/lib/api/client';
import type { ContentTagFields } from '@/types/admin';

type TaxonomyOption = { id: string; label: string; status: string };
type TaxonomyResponse = {
  taxonomy: {
    futureDirections: TaxonomyOption[];
    dreamCareers: Array<TaxonomyOption & { futureDirectionIds: string[] }>;
    skills: TaxonomyOption[];
    gradeStages: TaxonomyOption[];
  };
  coverage: { totals: { total: number; mapped: number; coveragePercent: number } };
};

export type ContentTagValue = Pick<ContentTagFields, 'futureDirectionIds' | 'dreamCareerIds' | 'skillIds' | 'gradeStages' | 'topics'>;

const EMPTY: ContentTagValue = { futureDirectionIds: [], dreamCareerIds: [], skillIds: [], gradeStages: [], topics: [] };

function selectedValues(event: React.ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

export function ContentTagEditor({ value, onChange }: {
  value: Partial<ContentTagValue>;
  onChange: (value: ContentTagValue) => void;
}) {
  const [response, setResponse] = useState<TaxonomyResponse | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const tags = { ...EMPTY, ...value };

  useEffect(() => {
    let cancelled = false;
    setError('');
    xtaraApi.get<TaxonomyResponse>('/admin/content-taxonomy')
      .then((result) => { if (!cancelled) setResponse(result); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load tagging choices'); });
    return () => { cancelled = true; };
  }, [reload]);

  const careers = useMemo(() => {
    const items = response?.taxonomy.dreamCareers || [];
    if (!tags.futureDirectionIds.length) return items;
    return items.filter((career) => career.futureDirectionIds.some((id) => tags.futureDirectionIds.includes(id)));
  }, [response, tags.futureDirectionIds]);

  const update = (patch: Partial<ContentTagValue>) => onChange({ ...tags, ...patch });

  if (error) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <Button className="ml-2" onClick={() => setReload((value) => value + 1)} size="sm" type="button" variant="outline">Try again</Button></div>;
  if (!response) return <p className="rounded-lg border p-4 text-sm text-muted-foreground">Loading approved tagging choices…</p>;

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div>
        <h3 className="font-semibold">Who should see this?</h3>
        <p className="text-sm text-muted-foreground">Choose real Xtara relationships. These determine whether this appears in a learner&apos;s For you feed.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Future Directions
          <select aria-label="Future Directions" className="min-h-36 w-full rounded-md border bg-background p-2" multiple onChange={(event) => update({ futureDirectionIds: selectedValues(event) })} value={tags.futureDirectionIds}>
            {response.taxonomy.futureDirections.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.id})</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">Dream Careers
          <select aria-label="Dream Careers" className="min-h-36 w-full rounded-md border bg-background p-2" multiple onChange={(event) => update({ dreamCareerIds: selectedValues(event) })} value={tags.dreamCareerIds}>
            {careers.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.id})</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">Skills
          <select aria-label="Skills" className="min-h-28 w-full rounded-md border bg-background p-2" multiple onChange={(event) => update({ skillIds: selectedValues(event) })} value={tags.skillIds}>
            {response.taxonomy.skills.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">Grade stages
          <select aria-label="Grade stages" className="min-h-28 w-full rounded-md border bg-background p-2" multiple onChange={(event) => update({ gradeStages: selectedValues(event) })} value={tags.gradeStages}>
            {response.taxonomy.gradeStages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium">Topics
        <Input onChange={(event) => update({ topics: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="climate, robotics, money" value={tags.topics.join(', ')} />
        <span className="block text-xs font-normal text-muted-foreground">Topics help browsing; they do not create a career match.</span>
      </label>
      <p className="text-xs text-muted-foreground">Catalog coverage: {response.coverage.totals.mapped}/{response.coverage.totals.total} items mapped ({response.coverage.totals.coveragePercent}%).</p>
    </div>
  );
}

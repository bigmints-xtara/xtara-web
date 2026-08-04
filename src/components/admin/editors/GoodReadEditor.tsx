'use client';

import { FormEvent, useState } from 'react';
import { Save, X } from 'lucide-react';

import { ContentTagEditor } from '@/components/admin/ContentTagEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { GoodRead } from '@/types/admin';

interface GoodReadEditorProps {
  goodRead: GoodRead | null;
  onSave: (data: Partial<GoodRead>) => Promise<void>;
  onCancel: () => void;
}
function localDate(value?: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function goodReadForm(goodRead: GoodRead | null): Partial<GoodRead> {
  return {
    title: goodRead?.title || '',
    type: goodRead?.type || 'article',
    domain: goodRead?.domain || '',
    content: goodRead?.content || '',
    image: goodRead?.image || '',
    hyperlink: goodRead?.hyperlink || '',
    hyperlinkText: goodRead?.hyperlinkText || '',
    careerRelevance: goodRead?.careerRelevance || [],
    futureDirectionIds: goodRead?.futureDirectionIds || [],
    dreamCareerIds: goodRead?.dreamCareerIds || goodRead?.careerRelevance || [],
    skillIds: goodRead?.skillIds || [],
    gradeStages: goodRead?.gradeStages || [],
    topics: goodRead?.topics || [],
    published: goodRead?.published || false,
    draft: goodRead?.draft ?? true,
    inReview: goodRead?.inReview || false,
    publishedAt: goodRead?.publishedAt,
    publishedUntil: goodRead?.publishedUntil,
  };
}

export default function GoodReadEditor({ goodRead, onSave, onCancel }: GoodReadEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<GoodRead>>(() => goodReadForm(goodRead));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save this good read');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (status: 'draft' | 'published' | 'inReview') => setFormData((current) => ({
    ...current,
    published: status === 'published',
    draft: status === 'draft',
    inReview: status === 'inReview',
  }));

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={submit}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">{goodRead ? 'Edit good read' : 'New good read'}</h2>
          <p className="text-xs text-muted-foreground">Draft and review educational editorial content.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} type="button" variant="outline"><X /><span className="hidden sm:inline">Cancel</span></Button>
          <Button disabled={saving} type="submit"><Save />{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {error ? <p role="alert" className="shrink-0 border-b border-destructive/30 bg-destructive/5 px-6 py-3 text-sm text-destructive">{error}</p> : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-4xl gap-5">
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-base">Editorial content</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <label className="block space-y-2 text-sm font-medium">Title <span className="text-destructive">*</span><Input onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder="A clear, useful title" required value={formData.title || ''} /></label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">Type<Input onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))} placeholder="Article, video, or podcast" value={formData.type || ''} /></label>
                <label className="space-y-2 text-sm font-medium">Domain<Input onChange={(event) => setFormData((current) => ({ ...current, domain: event.target.value }))} placeholder="Career development" value={formData.domain || ''} /></label>
              </div>
              <label className="block space-y-2 text-sm font-medium">Content<Textarea className="min-h-44" onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))} placeholder="Write the article or a useful editorial summary." value={formData.content || ''} /></label>
              <label className="block space-y-2 text-sm font-medium">Image URL<Input onChange={(event) => setFormData((current) => ({ ...current, image: event.target.value }))} placeholder="https://…" type="url" value={formData.image || ''} /></label>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-base">Link and relevance</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">Destination URL<Input onChange={(event) => setFormData((current) => ({ ...current, hyperlink: event.target.value }))} placeholder="https://…" type="url" value={formData.hyperlink || ''} /></label>
                <label className="space-y-2 text-sm font-medium">Link label<Input onChange={(event) => setFormData((current) => ({ ...current, hyperlinkText: event.target.value }))} placeholder="Read the full guide" value={formData.hyperlinkText || ''} /></label>
              </div>
            </CardContent>
          </Card>

          <ContentTagEditor value={formData} onChange={(tags) => setFormData((current) => ({ ...current, ...tags }))} />

          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-base">Publishing</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">Status<Select onValueChange={(value) => setStatus(value as 'draft' | 'published' | 'inReview')} value={formData.published ? 'published' : formData.inReview ? 'inReview' : 'draft'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="inReview">In review</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select></label>
              <label className="space-y-2 text-sm font-medium">Publish at<Input onChange={(event) => setFormData((current) => ({ ...current, publishedAt: event.target.value ? new Date(event.target.value) : undefined }))} type="datetime-local" value={localDate(formData.publishedAt)} /></label>
              <label className="space-y-2 text-sm font-medium">Publish until<Input onChange={(event) => setFormData((current) => ({ ...current, publishedUntil: event.target.value ? new Date(event.target.value) : undefined }))} type="datetime-local" value={localDate(formData.publishedUntil)} /></label>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

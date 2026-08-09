'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GameTemplate } from '@/types/admin';

export default function GameTemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: GameTemplate | null;
  onSave: (data: Partial<GameTemplate>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<GameTemplate>>(() => template || {
    title: '', description: '', mode: 'quiz', config: {}, published: false, draft: true, inReview: false,
  });
  const [configText, setConfigText] = useState(() => JSON.stringify(template?.config || {}, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const config = JSON.parse(configText) as Record<string, unknown>;
      await onSave({ ...form, config });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save this game template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex h-full flex-col" onSubmit={submit}>
      <div className="flex items-center justify-between border-b bg-background p-4 sm:px-6">
        <h2 className="font-semibold">{template ? 'Edit game template' : 'Create game template'}</h2>
        <div className="flex gap-2"><Button onClick={onCancel} type="button" variant="outline"><X />Cancel</Button><Button disabled={saving} type="submit"><Save />{saving ? 'Saving…' : 'Save'}</Button></div>
      </div>
      {error ? <p className="border-b border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <label className="block space-y-2 text-sm font-medium">Title<Input onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title || ''} /></label>
        <label className="block space-y-2 text-sm font-medium">Description<textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2 font-normal" onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description || ''} /></label>
        <label className="block space-y-2 text-sm font-medium">Mode<select className="h-10 w-full rounded-md border bg-background px-3 font-normal" onChange={(event) => setForm({ ...form, mode: event.target.value as GameTemplate['mode'] })} value={form.mode || 'quiz'}><option value="quiz">Quiz</option><option value="puzzle">Puzzle</option><option value="memory">Memory</option><option value="simulation">Simulation</option></select></label>
        <label className="block space-y-2 text-sm font-medium">Thumbnail URL<Input onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} value={form.thumbnail || ''} /></label>
        <label className="block space-y-2 text-sm font-medium">Configuration JSON<textarea className="min-h-64 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" onChange={(event) => setConfigText(event.target.value)} spellCheck={false} value={configText} /></label>
      </div>
    </form>
  );
}

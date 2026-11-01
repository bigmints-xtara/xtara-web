'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assessmentGrades, assessmentLocales, emptyAssessmentDefinition, importAssessmentDraft, type AssessmentDefinitionAdmin, type DefinitionGrade, type DefinitionLocale, type DefinitionQuestion } from '@/lib/admin/configs/assessmentDefinitionsConfig';

export default function AssessmentDefinitionEditor({ entity, onSave, onCancel }: { entity: AssessmentDefinitionAdmin | null; onSave: (data: Partial<AssessmentDefinitionAdmin>) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => entity ?? emptyAssessmentDefinition());
  const [locale, setLocale] = useState<DefinitionLocale>('en');
  const [grade, setGrade] = useState<DefinitionGrade>('grade8');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const translation = draft.translations[locale];
  const save = async () => {
    setBusy(true); setError('');
    try { await onSave({ definitionId: 'career-discovery', documentId: draft.documentId, recordType: 'assessment_definition', schemaVersion: 1, version: draft.version, status: 'draft', published: false, defaultLocale: draft.defaultLocale, contexts: draft.contexts, translations: draft.translations, compatibleCareerSchemaVersion: draft.compatibleCareerSchemaVersion, provenance: draft.provenance }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save definition. Your edits remain here.'); }
    finally { setBusy(false); }
  };
  const updateQuestion = (group: 'common' | 'stage', index: number, update: Partial<DefinitionQuestion>) => {
    if (!translation) return;
    const questions = group === 'common' ? translation.questions : translation.stageQuestions[grade];
    const next = questions.map((question, itemIndex) => itemIndex === index ? { ...question, ...update } : question);
    const updated = group === 'common' ? { ...translation, questions: next } : { ...translation, stageQuestions: { ...translation.stageQuestions, [grade]: next } };
    setDraft({ ...draft, translations: { ...draft.translations, [locale]: updated } });
  };
  return <div className="h-full space-y-5 overflow-y-auto p-4 sm:p-6">
    <h2 className="text-xl font-semibold">Assessment definition</h2>
    <p className="text-sm text-muted-foreground">Save wording changes as a draft, then submit, review and promote through Versions. Stable question IDs, option IDs and scoring metadata are preserved. The API validates all four languages and five grades before approval. Saving here does not publish an assessment.</p>
    <p className="break-all text-sm">Record: {draft.documentId} · Definition: career-discovery</p>
    <label className="block text-sm font-medium">Content version<Input value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })} disabled={busy} /></label>
    <p className="text-xs text-muted-foreground">For an update to a published definition, use a newer semantic version. This is separate from the editor revision number.</p>
    <label className="block text-sm font-medium">Import a definition draft (JSON)<Input type="file" accept="application/json,.json" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setDraft(importAssessmentDraft(JSON.parse(await file.text()))); setError(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to import draft.'); } }} /></label>
    <DefinitionSelectors locale={locale} grade={grade} onLocale={setLocale} onGrade={setGrade} />
    {!translation ? <p role="alert">This language is missing. Import its complete definition before review.</p> : <>
      <label className="block text-sm">Grade question wording<Input value={translation.ui?.gradeQuestion?.label || ''} onChange={(event) => setDraft({ ...draft, translations: { ...draft.translations, [locale]: { ...translation, ui: { ...translation.ui, gradeQuestion: { ...translation.ui.gradeQuestion, label: event.target.value } } } } })} /></label>
      <label className="block text-sm">Grade question description<Input value={translation.ui?.gradeQuestion?.description || ''} onChange={(event) => setDraft({ ...draft, translations: { ...draft.translations, [locale]: { ...translation, ui: { ...translation.ui, gradeQuestion: { ...translation.ui.gradeQuestion, description: event.target.value } } } } })} /></label>
      <details><summary className="cursor-pointer text-sm">Assessment instructions and interface wording</summary><div className="mt-3 space-y-3">{Object.entries(translation.ui).filter(([, value]) => typeof value === 'string').map(([key, value]) => <label key={key} className="block text-sm">{key}<Input value={String(value)} onChange={(event) => setDraft({ ...draft, translations: { ...draft.translations, [locale]: { ...translation, ui: { ...translation.ui, [key]: event.target.value } } } })} /></label>)}</div></details>
      <label className="block text-sm">Selected grade label<Input value={translation.ui?.gradeQuestion?.options?.[grade] || ''} onChange={(event) => setDraft({ ...draft, translations: { ...draft.translations, [locale]: { ...translation, ui: { ...translation.ui, gradeQuestion: { ...translation.ui.gradeQuestion, options: { ...translation.ui.gradeQuestion.options, [grade]: event.target.value } } } } } })} /></label>
      {(['common', 'stage'] as const).map((group) => <section key={group} className="space-y-3"><h3 className="font-semibold">{group === 'common' ? 'Common questions' : `${grade} questions`}</h3>
        {(group === 'common' ? translation.questions : translation.stageQuestions?.[grade] || []).map((question, index) => <article key={question.id} className="space-y-3 rounded-lg border bg-card p-4">
          <p className="break-all font-mono text-xs">{question.id} · {question.fieldType}</p>
          <label className="block text-sm">Question wording<Input value={question.label} onChange={(event) => updateQuestion(group, index, { label: event.target.value })} /></label>
          <label className="block text-sm">Question description<Input value={question.description || ''} onChange={(event) => updateQuestion(group, index, { description: event.target.value })} /></label>
          {(question.options || []).map((option, optionIndex) => <div key={option.id}><label className="block text-sm">Option {option.id}<Input value={option.label} onChange={(event) => updateQuestion(group, index, { options: question.options!.map((value, itemIndex) => itemIndex === optionIndex ? { ...value, label: event.target.value } : value) })} /></label><label className="block text-sm">Option {option.id} description<Input value={option.description || ''} onChange={(event) => updateQuestion(group, index, { options: question.options!.map((value, itemIndex) => itemIndex === optionIndex ? { ...value, description: event.target.value } : value) })} /></label></div>)}
          <details><summary className="cursor-pointer text-sm">Validation, conditions and scoring (read only)</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify({ validation: question.validation, showIf: question.showIf, options: question.options?.map(({ id, metadata }) => ({ id, metadata })) }, null, 2)}</pre></details>
        </article>)}
      </section>)}
    </>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex gap-3"><Button disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save draft'}</Button><Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button></div>
  </div>;
}
function DefinitionSelectors({ locale, grade, onLocale, onGrade }: { locale: DefinitionLocale; grade: DefinitionGrade; onLocale: (value: DefinitionLocale) => void; onGrade: (value: DefinitionGrade) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Language<select className="mt-1 block w-full rounded-md border bg-background p-2" value={locale} onChange={(event) => onLocale(event.target.value as DefinitionLocale)}>{assessmentLocales.map((item) => <option key={item} value={item}>{({ en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil' })[item]}</option>)}</select></label><label className="text-sm font-medium">Grade<select className="mt-1 block w-full rounded-md border bg-background p-2" value={grade} onChange={(event) => onGrade(event.target.value as DefinitionGrade)}>{assessmentGrades.map((item) => <option key={item} value={item}>{item.replace('grade', 'Grade ')}</option>)}</select></label></div>;
}
export function AssessmentDefinitionPreview({ entity }: { entity: AssessmentDefinitionAdmin }) {
  const [locale, setLocale] = useState<DefinitionLocale>('en'); const [grade, setGrade] = useState<DefinitionGrade>('grade8');
  const content = entity.translations[locale];
  return <div className="space-y-4 p-4 sm:p-6"><h2 className="text-lg font-semibold">Assessment {entity.version} · {entity.status}</h2><p className="text-sm text-muted-foreground">Exact saved content. No English fallback and no assessment submission occurs in this preview.</p><DefinitionSelectors locale={locale} grade={grade} onLocale={setLocale} onGrade={setGrade} />
    {!content ? <p role="alert">This language has no definition.</p> : <><details><summary>Assessment instructions and interface wording</summary><dl>{Object.entries(content.ui).filter(([, value]) => typeof value === "string").map(([key, value]) => <div key={key}><dt className="font-medium">{key}</dt><dd>{String(value)}</dd></div>)}</dl></details><h3>{content.ui?.gradeQuestion?.label}</h3><p>{content.ui?.gradeQuestion?.description}</p><ul>{assessmentGrades.map((item) => <li key={item}>{item}: {content.ui?.gradeQuestion?.options?.[item] || 'Missing label'}</li>)}</ul>{[...(content.questions || []), ...(content.stageQuestions?.[grade] || [])].map((question) => <article key={question.id} className="space-y-2 rounded-lg border p-4"><h3 className="font-medium">{question.label || 'Missing question wording'}</h3><p>{question.description}</p><p className="font-mono text-xs">{question.id} · {question.fieldType}</p><ul className="list-disc pl-5">{question.options?.map((option) => <li key={option.id}>{option.label || 'Missing option wording'}{option.description ? ` — ${option.description}` : ''}</li>)}</ul></article>)}</>}
  </div>;
}

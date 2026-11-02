import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Editor, { AssessmentDefinitionPreview } from './AssessmentDefinitionEditor';
import { assessmentDefinitionsConfig, assessmentGrades, assessmentLocales, emptyAssessmentDefinition, importAssessmentDraft, type AssessmentDefinitionAdmin } from '@/lib/admin/configs/assessmentDefinitionsConfig';
function definition(): AssessmentDefinitionAdmin {
  const result = { ...emptyAssessmentDefinition(), id: 'career-discovery-v3-1-0' };
  for (const locale of assessmentLocales) {
    result.translations[locale].ui.gradeQuestion.label = `${locale} grade question`;
    result.translations[locale].questions = [{ id: 'common', label: `${locale} common`, fieldType: 'singleSelect', options: [{ id: 'build', label: `${locale} build`, metadata: { scores: { 'signal:analysis': 1 } } }] }];
    for (const grade of assessmentGrades) {
      result.translations[locale].ui.gradeQuestion.options[grade] = `${locale} ${grade}`;
      result.translations[locale].stageQuestions[grade] = [{ id: `${grade}Focus`, label: `${locale} ${grade} question`, fieldType: 'singleSelect', options: [{ id: 'explore', label: `${locale} explore` }] }];
    }
  }
  return result;
}
it('previews exact questions for every launch language and grade', () => {
  render(<AssessmentDefinitionPreview entity={definition()} />);
  for (const locale of assessmentLocales) for (const grade of assessmentGrades) {
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: locale } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: grade } });
    expect(screen.getByText(`${locale} ${grade} question`)).toBeInTheDocument();
    expect(screen.getByText(`${locale} explore`)).toBeInTheDocument();
  }
});
it('edits wording while preserving stable IDs and scoring, and keeps failed-save edits', async () => {
  const save = vi.fn().mockRejectedValue(new Error('Version conflict'));
  render(<Editor entity={definition()} onSave={save} onCancel={vi.fn()} />);
  fireEvent.change(screen.getAllByLabelText('Question wording')[0], { target: { value: 'Revised common wording' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByRole('alert');
  expect(screen.getAllByLabelText('Question wording')[0]).toHaveValue('Revised common wording');
  expect(save.mock.calls[0][0].translations.en.questions[0]).toMatchObject({ id: 'common', options: [{ id: 'build', metadata: { scores: { 'signal:analysis': 1 } } }] });
  expect(save.mock.calls[0][0]).toMatchObject({ status: 'draft', published: false });
  expect(save.mock.calls[0][0]).not.toHaveProperty('review');
});
it('imports only draft content and keeps storage identity separate from logical definition', () => {
  const imported = importAssessmentDraft({ ...definition(), status: 'published', published: true, review: { reviewedBy: 'fake' }, versionControl: { liveVersionId: 'fake' } });
  expect(imported).toMatchObject({ definitionId: 'career-discovery', documentId: 'career-discovery-v3-1-0', status: 'draft', published: false });
  expect(imported).not.toHaveProperty('review');
  expect(imported).not.toHaveProperty('versionControl');
  expect(assessmentDefinitionsConfig.fromFirestore({ ...definition(), id: 'career-discovery' }, 'career-discovery')).toMatchObject({ id: 'career-discovery', definitionId: 'career-discovery' });
  expect(() => importAssessmentDraft({ ...definition(), translations: { en: {} } })).toThrow('requires grade labels');
});

it('preserves distinct storage identities even when assessment content shares a documentId', () => {
  const content = definition();
  const records = ['career-discovery-v3-1-0', 'assessment-fixture-positive', 'assessment-fixture-negative'].map(id => assessmentDefinitionsConfig.fromFirestore({ ...content }, id));
  expect(records.map(record => assessmentDefinitionsConfig.getId(record))).toEqual(['career-discovery-v3-1-0', 'assessment-fixture-positive', 'assessment-fixture-negative']);
});

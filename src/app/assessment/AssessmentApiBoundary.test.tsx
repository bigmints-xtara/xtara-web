import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { assessmentStageStorageKey, assessmentV2StorageKey, readAssessmentDraft } from '@/lib/assessment-v2';
const mocks = vi.hoisted(() => ({ definition: vi.fn(), evaluate: vi.fn(), push: vi.fn(), sync: vi.fn(), user: null as null | { uid: string; isAnonymous: boolean } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/assessment-api', () => ({ getActiveAssessmentDefinition: mocks.definition, evaluateAssessmentOnServer: mocks.evaluate }));
vi.mock('@/lib/discovery-save', () => ({ savePendingAssessmentToAccount: mocks.sync }));
vi.mock('@/components/assessment/AssessmentEngine', () => ({ default: ({ questions, onComplete }: { questions: { id: string }[]; onComplete: (answers: Record<string, string>) => void }) => <button onClick={() => onComplete({ currentGrade: 'grade11', focus: 'science' })}>Server questions: {questions.map((q) => q.id).join(',')}</button> }));
import Page from './page';
import { XtaraApiError } from '@/lib/api/client';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = null;
  localStorage.clear();
  localStorage.setItem(assessmentStageStorageKey, 'grade11');
});
it('definition outage shows retry instead of bundled questions and retries server', async () => {
  mocks.definition.mockRejectedValueOnce(new XtaraApiError('No published definition is available', 503)).mockResolvedValue({ id: 'career-discovery', stage: 'grade11', locale: 'en', version: '3.1.0', questions: [{ id: 'currentGrade' }, { id: 'focus' }] });
  render(<Page />);
  await screen.findByRole('alert');
  expect(screen.queryByText(/Server questions/)).toBeNull();
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText(/Server questions: currentGrade,focus/);
  expect(mocks.definition).toHaveBeenCalledTimes(2);
});
it('evaluation outage preserves answers and cannot create a local result or navigate', async () => {
  mocks.definition.mockResolvedValue({ id: 'career-discovery', stage: 'grade11', locale: 'en', version: '3.1.0', questions: [{ id: 'currentGrade' }, { id: 'focus' }] });
  mocks.evaluate.mockRejectedValue(new XtaraApiError('Assessment is unavailable', 503));
  render(<Page />);
  fireEvent.click(await screen.findByText(/Server questions/));
  await screen.findByRole('alert');
  expect(localStorage.getItem(assessmentV2StorageKey)).toBeNull();
  expect(JSON.parse(readAssessmentDraft('grade11')!)).toEqual({ currentGrade: 'grade11', focus: 'science' });
  expect(mocks.push).not.toHaveBeenCalled();
  expect(mocks.sync).not.toHaveBeenCalled();
  await waitFor(() => expect(mocks.evaluate).toHaveBeenCalledTimes(1));
});

it('signed-in persistence failure retains server result without navigating or claiming sync', async () => {
  mocks.user = { uid: 'learner', isAnonymous: false };
  mocks.definition.mockResolvedValue({ id: 'career-discovery', stage: 'grade11', locale: 'en', version: '3.1.0', questions: [{ id: 'currentGrade' }, { id: 'focus' }] });
  mocks.evaluate.mockResolvedValue({ version: '3.1.0', stage: 'grade11', areas: [{ id: 'science' }], syncStatus: 'temporary' });
  mocks.sync.mockRejectedValue(new Error('Readback failed'));
  render(<Page />);
  fireEvent.click(await screen.findByText(/Server questions/));
  await screen.findByRole('alert');
  expect(mocks.push).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem(assessmentV2StorageKey)!)).toMatchObject({ syncStatus: 'temporary' });
});

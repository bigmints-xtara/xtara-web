import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Locale } from '@/i18n/config';
import { getCareerOverview } from '@/lib/career-overview-api';
import type { CareerOverview } from '@/types/career-overview';
import SavedCareerReader from './SavedCareerReader';
import { savedCareerCopy } from './saved-career-copy';

vi.mock('@/lib/career-overview-api', () => ({ getCareerOverview: vi.fn() }));

const education = [{ id: 'additional-path-legacy-entry-routes', title: 'Ways to enter', content: <p>Published entry example</p> }];

it.each(['en', 'hi', 'ml', 'ta'] as Locale[])('uses the requested %s layout, language and reviewed study stages', async locale => {
  const copy = savedCareerCopy[locale];
  const overview: CareerOverview = {
    schemaVersion: 1, id: 'software-developer', title: 'Software Engineering', overview: 'Software work', locale,
    translationFallback: locale !== 'en', directionIds: [], whatYouDo: { summary: '', activities: [] },
    skills: [], workplaces: [], jobRoles: [], earnings: { status: 'unavailable', reason: 'reviewed_evidence_required' },
    studyPaths: { grades8To10: [], afterGrade10: [], afterGrade12: [{
      id: 'degree-route', kind: 'education_stage', description: 'A reviewed degree route', gradeIds: [], requirement: '', sourceIds: ['source-1'],
    }] }, sources: [{ id: 'source-1', label: 'Programme handbook', url: 'https://example.edu/programme' }], studyOptions: 'public_pilot',
  };
  vi.mocked(getCareerOverview).mockResolvedValue(overview);
  render(<SavedCareerReader careerId={overview.id} locale={locale} intro={overview.overview} path={education} college={<div />} />);
  expect(await screen.findByText('A reviewed degree route')).toBeVisible();
  expect(getCareerOverview).toHaveBeenCalledWith(overview.id, expect.any(AbortSignal), locale);
  expect(screen.getByRole('heading', { name: copy.stages[2] })).toBeVisible();
  expect(screen.getByText('Published entry example').closest('#how-to-get-there')).toBeTruthy();
  expect(screen.queryByText(copy.school)).toBeNull();
  expect(Boolean(screen.queryByText(copy.englishFallback))).toBe(locale !== 'en');
  expect(screen.getByText('Programme handbook')).toHaveAttribute('href', 'https://example.edu/programme');
  fireEvent.change(screen.getByRole('combobox', { name: copy.jump }), { target: { value: 'courses-and-colleges' } });
  expect(document.activeElement).toBe(document.getElementById('courses-and-colleges'));
});

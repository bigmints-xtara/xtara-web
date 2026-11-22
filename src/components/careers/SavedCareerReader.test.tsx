import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Locale } from '@/i18n/config';
import { getCareerOverview } from '@/lib/career-overview-api';
import type { CareerOverview } from '@/types/career-overview';
import SavedCareerReader from './SavedCareerReader';
import SavedCareerSections from './SavedCareerSections';
import { savedCareerCopy } from './saved-career-copy';

vi.mock('@/lib/career-overview-api', () => ({ getCareerOverview: vi.fn() }));

beforeEach(() => window.history.replaceState(null, '', '/'));

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
  render(<QueryClientProvider client={new QueryClient()}><SavedCareerReader careerId={overview.id} locale={locale} intro={overview.overview} about={[{ id: 'work', title: 'Reviewed work', content: 'Design systems' }]} path={education} college={<div />} /></QueryClientProvider>);
  expect(screen.getByRole('tab', { name: copy.tabs.overview })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('Design systems')).toBeVisible();
  expect(screen.queryByText('A reviewed degree route')).toBeNull();
  fireEvent.keyDown(screen.getByRole('tab', { name: copy.tabs.study }), { key: 'Enter' });
  expect(await screen.findByText('A reviewed degree route')).toBeVisible();
  expect(screen.queryByText('Design systems')).toBeNull();
  expect(getCareerOverview).toHaveBeenCalledWith(overview.id, expect.any(AbortSignal), locale);
  expect(screen.getByRole('heading', { name: copy.stages[2] })).toBeVisible();
  expect(screen.getByText('Published entry example').closest('#how-to-get-there')).toBeTruthy();
  expect(screen.queryByText(copy.school)).toBeNull();
  expect(Boolean(screen.queryByText(copy.englishFallback))).toBe(locale !== 'en');
  expect(screen.getByText('Programme handbook')).toHaveAttribute('href', 'https://example.edu/programme');
  expect(screen.getByRole('tabpanel', { name: copy.tabs.study })).toBeVisible();
});

it('opens a legacy college deep link in the study panel and keeps ungrouped guidance in Overview', () => {
  window.history.replaceState(null, '', '/dream-careers/designer?from=dashboard#courses-and-colleges');
  render(<SavedCareerSections locale="en" sections={[
    { id: 'about-career', title: 'Published duties', content: 'Role detail' },
    { id: 'courses-and-colleges', title: 'Reviewed colleges', content: 'Campus detail' },
    { id: 'future-topic', title: 'Other reviewed guidance', content: 'Reviewed detail' },
  ]} />);
  expect(screen.getByRole('tabpanel', { name: 'Study & colleges' })).toHaveTextContent('Campus detail');
  expect(screen.queryByText('Role detail')).toBeNull();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Overview' }), { key: 'Enter' });
  expect(screen.getByRole('tabpanel', { name: 'Overview' })).toHaveTextContent('Reviewed detail');
  expect(screen.queryByText('Campus detail')).toBeNull();
  expect(window.location.hash).toBe('#career-overview');
});

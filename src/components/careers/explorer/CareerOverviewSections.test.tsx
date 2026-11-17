import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CareerOverviewSections from './CareerOverviewSections';
import ExplorerAccountContext from './ExplorerAccountContext';
import { getCareerOverview, getExplorerAccountContext } from '@/lib/career-overview-api';
import type { CareerOverview } from '@/types/career-overview';
import type { ExplorerCareer } from '@/types/career-explorer';
const auth = vi.hoisted(() => ({ user: null as null | { uid: string; isAnonymous: boolean }, loading: false }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/lib/career-overview-api', () => ({ getCareerOverview: vi.fn(), getExplorerAccountContext: vi.fn() }));
const career: ExplorerCareer = { id: 'software-developer', title: 'Software Developer', summary: 'Build software', directionIds: ['tech'], industryIds: [], activities: ['Published basics'], subjects: [], studyRoutes: [], relatedCareerIds: [], sources: [], translationFallback: false };
const overview: CareerOverview = {
  schemaVersion: 1, id: career.id, title: career.title, overview: career.summary, locale: 'en', translationFallback: false, directionIds: ['tech'],
  whatYouDo: { summary: career.summary, activities: ['Reviewed work'] }, skills: ['Problem solving'], workplaces: ['Software teams'],
  jobRoles: [{ id: 'entry', stage: 'entry', label: 'Starting roles', description: 'Work with an experienced team.', jobTitles: ['Junior developer'], sourceIds: ['source'] }],
  studyPaths: { grades8To10: [{ id: 'subject', kind: 'subject', title: 'Mathematics', description: 'Build a foundation.', gradeIds: ['grade8', 'grade10'], requirement: 'recommended', sourceIds: ['source'] }], afterGrade10: [], afterGrade12: [] },
  earnings: { status: 'unavailable', reason: 'reviewed_evidence_required' }, studyOptions: 'public_pilot', sources: [{ id: 'source', label: 'Reviewed source', url: 'https://example.edu/study' }],
};
const mount = (children: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>{children}</QueryClientProvider>);
beforeEach(() => { auth.user = null; auth.loading = false; vi.mocked(getCareerOverview).mockReset().mockResolvedValue(overview); vi.mocked(getExplorerAccountContext).mockReset(); });
afterEach(cleanup);
it('uses reviewed roles and phase-specific guidance with citations while keeping study tools public', async () => {
  mount(<CareerOverviewSections career={career} />);
  expect(await screen.findByText('Junior developer')).toBeInTheDocument();
  expect(screen.getByText('Grade 8, Grade 10')).toBeInTheDocument();
  for (const label of ['Grades 8–10', 'After grade 10', 'After grade 12']) expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Reviewed source' })).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Explore study options' })).toHaveAttribute('href', expect.stringContaining('/software-developer/study-options'));
  expect(screen.getByText('Reviewed qualitative pay guidance is not available yet.')).toBeInTheDocument();
  expect(screen.queryByText('Published basics')).not.toBeInTheDocument();
});
it('renders reviewed qualitative pay with its population and citation', async () => {
  vi.mocked(getCareerOverview).mockResolvedValue({ ...overview, earnings: {
    status: 'available', description: 'This employer uses published pay grades.',
    measure: 'Published grade', population: 'Public hospital residents',
    geography: 'India', experience: 'Residency', asOf: '2026-01-01', sourceIds: ['source'],
  } });
  mount(<CareerOverviewSections career={career} />);
  expect(await screen.findByText('This employer uses published pay grades.')).toBeInTheDocument();
  expect(screen.getByText(/Public hospital residents/)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Reviewed source' })).toHaveLength(3);
});
it('keeps basics on a failed overview, then retries without substituting made-up fields', async () => {
  vi.mocked(getCareerOverview).mockRejectedValueOnce(new Error('offline'));
  mount(<CareerOverviewSections career={career} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.getByText('Published basics')).toBeInTheDocument();
  expect(screen.queryByText('Junior developer')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Junior developer')).toBeInTheDocument();
});
it('waits for auth before showing guest benefits and leaves anonymous assessment available', () => {
  auth.loading = true;
  const view = mount(<ExplorerAccountContext />);
  expect(screen.getByRole('status')).toHaveTextContent('Checking your account');
  auth.loading = false; view.rerender(<QueryClientProvider client={new QueryClient()}><ExplorerAccountContext /></QueryClientProvider>);
  expect(screen.getByText(/You can try it without an account/)).toBeInTheDocument();
  expect(getExplorerAccountContext).not.toHaveBeenCalled();
});
it('allows saving before assessment and does not treat failed account reads as unassessed', async () => {
  auth.user = { uid: 'student', isAnonymous: false };
  vi.mocked(getExplorerAccountContext).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ assessed: false, direction: { direction: null } });
  mount(<ExplorerAccountContext />);
  expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t check');
  expect(screen.queryByText(/You can save this career now/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.getByText(/You can save this career now/)).toBeInTheDocument());
});
it('shows server-read assessment and direction context', async () => {
  auth.user = { uid: 'student', isAnonymous: false };
  vi.mocked(getExplorerAccountContext).mockResolvedValue({ assessed: true, direction: { direction: null, overview: { id: 'tech', title: 'Technology', summary: '', reasons: [], guidance: [], reflectionPrompt: '', careers: [] } } });
  mount(<ExplorerAccountContext />);
  expect(await screen.findByText('Technology')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open My Direction →' })).toHaveAttribute('href', '/dashboard');
  expect(getExplorerAccountContext).toHaveBeenCalledWith('student');
});

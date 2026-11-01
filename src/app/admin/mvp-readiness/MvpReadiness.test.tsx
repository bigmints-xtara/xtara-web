import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Page from './page';
import { xtaraApi } from '@/lib/api/client';
vi.mock('@/lib/api/client', () => ({ xtaraApi: { get: vi.fn() } }));
beforeEach(() => vi.mocked(xtaraApi.get).mockReset());
it('reads admin API and separates publication from launch readiness', async () => {
  vi.mocked(xtaraApi.get).mockResolvedValue({ totals: { careers: 1, published: 1, ready: 0 }, notice: 'No approval implied.', records: [{ id: 'doctor', title: 'Doctor', status: 'published', ready: false, gradeCoverage: ['grade10'], localeCoverage: ['en'], sourceReview: { total: 2, reviewed: 0, expired: 0 }, blockers: ['Translations need review.'], publicationErrors: [] }] });
  render(<Page />);
  expect(await screen.findByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
  expect(xtaraApi.get).toHaveBeenCalledWith('/admin/career-catalog/mvp-readiness');
  expect(screen.getByRole('link', { name: 'Review content' })).toHaveAttribute('href', '/admin/dream-careers/doctor');
  expect(screen.getByText('Verified for this MVP').parentElement).toHaveTextContent('0');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unknown' } });
  expect(screen.getByRole('status')).toHaveTextContent('No careers match');
});
it('retries API failure without displaying a fabricated catalogue', async () => {
  vi.mocked(xtaraApi.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ totals: { careers: 0, published: 0, ready: 0 }, notice: '', records: [] });
  render(<Page />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No careers are stored in this catalogue yet.')).toBeInTheDocument();
});

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { XtaraApiError, xtaraApi } from '@/lib/api/client';
import Page from './page';

vi.mock('@/lib/api/client', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api/client')>(),
  xtaraApi: { post: vi.fn() },
}));

const releaseId = 'a'.repeat(64);
const preview = { releaseId, candidates: [{
  id: 'engineering', title: 'Engineering', english: {
    summary: 'Design and test practical solutions.', dailyWork: ['Test designs.'],
    skillsToBuild: ['Technical analysis'], entryRoutes: ['Explore an engineering programme.'],
    workSetting: 'Design offices', tradeoffs: ['Expect to revise prototypes.'],
  },
}] };
const post = vi.mocked(xtaraApi.post);
beforeEach(() => post.mockReset());

it('shows the exact six-field preview and publishes its bound release', async () => {
  post.mockResolvedValueOnce(preview).mockResolvedValueOnce({ releaseId, versions: [{ id: 'engineering', versionId: 'v2' }] });
  render(<Page />);
  expect(screen.queryByRole('button', { name: /approve and publish/i })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Preview drafts' }));
  const publish = await screen.findByRole('button', { name: 'Approve and publish 1 English draft' });
  fireEvent.click(screen.getByText('Engineering'));
  expect(screen.getByText('Explore an engineering programme.')).toBeInTheDocument();
  fireEvent.click(publish);
  expect(await screen.findByText('Core English versions published and verified (1).')).toBeInTheDocument();
  expect(post.mock.calls).toEqual([
    ['/api/v1/admin/career-catalog/core-english-release', { action: 'preview' }],
    ['/api/v1/admin/career-catalog/core-english-release', { action: 'publish', releaseId }],
  ]);
});

it('requires a fresh preview when the saved draft changes', async () => {
  post.mockResolvedValueOnce(preview).mockRejectedValueOnce(new XtaraApiError('The drafts changed.', 409));
  render(<Page />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview drafts' }));
  fireEvent.click(await screen.findByRole('button', { name: /approve and publish/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('The drafts changed.');
  expect(screen.queryByRole('button', { name: /approve and publish/i })).toBeNull();
});

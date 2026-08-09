import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';

import type { AdminPage } from '@/lib/services/adminService';
import type { GameInstance } from '@/types/admin';

const service = vi.hoisted(() => ({
  streamPage: vi.fn(),
}));
const approval = vi.hoisted(() => ({ approve: vi.fn() }));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock('@/lib/services/adminService', () => ({
  AdminService: class {
    streamPage = service.streamPage;
  },
}));
vi.mock('@/lib/admin-content-approval', () => ({ adminContentApprovalApi: approval }));
vi.mock('@/context/AuthContext', () => ({ useAuth: auth.useAuth }));

import { gamesConfig } from '@/lib/admin/configs/gamesConfig';
import AdminMasterDetail from './AdminMasterDetail';

function page(pageNumber: number): AdminPage<GameInstance> {
  const start = (pageNumber - 1) * 20;
  const count = pageNumber === 3 ? 5 : 20;
  return {
    items: Array.from({ length: count }, (_, index) => ({
      id: `game-${start + index + 1}`,
      title: `Game ${start + index + 1}`,
      mode: 'quiz' as const,
      isPublished: false,
      published: false,
      draft: true,
      inReview: false,
      futureDirectionIds: [],
      dreamCareerIds: [],
      skillIds: [],
      gradeStages: [],
      topics: [],
      schedule: { startDateTime: new Date(), endDateTime: new Date() },
    })),
    total: 45,
    page: pageNumber,
    limit: 20,
    totalPages: 3,
    availableDomains: ['all', 'quiz'],
  };
}

describe('AdminMasterDetail pagination', () => {
  const push = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    auth.useAuth.mockReturnValue({ userProfile: { adminRole: 'super_admin' } });
    approval.approve.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));
    service.streamPage.mockReset();
    service.streamPage.mockImplementation((params, callback: (value: AdminPage<GameInstance>) => void) => {
      callback(page(params.page));
      return () => undefined;
    });
  });

  it('renders one server page and requests the next page on demand', async () => {
    render(
      <AdminMasterDetail
        config={gamesConfig}
        renderEditor={() => null}
      />,
    );

    await waitFor(() => expect(screen.getByText('Showing 1–20 of 45')).toBeInTheDocument());
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(service.streamPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
      expect.any(Function),
      expect.any(Function),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument());
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(service.streamPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 20 }),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('opens new and existing records on dedicated routes', async () => {
    render(<AdminMasterDetail config={gamesConfig} renderEditor={() => null} />);

    await screen.findByText('Game 1');
    expect(screen.getByRole('link', { name: 'New Game' })).toHaveAttribute('href', '/admin/games/new');

    fireEvent.click(screen.getByRole('button', { name: 'Open Game 1' }));
    expect(push).toHaveBeenCalledWith('/admin/games/game-1');
  });

  it('selects the current page and keeps only failed records selected after bulk approval', async () => {
    const approvalConfig = {
      ...gamesConfig,
      entityName: 'Dream Career',
      entityNamePlural: 'Dream Careers',
      collectionName: 'dream_careers',
      supportsApproval: true,
    };
    approval.approve.mockResolvedValue({
      approved: Array.from({ length: 19 }, (_, index) => ({ id: `game-${index + 1}`, reviewedBy: 'admin', reviewedAt: '2026-08-03T08:00:00.000Z' })),
      failed: [{ id: 'game-20', error: 'Malayalam title and summary are required' }],
    });

    render(<AdminMasterDetail config={approvalConfig} renderEditor={() => null} />);
    await screen.findByText('Game 1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all records on this page' }));
    expect(screen.getByText('20 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Approve selected/ }));
    await waitFor(() => expect(approval.approve).toHaveBeenCalledWith('dream_careers', Array.from({ length: 20 }, (_, index) => `game-${index + 1}`)));
    expect(await screen.findByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('game-20: Malayalam title and summary are required');
    expect(screen.getByRole('checkbox', { name: 'Select Game 20' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Game 1' })).not.toBeChecked();
  });

  it('shows a rejected approval request without leaving the form stuck', async () => {
    approval.approve.mockRejectedValue(new Error('Approval service unavailable'));
    const approvalConfig = { ...gamesConfig, collectionName: 'dream_careers', supportsApproval: true };
    render(<AdminMasterDetail config={approvalConfig} renderEditor={() => null} />);
    await screen.findByText('Game 1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Game 1' }));
    fireEvent.click(screen.getByRole('button', { name: /Approve selected/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Approval service unavailable');
    expect(screen.getByRole('button', { name: /Approve selected/ })).toBeEnabled();
  });
});

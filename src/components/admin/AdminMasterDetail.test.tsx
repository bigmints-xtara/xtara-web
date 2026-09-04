import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import type { GameInstance } from '@/types/admin';

const service = vi.hoisted(() => ({ getTable: vi.fn(), bulk: vi.fn(), duplicate: vi.fn(), publish: vi.fn(), unpublish: vi.fn(), delete: vi.fn() }));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('@/lib/services/adminService', () => ({ AdminService: class { getTable = service.getTable; bulk = service.bulk; duplicate = service.duplicate; publish = service.publish; unpublish = service.unpublish; delete = service.delete } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: auth.useAuth }));

import { gamesConfig } from '@/lib/admin/configs/gamesConfig';
import AdminMasterDetail from './AdminMasterDetail';

function game(id: string): GameInstance { return { id, title: `Game ${id}`, mode: 'quiz', isPublished: false, published: false, draft: true, inReview: false, futureDirectionIds: [], dreamCareerIds: [], skillIds: [], gradeStages: [], topics: [], schedule: { startDateTime: new Date(), endDateTime: new Date() } }; }
function table(page = 1) { return { items: [game(String(page))], page, pageSize: 20, total: 45, totalPages: 3, facets: [{ field: 'status', values: [{ value: 'draft', label: 'Draft', count: 45 }] }], groups: [], summaries: [{ key: 'total', label: 'Matching', value: 45 }] }; }

describe('AdminMasterDetail', () => {
  const push = vi.fn();
  beforeEach(() => { window.history.replaceState({}, '', '/admin/games'); Object.values(service).forEach((mock) => mock.mockReset()); vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>); auth.useAuth.mockReturnValue({ userProfile: { adminRole: 'super_admin' } }); service.getTable.mockImplementation(async (query) => table(query.page)); service.bulk.mockResolvedValue({ action: 'publish', matched: 1, succeeded: [{ id: '1', title: 'Game 1' }], failed: [] }); });

  it('loads server table pages and opens dedicated record routes', async () => {
    render(<AdminMasterDetail config={gamesConfig} renderEditor={() => null} />);
    expect(await screen.findByText('Game 1')).toBeInTheDocument();
    expect(screen.getByText('1–20 of 45')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Game 2')).toBeInTheDocument();
    expect(service.getTable).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Game 2' }));
    expect(push).toHaveBeenCalledWith('/admin/games/2');
  });

  it('sends explicit table selections to generalized bulk operations', async () => {
    render(<AdminMasterDetail config={{ ...gamesConfig, supportsApproval: true }} renderEditor={() => null} />);
    await screen.findByText('Game 1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish selected' }));
    await waitFor(() => expect(service.bulk).toHaveBeenCalledWith('publish', { mode: 'ids', ids: ['1'] }));
    expect(await screen.findByRole('status')).toHaveTextContent('1 succeeded');
  });

  it('does not offer legacy publish actions for version-controlled content', async () => {
    render(<AdminMasterDetail config={{ ...gamesConfig, supportsApproval: true, versionControlled: true }} renderEditor={() => null} />);
    await screen.findByText('Game 1');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select 1' }));
    expect(screen.queryByRole('button', { name: 'Publish selected' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve selected' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Game 1' }));
    expect(screen.queryByRole('menuitem', { name: 'Publish' })).not.toBeInTheDocument();
  });
});

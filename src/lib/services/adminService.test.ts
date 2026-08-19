import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));

import { gamesConfig } from '@/lib/admin/configs/gamesConfig';
import { AdminService } from './adminService';

describe('AdminService pagination', () => {
  beforeEach(() => api.get.mockReset());

  it('requests one filtered page and preserves server pagination metadata', async () => {
    api.get.mockResolvedValueOnce({
      data: [{
        id: 'game-21',
        title: 'Page two game',
        mode: 'quiz',
        isPublished: false,
        published: false,
        draft: true,
        inReview: false,
        schedule: {
          startDateTime: '2026-07-22T08:00:00.000Z',
          endDateTime: '2026-07-29T08:00:00.000Z',
        },
      }],
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
      availableDomains: ['all', 'quiz', 'puzzle'],
    });

    const result = await new AdminService(gamesConfig).getPage({
      page: 2,
      limit: 20,
      status: 'draft',
      domain: 'quiz',
      searchQuery: 'page two',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/admin/content/game_instances?page=2&limit=20&status=draft&domain=quiz&q=page+two',
    );
    expect(result).toMatchObject({
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
      availableDomains: ['all', 'quiz', 'puzzle'],
    });
    expect(result.items.map((item) => item.id)).toEqual(['game-21']);
  });

  it('normalizes the legacy list envelope during staggered API and web deployments', async () => {
    api.get.mockResolvedValueOnce({
      data: [{ id: 'game-1', title: 'Legacy game', mode: 'quiz', published: false, draft: true, inReview: false, schedule: {} }],
      total: 1, page: 1, limit: 20, totalPages: 1, availableDomains: ['quiz'],
    });
    const result = await new AdminService(gamesConfig).getTable({
      page: 1, pageSize: 20, search: '', filters: {}, sort: { field: 'updatedAt', direction: 'desc' },
    });
    expect(result.items.map((item) => item.id)).toEqual(['game-1']);
    expect(result).toMatchObject({ total: 1, pageSize: 20, facets: [], groups: [], summaries: [] });
  });
});

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
});

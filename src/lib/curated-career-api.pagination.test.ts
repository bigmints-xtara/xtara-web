import { expect, it, vi } from 'vitest';
import { xtaraApi } from './api/client';
import { getPublishedDreamCareers } from './curated-career-api';
vi.mock('./api/client', () => ({ xtaraApi: { get: vi.fn() } }));
it('loads every catalogue page and deduplicates repeated records', async () => {
  vi.mocked(xtaraApi.get).mockResolvedValueOnce({ items: [{ id: 'first' }], pagination: { totalPages: 2 } })
    .mockResolvedValueOnce({ items: [{ id: 'first' }, { id: 'last' }] });
  expect((await getPublishedDreamCareers()).map((career) => career.id)).toEqual(['first', 'last']);
  expect(xtaraApi.get).toHaveBeenNthCalledWith(2, '/dream-careers?limit=100&page=2');
});

import { beforeEach, expect, it, vi } from 'vitest';
import { getStateDetails, getStates } from './location';
const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));
beforeEach(() => vi.clearAllMocks());
it('preserves successful API state lists, including an empty list', async () => {
  api.get.mockResolvedValueOnce({ items: ['Kerala'] }).mockResolvedValueOnce({ items: [] });
  expect(await getStates()).toEqual(['Kerala']);
  expect(await getStates()).toEqual([]);
});
it('retains partial detail availability and does not invent city choices', async () => {
  api.get.mockResolvedValue({ districts: ['Ernakulam'], cities: [], unavailable: true, availability: { districts: 'available', cities: 'unavailable' } });
  expect(await getStateDetails('Kerala')).toMatchObject({ districts: ['Ernakulam'], cities: [], unavailable: true });
});
it('provides bounded geography fallback only on failed state requests', async () => {
  api.get.mockRejectedValue(new Error('offline'));
  expect(await getStates()).toHaveLength(36);
  expect(await getStateDetails('Kerala')).toEqual({ districts: [], cities: [], unavailable: true });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: { get: mocks.get } }));
import { getPostAuthDestination } from './auth';
describe('post-login journey', () => {
  beforeEach(() => mocks.get.mockReset());
  it('returns a learner with an assessment to My Direction', async () => {
    mocks.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ assessment: { id: 'saved' } });
    expect(await getPostAuthDestination()).toBe('/dashboard');
  });
  it('returns a learner with a career path to My Direction', async () => {
    mocks.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ items: [{ id: 'saved' }] });
    expect(await getPostAuthDestination()).toBe('/dashboard');
  });
  it('starts a new learner at assessment', async () => {
    mocks.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ assessment: null });
    expect(await getPostAuthDestination()).toBe('/assessment');
  });
  it('retains the educator workspace destination', async () => {
    mocks.get.mockResolvedValueOnce({ membership: { role: 'teacher' } });
    expect(await getPostAuthDestination()).toBe('/organization');
  });
});

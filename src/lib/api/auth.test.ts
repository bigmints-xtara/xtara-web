import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: { get: mocks.get } }));

import { getPostAuthDestination } from './auth';

describe('post-login journey', () => {
  beforeEach(() => mocks.get.mockReset());

  it('lets Home select the next action for a learner', async () => {
    mocks.get.mockResolvedValueOnce({ membership: { role: 'student' } });
    expect(await getPostAuthDestination()).toBe('/dashboard');
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith('/organizations/context');
  });

  it('lets Home handle a pending account read after sign-in', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Offline'));
    expect(await getPostAuthDestination()).toBe('/dashboard');
  });

  it('retains the educator workspace destination', async () => {
    mocks.get.mockResolvedValueOnce({ membership: { role: 'teacher' } });
    expect(await getPostAuthDestination()).toBe('/organization');
  });
});

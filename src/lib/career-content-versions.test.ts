import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));

import { careerContentVersionsApi, type CareerContentVersion } from './career-content-versions';

const version: CareerContentVersion = {
  id: 'dream_careers__software-engineer__v000002', schemaVersion: 1,
  collectionName: 'dream_careers', recordId: 'software-engineer', revision: 2,
  lockVersion: 3, status: 'approved', content: {}, basedOnVersionId: null,
  createdAt: '2026-08-23T08:00:00.000Z', createdBy: 'editor',
  updatedAt: '2026-08-23T09:00:00.000Z', updatedBy: 'reviewer',
};

describe('careerContentVersionsApi', () => {
  beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()));

  it('uses the authenticated Admin version contract for history and promotion', async () => {
    api.get.mockResolvedValue({ live: null, active: version, versions: [version] });
    api.post.mockResolvedValue({ ...version, status: 'live' });

    await careerContentVersionsApi.history('dream_careers', 'software/engineer');
    await careerContentVersionsApi.action('dream_careers', 'software/engineer', version, 'promote');

    expect(api.get).toHaveBeenCalledWith('/admin/content/dream_careers/software%2Fengineer/versions');
    expect(api.post).toHaveBeenCalledWith(
      '/admin/content/dream_careers/software%2Fengineer/versions/dream_careers__software-engineer__v000002/promote',
      { lockVersion: 3 },
    );
  });

  it('sends the optimistic lock when saving a draft', async () => {
    api.patch.mockResolvedValue(version);
    await careerContentVersionsApi.saveDraft('future_directions', 'technology', version, { title: 'Changed' });
    expect(api.patch).toHaveBeenCalledWith(
      '/admin/content/future_directions/technology/versions/dream_careers__software-engineer__v000002',
      { content: { title: 'Changed' }, lockVersion: 3 },
    );
  });
});

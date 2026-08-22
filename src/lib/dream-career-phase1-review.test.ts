import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));

import { dreamCareerPhase1ReviewApi, type DreamCareerPhase1ReviewDetail } from './dream-career-phase1-review';

const hashes = {
  canonicalSourceSha256: 'a'.repeat(64),
  guideSha256: 'b'.repeat(64),
  taxonomySha256: 'c'.repeat(64),
  relationshipSha256: 'd'.repeat(64),
};

const detail = {
  schemaVersion: 1,
  reviewId: 'dream-career-phase-1',
  careerId: 'administrative-officer',
  canonicalOrder: 0,
  sourceHashes: hashes,
  canonicalDirectionIds: ['business', 'design', 'health', 'science', 'society', 'technology'],
  status: 'draft',
  draft: { primaryDirectionId: 'business', secondaryDirectionIds: ['society'], updatedBy: 'server-owned', updatedAt: '2026-08-22T10:00:00.000Z' },
  finalDecision: null,
  version: 2,
  lastMutation: null,
  createdAt: '2026-08-22T09:00:00.000Z',
  updatedAt: '2026-08-22T10:00:00.000Z',
  careerDisplay: { careerId: 'administrative-officer', title: 'Administrative Officer', sourcePath: 'catalogue/administrative-officer.json', inventoryVersion: 'dream-career-phase1-review-inventory-v1', releaseId: 'release-1', sourceHashes: hashes },
  sourceBinding: { status: 'current', isCurrent: true, isStale: false, isMismatch: false, boundSourceHashes: hashes, currentSourceHashes: hashes, mismatchFields: [], blockers: [] },
  directionOptions: [],
} satisfies DreamCareerPhase1ReviewDetail;

describe('dreamCareerPhase1ReviewApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends only allowed draft fields then returns the persisted detail readback', async () => {
    api.put.mockResolvedValue({ ...detail, version: 2 });
    api.get.mockResolvedValue({ ...detail, version: 2 });

    const result = await dreamCareerPhase1ReviewApi.saveDraft(detail, 'business', ['society'], 'draft-key');

    expect(api.put).toHaveBeenCalledWith('/admin/dream-career-phase1-review/administrative-officer/draft', {
      expectedVersion: 2,
      idempotencyKey: 'draft-key',
      sourceHashes: hashes,
      primaryDirectionId: 'business',
      secondaryDirectionIds: ['society'],
    });
    expect(api.get).toHaveBeenCalledWith('/admin/dream-career-phase1-review/administrative-officer');
    expect(result.version).toBe(2);
  });

  it('does not report mutation success when persisted readback fails', async () => {
    api.put.mockResolvedValue({ ...detail, version: 3 });
    api.get.mockRejectedValue(new Error('Readback unavailable'));

    await expect(dreamCareerPhase1ReviewApi.saveDraft(detail, 'science', [], 'draft-key')).rejects.toThrow('Readback unavailable');
  });

  it('finalizes with confirmation only then performs detail readback', async () => {
    api.post.mockResolvedValue({ ...detail, status: 'finalized', version: 3 });
    api.get.mockResolvedValue({ ...detail, status: 'finalized', version: 3 });

    await dreamCareerPhase1ReviewApi.finalize(detail, 'finalize-key');

    expect(api.post).toHaveBeenCalledWith('/admin/dream-career-phase1-review/administrative-officer/finalize', {
      expectedVersion: 2,
      idempotencyKey: 'finalize-key',
      sourceHashes: hashes,
      confirmed: true,
    });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('requests authority documents without caller-supplied authority fields', async () => {
    api.post.mockResolvedValueOnce({ authorityType: 'dream-career-future-direction-mapping-authority' });
    api.post.mockResolvedValueOnce({ authorityType: 'dream-career-taxonomy-rejection-authority' });

    await dreamCareerPhase1ReviewApi.exportFutureDirections();
    await dreamCareerPhase1ReviewApi.exportTaxonomyRejection();

    expect(api.post).toHaveBeenNthCalledWith(1, '/admin/dream-career-phase1-review/export/future-directions', {});
    expect(api.post).toHaveBeenNthCalledWith(2, '/admin/dream-career-phase1-review/export/taxonomy-rejection', {});
  });
});

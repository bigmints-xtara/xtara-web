import { beforeEach, expect, it, vi } from 'vitest';
import { getReviewSnapshot, recordReviewEvidence, revokeReviewEvidence, type ReviewEvidenceInput, type ReviewSnapshot } from './career-review-evidence';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));
const target = { collection: 'dream_careers', recordId: 'doctor', versionId: 'v2' };
const input: ReviewEvidenceInput = { expectedLockVersion: 2, expectedContentChecksum: 'digest', idempotencyKey: 'request-1', kind: 'grade', scope: { grades: ['grade11'], locales: [], jurisdictions: [] }, contentPaths: ['studentGuide.aboutCareer.whatYouDo'], sourceIds: ['official'], supportedClaims: ['Claim checked'], applicabilityRationale: 'Applies to grade11.' };
const snapshot: ReviewSnapshot = { versionId: 'v2', lockVersion: 2, contentChecksum: 'digest', status: 'inReview', content: {}, receipts: [{ ...input, id: 'receipt1', versionId: 'v2', contentChecksum: 'digest', reviewedBy: 'human-admin', reviewedAt: '2026-11-02', revoked: false }], coverage: { complete: false, blockers: ['Missing translations'] }, allowedScopes: { grades: ['grade11'], locales: ['en'], jurisdictions: ['Kerala'] } };
beforeEach(() => { vi.clearAllMocks(); api.post.mockResolvedValue(snapshot); });
it('requires independent matching receipt readback after recording', async () => {
  api.get.mockResolvedValue({ ...snapshot, receipts: [] });
  await expect(recordReviewEvidence(target, input)).rejects.toThrow('readback');
  api.get.mockResolvedValue(snapshot);
  await expect(recordReviewEvidence(target, input)).resolves.toEqual(snapshot);
  expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/versions/v2/review-evidence'), input);
  expect(api.post.mock.calls[0][1]).not.toHaveProperty('reviewedBy');
});
it('rejects changed content and wrong version readback', async () => {
  api.get.mockResolvedValue({ ...snapshot, contentChecksum: 'new' });
  await expect(recordReviewEvidence(target, input)).rejects.toThrow('revision changed');
  api.get.mockResolvedValue({ ...snapshot, versionId: 'other' });
  await expect(getReviewSnapshot(target)).rejects.toThrow('different content version');
});
it('verifies revocation persisted before returning success', async () => {
  const request = { expectedLockVersion: 2, expectedContentChecksum: 'digest', idempotencyKey: 'revoke1', reason: 'Evidence superseded' };
  api.get.mockResolvedValue(snapshot);
  await expect(revokeReviewEvidence(target, 'receipt1', request)).rejects.toThrow('readback');
  api.get.mockResolvedValue({ ...snapshot, receipts: snapshot.receipts.map((item) => ({ ...item, revoked: true })) });
  await expect(revokeReviewEvidence(target, 'receipt1', request)).resolves.toMatchObject({ receipts: [{ revoked: true }] });
});

it('accepts an API lock increment only when independent readback matches it', async () => {
  const advanced = { ...snapshot, lockVersion: 3 };
  api.post.mockResolvedValue(advanced);
  api.get.mockResolvedValue(advanced);
  await expect(recordReviewEvidence(target, input)).resolves.toMatchObject({ lockVersion: 3 });
  api.get.mockResolvedValue({ ...advanced, lockVersion: 4 });
  await expect(recordReviewEvidence(target, input)).rejects.toThrow('revision changed');
});

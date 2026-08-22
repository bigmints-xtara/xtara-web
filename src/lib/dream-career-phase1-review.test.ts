import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));

import {
  authorityArtifactDownload,
  createDraftReviewCommand,
  createFinalizeReviewCommand,
  dreamCareerPhase1ReviewApi,
  parseDreamCareerPhase1Detail,
  parseDreamCareerPhase1Queue,
  parseDreamCareerPhase1Summary,
  type DreamCareerPhase1AuthorityArtifact,
  type DreamCareerPhase1ReviewDetail,
} from './dream-career-phase1-review';

const ids = ['business', 'design', 'health', 'science', 'society', 'technology'];
const hashes = {
  canonicalSourceSha256: 'a'.repeat(64), guideSha256: 'b'.repeat(64),
  taxonomySha256: 'c'.repeat(64), relationshipSha256: 'd'.repeat(64),
};
const options = ids.map((directionId, canonicalOrder) => ({
  directionId, canonicalOrder, defaultLocale: 'en', label: `Server ${directionId}`,
  localizedLabels: { en: `Server ${directionId}`, ml: `ML ${directionId}`, ta: `TA ${directionId}` },
  description: `Server description ${directionId}`, sourceVersion: 'future-directions-v1',
}));

function queueRecord(index: number, status: 'pending' | 'draft' | 'finalized' = 'pending') {
  const careerId = `career-${String(index + 1).padStart(3, '0')}`;
  return {
    schemaVersion: 1, reviewId: 'dream-career-phase-1', careerId, canonicalOrder: index,
    sourceHashes: hashes, canonicalDirectionIds: ids, status,
    draft: status === 'draft' ? { primaryDirectionId: 'business', secondaryDirectionIds: ['society'], updatedBy: 'server-owned', updatedAt: '2026-08-22T10:00:00.000Z' } : null,
    finalDecision: status === 'finalized' ? { futureDirectionIds: ['business', 'society'], reviewerId: 'admin_user:11111111-1111-4111-8111-111111111111', reviewedAt: '2026-08-22T11:00:00.000Z' } : null,
    version: status === 'pending' ? 0 : 1, lastMutation: null,
    createdAt: '2026-08-22T09:00:00.000Z', updatedAt: '2026-08-22T10:00:00.000Z',
    careerDisplay: { careerId, title: `Canonical Career ${index + 1}`, description: `Canonical source snapshot ${index + 1}`, sourcePath: `catalogue/${careerId}.json`, inventoryVersion: 'dream-career-phase1-review-inventory-v1', releaseId: 'release-1', sourceHashes: hashes },
    sourceBinding: { status: 'current', isCurrent: true, isStale: false, isMismatch: false, boundSourceHashes: hashes, currentSourceHashes: hashes, mismatchFields: [], blockers: [] },
  };
}

function queueValue() {
  const records = Array.from({ length: 229 }, (_, index) => queueRecord(index, index === 0 ? 'draft' : index === 1 ? 'finalized' : 'pending'));
  return { reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 227, draft: 1, finalized: 1 }, blockers: ['incomplete_human_review'], directionOptions: options, records };
}

function detailValue(): DreamCareerPhase1ReviewDetail {
  return { ...queueRecord(0, 'draft'), directionOptions: options } as DreamCareerPhase1ReviewDetail;
}

function mutationValue(command: ReturnType<typeof createDraftReviewCommand> | ReturnType<typeof createFinalizeReviewCommand>) {
  const detail = detailValue();
  const { careerDisplay: _careerDisplay, sourceBinding: _sourceBinding, directionOptions: _directionOptions, ...record } = detail;
  void _careerDisplay; void _sourceBinding; void _directionOptions;
  const common = { ...record, version: command.body.expectedVersion + 1, lastMutation: { idempotencyKey: command.body.idempotencyKey, commandSha256: '9'.repeat(64) }, updatedAt: '2026-08-22T12:00:00.000Z' };
  if (command.kind === 'draft') return { ...common, status: 'draft' as const, draft: { primaryDirectionId: command.body.primaryDirectionId, secondaryDirectionIds: command.body.secondaryDirectionIds, updatedBy: 'server-owned', updatedAt: '2026-08-22T12:00:00.000Z' }, finalDecision: null };
  return { ...common, status: 'finalized' as const, finalDecision: { futureDirectionIds: ['business', 'society'], reviewerId: 'admin_user:22222222-2222-4222-8222-222222222222', reviewedAt: '2026-08-22T12:00:00.000Z' } };
}

function persistedDetail(command: ReturnType<typeof createDraftReviewCommand> | ReturnType<typeof createFinalizeReviewCommand>) {
  return { ...mutationValue(command), careerDisplay: detailValue().careerDisplay, sourceBinding: detailValue().sourceBinding, directionOptions: options };
}

function sha(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function futureArtifact(): DreamCareerPhase1AuthorityArtifact {
  const reviewer = { reviewerId: 'admin_user:11111111-1111-4111-8111-111111111111', reviewedAt: '2026-08-22T12:00:00.000Z' };
  const careerMappings = Array.from({ length: 229 }, (_, index) => ({ careerId: `career-${String(index + 1).padStart(3, '0')}`, futureDirectionIds: [ids[index % ids.length]], ...reviewer }));
  const authority = {
    schemaVersion: 1, authorityType: 'dream-career-future-direction-mapping-authority', authorityVersion: '1.0.0', reviewer,
    canonicalDirectionIds: ids,
    careerMappings,
    directionRoles: ids.map((directionId) => ({ directionId, careerIds: careerMappings.filter((mapping) => mapping.futureDirectionIds.includes(directionId)).map((mapping) => mapping.careerId) })),
  };
  const artifactJson = `${JSON.stringify(authority)}\n`;
  return {
    artifactSchemaVersion: 1, authorityType: authority.authorityType, authoritySchemaVersion: 1, authorityVersion: '1.0.0',
    filename: 'dream-career-phase1-future-direction-mapping-authority-v1.json', mediaType: 'application/json', artifactJson,
    artifactSha256: sha(artifactJson), authority,
  } as DreamCareerPhase1AuthorityArtifact;
}

function taxonomyArtifact(): DreamCareerPhase1AuthorityArtifact {
  const authority = {
    schemaVersion: 1, authorityType: 'dream-career-taxonomy-rejection-authority', authorityVersion: '1.0.0',
    reviewer: { reviewerId: 'admin_user:11111111-1111-4111-8111-111111111111', reviewedAt: '2026-08-22T12:00:00.000Z' },
    registryVersion: 'career-tags-v1.0.0', registrySha256: 'e'.repeat(64), releaseId: 'release-1', releaseContentSha256: 'f'.repeat(64),
    legacyFamily: 'traits', category: 'traitIds', rawValue: 'ytical', assignmentCount: 1, tagId: null, disposition: 'rejected',
    sourcePath: 'dream-career/language-policy-officer.json', sourceSha256: '1'.repeat(64),
  };
  const artifactJson = `${JSON.stringify(authority)}\n`;
  return {
    artifactSchemaVersion: 1, authorityType: authority.authorityType, authoritySchemaVersion: 1, authorityVersion: '1.0.0',
    filename: 'dream-career-phase1-taxonomy-rejection-authority-v1.json', mediaType: 'application/json', artifactJson,
    artifactSha256: sha(artifactJson), authority,
  } as DreamCareerPhase1AuthorityArtifact;
}

describe('Dream Career Phase 1 runtime validation', () => {
  it('accepts a consistent 229-record queue and rejects extra or inconsistent JSON', () => {
    expect(parseDreamCareerPhase1Queue(queueValue()).records).toHaveLength(229);
    expect(() => parseDreamCareerPhase1Queue({ ...queueValue(), callerOwned: true })).toThrow(/unexpected|invalid/i);
    expect(() => parseDreamCareerPhase1Queue({ ...queueValue(), counts: { total: 229, pending: 229, draft: 0, finalized: 0 } })).toThrow(/count|status/i);
    const malformed = structuredClone(queueValue());
    malformed.records[0].sourceHashes.guideSha256 = 'not-a-hash';
    expect(() => parseDreamCareerPhase1Queue(malformed)).toThrow(/sha-256|hash/i);
  });

  it('rejects malformed detail relationships and source-binding flags', () => {
    expect(parseDreamCareerPhase1Detail(detailValue()).directionOptions).toHaveLength(6);
    const malformed = detailValue();
    malformed.sourceBinding = { ...malformed.sourceBinding, status: 'stale', isCurrent: true };
    expect(() => parseDreamCareerPhase1Detail(malformed)).toThrow(/source binding/i);
    expect(() => parseDreamCareerPhase1Detail({ ...detailValue(), unexpected: true })).toThrow(/unexpected|invalid/i);
  });

  it('validates the complete summary independently of queue data', () => {
    const summary = { reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 0, draft: 0, finalized: 229 }, blockers: [] };
    expect(parseDreamCareerPhase1Summary(summary).counts.finalized).toBe(229);
    expect(() => parseDreamCareerPhase1Summary({ ...summary, counts: { total: 229, pending: 1, draft: 0, finalized: 229 } })).toThrow(/count/i);
    expect(() => parseDreamCareerPhase1Summary({ ...summary, counts: { total: 229, pending: 229, draft: 0, finalized: 0 }, blockers: [] })).toThrow(/complete|blocker|finalized/i);
    expect(() => parseDreamCareerPhase1Summary({ ...summary, counts: { total: 228, pending: 228, draft: 0, finalized: 0 }, blockers: ['incomplete_human_review'] })).toThrow(/229|total/i);
  });
});

describe('dreamCareerPhase1ReviewApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates queue, detail, and /complete responses at the adapter boundary', async () => {
    api.get.mockResolvedValueOnce(queueValue()).mockResolvedValueOnce(detailValue()).mockResolvedValueOnce({ reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 227, draft: 1, finalized: 1 }, blockers: ['incomplete_human_review'] });
    await expect(dreamCareerPhase1ReviewApi.listQueue()).resolves.toMatchObject({ expectedTotal: 229 });
    await expect(dreamCareerPhase1ReviewApi.getDetail('career-001')).resolves.toMatchObject({ careerId: 'career-001' });
    await expect(dreamCareerPhase1ReviewApi.getComplete()).resolves.toMatchObject({ counts: { finalized: 1 } });
    expect(api.get).toHaveBeenNthCalledWith(3, '/admin/dream-career-phase1-review/complete');
  });

  it('rejects a structurally valid detail response for a different requested career', async () => {
    api.get.mockResolvedValue(detailValue());
    await expect(dreamCareerPhase1ReviewApi.getDetail('career-002')).rejects.toThrow(/requested|career/i);
    expect(api.get).toHaveBeenCalledWith('/admin/dream-career-phase1-review/career-002');
  });

  it('rejects an inconsistent blocker-free /complete response at the adapter boundary', async () => {
    api.get.mockResolvedValue({
      reviewId: 'dream-career-phase-1', expectedTotal: 229,
      counts: { total: 229, pending: 229, draft: 0, finalized: 0 }, blockers: [],
    });
    await expect(dreamCareerPhase1ReviewApi.getComplete()).rejects.toThrow(/complete|blocker|finalized/i);
  });

  it('sends an exact stable draft command, validates mutation response, then performs persisted readback', async () => {
    const detail = detailValue();
    const command = createDraftReviewCommand(detail, 'business', ['society'], 'draft-key');
    api.put.mockResolvedValue(mutationValue(command));
    api.get.mockResolvedValue(persistedDetail(command));
    const result = await dreamCareerPhase1ReviewApi.saveDraft(command);
    expect(api.put).toHaveBeenCalledWith('/admin/dream-career-phase1-review/career-001/draft', command.body);
    expect(api.get).toHaveBeenCalledWith('/admin/dream-career-phase1-review/career-001');
    expect(result.careerId).toBe('career-001');
  });

  it('supports commit-success/readback-fail retry with the exact same draft command', async () => {
    const command = createDraftReviewCommand(detailValue(), 'science', [], 'same-key');
    api.put.mockResolvedValue(mutationValue(command));
    api.get.mockRejectedValueOnce(new Error('Readback unavailable')).mockResolvedValueOnce(persistedDetail(command));
    await expect(dreamCareerPhase1ReviewApi.saveDraft(command)).rejects.toThrow('Readback unavailable');
    await dreamCareerPhase1ReviewApi.saveDraft(command);
    expect(api.put).toHaveBeenNthCalledWith(1, '/admin/dream-career-phase1-review/career-001/draft', command.body);
    expect(api.put).toHaveBeenNthCalledWith(2, '/admin/dream-career-phase1-review/career-001/draft', command.body);
  });

  it('supports commit-success/readback-fail retry with the exact same finalize command', async () => {
    const command = createFinalizeReviewCommand(detailValue(), 'same-finalize-key');
    api.post.mockResolvedValue(mutationValue(command));
    api.get.mockRejectedValueOnce(new Error('Readback unavailable')).mockResolvedValueOnce(persistedDetail(command));
    await expect(dreamCareerPhase1ReviewApi.finalize(command)).rejects.toThrow('Readback unavailable');
    await dreamCareerPhase1ReviewApi.finalize(command);
    expect(api.post).toHaveBeenNthCalledWith(1, '/admin/dream-career-phase1-review/career-001/finalize', command.body);
    expect(api.post).toHaveBeenNthCalledWith(2, '/admin/dream-career-phase1-review/career-001/finalize', command.body);
    expect(command.confirmedDirectionIds).toEqual(['business', 'society']);
  });

  it('binds finalization to the persisted draft directions in the command and mutation response', async () => {
    const command = createFinalizeReviewCommand(detailValue(), 'finalize-key');
    const changed = mutationValue(command);
    if (changed.finalDecision) changed.finalDecision.futureDirectionIds = ['design'];
    api.post.mockResolvedValue(changed);
    await expect(dreamCareerPhase1ReviewApi.finalize(command)).rejects.toThrow(/direction|command/i);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('rejects a persisted finalize readback whose directions changed after the response', async () => {
    const command = createFinalizeReviewCommand(detailValue(), 'finalize-key');
    const mutation = mutationValue(command);
    const readback = persistedDetail(command);
    if (readback.finalDecision) readback.finalDecision.futureDirectionIds = ['design'];
    api.post.mockResolvedValue(mutation);
    api.get.mockResolvedValue(readback);
    await expect(dreamCareerPhase1ReviewApi.finalize(command)).rejects.toThrow(/persisted|readback/i);
  });

  it('rejects malformed mutation readback before requesting detail', async () => {
    const command = createDraftReviewCommand(detailValue(), 'business', [], 'draft-key');
    api.put.mockResolvedValue({ ...mutationValue(command), status: 'unknown' });
    await expect(dreamCareerPhase1ReviewApi.saveDraft(command)).rejects.toThrow(/status/i);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('rejects a mutation response that did not advance the expected version', async () => {
    const command = createDraftReviewCommand(detailValue(), 'business', [], 'draft-key');
    api.put.mockResolvedValue({ ...mutationValue(command), version: command.body.expectedVersion });
    await expect(dreamCareerPhase1ReviewApi.saveDraft(command)).rejects.toThrow(/version/i);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('validates both closed artifact envelopes and preserves authoritative bytes and metadata', async () => {
    const future = futureArtifact();
    const taxonomy = taxonomyArtifact();
    api.post.mockResolvedValueOnce(future).mockResolvedValueOnce(taxonomy);
    const futureResult = await dreamCareerPhase1ReviewApi.exportFutureDirections();
    const taxonomyResult = await dreamCareerPhase1ReviewApi.exportTaxonomyRejection();
    expect(futureResult.artifactJson).toBe(future.artifactJson);
    expect(taxonomyResult.artifactJson).toBe(taxonomy.artifactJson);
    const download = authorityArtifactDownload(taxonomyResult);
    expect(download.filename).toBe(taxonomy.filename);
    expect(download.blob.type).toBe(taxonomy.mediaType);
    expect(await download.blob.text()).toBe(taxonomy.artifactJson);
  });

  it('rejects artifact byte/hash, metadata, document, and reverse-map inconsistencies', async () => {
    const badHash = { ...taxonomyArtifact(), artifactSha256: '0'.repeat(64) };
    api.post.mockResolvedValueOnce(badHash);
    await expect(dreamCareerPhase1ReviewApi.exportTaxonomyRejection()).rejects.toThrow(/hash/i);
    const badFuture = futureArtifact();
    if (badFuture.authority.authorityType === 'dream-career-future-direction-mapping-authority') badFuture.authority.directionRoles[0].careerIds = [];
    api.post.mockResolvedValueOnce(badFuture);
    await expect(dreamCareerPhase1ReviewApi.exportFutureDirections()).rejects.toThrow(/directionRoles|reverse|direction role|careerIds/i);
  });
});

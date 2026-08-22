import { xtaraApi } from '@/lib/api/client';

export type DreamCareerPhase1SourceHashes = {
  canonicalSourceSha256: string;
  guideSha256: string;
  taxonomySha256: string;
  relationshipSha256: string;
};

export type DreamCareerPhase1DirectionOption = {
  directionId: string;
  canonicalOrder: number;
  defaultLocale: string;
  label: string;
  localizedLabels: { en: string; ml: string; ta: string };
  description: string;
  sourceVersion: string;
};

export type DreamCareerPhase1SourceBinding = {
  status: 'current' | 'stale' | 'mismatch';
  isCurrent: boolean;
  isStale: boolean;
  isMismatch: boolean;
  boundSourceHashes: DreamCareerPhase1SourceHashes;
  currentSourceHashes: DreamCareerPhase1SourceHashes | null;
  mismatchFields: Array<keyof DreamCareerPhase1SourceHashes>;
  blockers: Array<'canonical_record_identity_mismatch' | 'canonical_direction_order_mismatch' | 'source_hash_mismatch'>;
};

export type DreamCareerPhase1CareerDisplay = {
  careerId: string;
  title: string;
  description?: string;
  sourcePath: string;
  inventoryVersion: 'dream-career-phase1-review-inventory-v1';
  releaseId: string;
  sourceHashes: DreamCareerPhase1SourceHashes;
};

export type DreamCareerPhase1ReviewRecord = {
  schemaVersion: 1;
  reviewId: string;
  careerId: string;
  canonicalOrder: number;
  sourceHashes: DreamCareerPhase1SourceHashes;
  canonicalDirectionIds: string[];
  status: 'pending' | 'draft' | 'finalized';
  draft: null | { primaryDirectionId: string; secondaryDirectionIds: string[]; updatedBy: string; updatedAt: string };
  finalDecision: null | { futureDirectionIds: string[]; reviewerId: string; reviewedAt: string };
  version: number;
  lastMutation: null | { idempotencyKey: string; commandSha256: string };
  createdAt: string;
  updatedAt: string;
};

export type DreamCareerPhase1ReviewQueueItem = DreamCareerPhase1ReviewRecord & {
  careerDisplay: DreamCareerPhase1CareerDisplay | null;
  sourceBinding: DreamCareerPhase1SourceBinding;
};

export type DreamCareerPhase1ReviewDetail = DreamCareerPhase1ReviewQueueItem & {
  directionOptions: DreamCareerPhase1DirectionOption[];
};

export type DreamCareerPhase1ReviewQueue = {
  reviewId: string;
  expectedTotal: 229;
  counts: { total: number; pending: number; draft: number; finalized: number };
  blockers: Array<'canonical_context_mismatch' | 'canonical_count_mismatch' | 'canonical_order_mismatch' | 'canonical_record_binding_mismatch' | 'incomplete_human_review' | 'missing_direction_coverage'>;
  directionOptions: DreamCareerPhase1DirectionOption[];
  records: DreamCareerPhase1ReviewQueueItem[];
};

function recordPath(careerId: string): string {
  return `/admin/dream-career-phase1-review/${encodeURIComponent(careerId)}`;
}

export const dreamCareerPhase1ReviewApi = {
  listQueue: () => xtaraApi.get<DreamCareerPhase1ReviewQueue>('/admin/dream-career-phase1-review'),
  getDetail: (careerId: string) => xtaraApi.get<DreamCareerPhase1ReviewDetail>(recordPath(careerId)),
  async saveDraft(record: DreamCareerPhase1ReviewDetail, primaryDirectionId: string, secondaryDirectionIds: string[], idempotencyKey: string) {
    await xtaraApi.put<DreamCareerPhase1ReviewRecord>(`${recordPath(record.careerId)}/draft`, {
      expectedVersion: record.version,
      idempotencyKey,
      sourceHashes: record.sourceHashes,
      primaryDirectionId,
      secondaryDirectionIds,
    });
    return this.getDetail(record.careerId);
  },
  async finalize(record: DreamCareerPhase1ReviewDetail, idempotencyKey: string) {
    await xtaraApi.post<DreamCareerPhase1ReviewRecord>(`${recordPath(record.careerId)}/finalize`, {
      expectedVersion: record.version,
      idempotencyKey,
      sourceHashes: record.sourceHashes,
      confirmed: true,
    });
    return this.getDetail(record.careerId);
  },
  exportFutureDirections: () => xtaraApi.post<unknown>('/admin/dream-career-phase1-review/export/future-directions', {}),
  exportTaxonomyRejection: () => xtaraApi.post<unknown>('/admin/dream-career-phase1-review/export/taxonomy-rejection', {}),
};

export function downloadServerAuthority(document: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

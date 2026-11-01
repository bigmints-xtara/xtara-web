import { xtaraApi } from '@/lib/api/client';

export type ReviewKind = 'factual' | 'translation' | 'grade' | 'jurisdiction';
export interface ReviewScope { grades: string[]; locales: string[]; jurisdictions: string[] }
export interface ReviewEvidenceInput {
  expectedLockVersion: number;
  expectedContentChecksum: string;
  idempotencyKey: string;
  kind: ReviewKind;
  scope: ReviewScope;
  contentPaths: string[];
  sourceIds: string[];
  supportedClaims: string[];
  applicabilityRationale: string;
}
export interface ReviewReceipt extends Omit<ReviewEvidenceInput, 'expectedLockVersion' | 'expectedContentChecksum'> {
  id: string;
  versionId: string;
  contentChecksum: string;
  reviewedBy: string;
  reviewedAt: string;
  revoked: boolean;
}
export interface ReviewSnapshot {
  versionId: string;
  lockVersion: number;
  status: string;
  contentChecksum: string;
  content: Record<string, unknown>;
  receipts: ReviewReceipt[];
  coverage: { complete: boolean; blockers: string[] };
  allowedScopes: ReviewScope;
}
export interface ReviewTarget { collection: string; recordId: string; versionId: string }
function path(target: ReviewTarget) {
  return `/admin/content/${encodeURIComponent(target.collection)}/${encodeURIComponent(target.recordId)}/versions/${encodeURIComponent(target.versionId)}/review-evidence`;
}
function sameRevision(snapshot: ReviewSnapshot, target: ReviewTarget, expected: { expectedLockVersion: number; expectedContentChecksum: string }) {
  if (snapshot.versionId !== target.versionId || snapshot.lockVersion !== expected.expectedLockVersion || snapshot.contentChecksum !== expected.expectedContentChecksum) {
    throw new Error('The content revision changed. Reload its snapshot and review the changed content before recording evidence.');
  }
}
export async function getReviewSnapshot(target: ReviewTarget): Promise<ReviewSnapshot> {
  const snapshot = await xtaraApi.get<ReviewSnapshot>(path(target));
  if (snapshot.versionId !== target.versionId) throw new Error('The server returned a different content version.');
  return snapshot;
}
const sameList = (left: string[], right: string[]) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
export async function recordReviewEvidence(target: ReviewTarget, input: ReviewEvidenceInput): Promise<ReviewSnapshot> {
  const written = await xtaraApi.post<ReviewSnapshot>(path(target), input);
  sameRevision(written, target, { ...input, expectedLockVersion: written.lockVersion });
  if (written.lockVersion < input.expectedLockVersion) throw new Error('The server returned an older review revision.');
  const snapshot = await getReviewSnapshot(target);
  sameRevision(snapshot, target, { ...input, expectedLockVersion: written.lockVersion });
  const receipt = snapshot.receipts.find((item) => item.idempotencyKey === input.idempotencyKey);
  if (!receipt || receipt.revoked || receipt.versionId !== target.versionId || receipt.contentChecksum !== input.expectedContentChecksum
    || receipt.kind !== input.kind || !(['grades', 'locales', 'jurisdictions'] as const).every((key) => sameList(receipt.scope[key], input.scope[key]))
    || !sameList(receipt.contentPaths, input.contentPaths) || !sameList(receipt.sourceIds, input.sourceIds) || !sameList(receipt.supportedClaims, input.supportedClaims) || receipt.applicabilityRationale !== input.applicabilityRationale
    || !receipt.reviewedBy || !receipt.reviewedAt) {
    throw new Error('Review evidence could not be verified by account readback. Retry the same review to check its receipt.');
  }
  return snapshot;
}
export async function revokeReviewEvidence(target: ReviewTarget, receiptId: string, input: {
  expectedLockVersion: number; expectedContentChecksum: string; idempotencyKey: string; reason: string;
}): Promise<ReviewSnapshot> {
  const written = await xtaraApi.post<ReviewSnapshot>(`${path(target)}/${encodeURIComponent(receiptId)}/revoke`, input);
  sameRevision(written, target, { ...input, expectedLockVersion: written.lockVersion });
  if (written.lockVersion < input.expectedLockVersion) throw new Error('The server returned an older review revision.');
  const snapshot = await getReviewSnapshot(target);
  sameRevision(snapshot, target, { ...input, expectedLockVersion: written.lockVersion });
  if (!snapshot.receipts.some((receipt) => receipt.id === receiptId && receipt.revoked)) {
    throw new Error('Revocation could not be verified by account readback. Retry to check its receipt.');
  }
  return snapshot;
}

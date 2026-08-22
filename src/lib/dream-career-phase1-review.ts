import { xtaraApi } from '@/lib/api/client';

const EXPECTED_TOTAL = 229;
const DIRECTION_IDS = ['business', 'design', 'health', 'science', 'society', 'technology'] as const;
const QUEUE_BLOCKERS = ['canonical_context_mismatch', 'canonical_count_mismatch', 'canonical_order_mismatch', 'canonical_record_binding_mismatch', 'incomplete_human_review', 'missing_direction_coverage'] as const;
const SOURCE_FIELDS = ['canonicalSourceSha256', 'guideSha256', 'taxonomySha256', 'relationshipSha256'] as const;
const SOURCE_BLOCKERS = ['canonical_record_identity_mismatch', 'canonical_direction_order_mismatch', 'source_hash_mismatch'] as const;
const REVIEW_STATUSES = ['pending', 'draft', 'finalized'] as const;
const ADMIN_REVIEWER = /^admin_user:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAREER_ID = /^[a-z0-9][a-z0-9-]*$/;
const SHA256 = /^[a-f0-9]{64}$/;

export class DreamCareerPhase1ContractError extends Error {
  constructor(message: string) {
    super(`Invalid Dream Career Phase 1 response: ${message}`);
    this.name = 'DreamCareerPhase1ContractError';
  }
}

export type DreamCareerPhase1SourceHashes = Record<(typeof SOURCE_FIELDS)[number], string>;
export type DreamCareerPhase1DirectionOption = {
  directionId: string; canonicalOrder: number; defaultLocale: string; label: string;
  localizedLabels: { en: string; ml: string; ta: string }; description: string; sourceVersion: string;
};
export type DreamCareerPhase1SourceBinding = {
  status: 'current' | 'stale' | 'mismatch'; isCurrent: boolean; isStale: boolean; isMismatch: boolean;
  boundSourceHashes: DreamCareerPhase1SourceHashes; currentSourceHashes: DreamCareerPhase1SourceHashes | null;
  mismatchFields: Array<keyof DreamCareerPhase1SourceHashes>;
  blockers: Array<(typeof SOURCE_BLOCKERS)[number]>;
};
export type DreamCareerPhase1CareerDisplay = {
  careerId: string; title: string; description?: string; sourcePath: string;
  inventoryVersion: 'dream-career-phase1-review-inventory-v1'; releaseId: string; sourceHashes: DreamCareerPhase1SourceHashes;
};
export type DreamCareerPhase1ReviewRecord = {
  schemaVersion: 1; reviewId: string; careerId: string; canonicalOrder: number;
  sourceHashes: DreamCareerPhase1SourceHashes; canonicalDirectionIds: string[];
  status: 'pending' | 'draft' | 'finalized';
  draft: null | { primaryDirectionId: string; secondaryDirectionIds: string[]; updatedBy: string; updatedAt: string };
  finalDecision: null | { futureDirectionIds: string[]; reviewerId: string; reviewedAt: string };
  version: number; lastMutation: null | { idempotencyKey: string; commandSha256: string };
  createdAt: string; updatedAt: string;
};
export type DreamCareerPhase1ReviewQueueItem = DreamCareerPhase1ReviewRecord & { careerDisplay: DreamCareerPhase1CareerDisplay | null; sourceBinding: DreamCareerPhase1SourceBinding };
export type DreamCareerPhase1ReviewDetail = DreamCareerPhase1ReviewQueueItem & { directionOptions: DreamCareerPhase1DirectionOption[] };
export type DreamCareerPhase1ReviewCounts = { total: number; pending: number; draft: number; finalized: number };
export type DreamCareerPhase1ReviewSummary = { reviewId: string; expectedTotal: 229; counts: DreamCareerPhase1ReviewCounts; blockers: Array<(typeof QUEUE_BLOCKERS)[number]> };
export type DreamCareerPhase1ReviewQueue = DreamCareerPhase1ReviewSummary & { directionOptions: DreamCareerPhase1DirectionOption[]; records: DreamCareerPhase1ReviewQueueItem[] };

export type FutureDirectionMappingAuthorityDocument = {
  schemaVersion: 1; authorityType: 'dream-career-future-direction-mapping-authority'; authorityVersion: '1.0.0';
  reviewer: { reviewerId: string; reviewedAt: string }; canonicalDirectionIds: string[];
  careerMappings: Array<{ careerId: string; futureDirectionIds: string[]; reviewerId: string; reviewedAt: string }>;
  directionRoles: Array<{ directionId: string; careerIds: string[] }>;
};
export type TaxonomyRejectionAuthorityDocument = {
  schemaVersion: 1; authorityType: 'dream-career-taxonomy-rejection-authority'; authorityVersion: '1.0.0';
  reviewer: { reviewerId: string; reviewedAt: string }; registryVersion: string; registrySha256: string;
  releaseId: string; releaseContentSha256: string; legacyFamily: 'traits'; category: 'traitIds'; rawValue: 'ytical';
  assignmentCount: 1; tagId: null; disposition: 'rejected'; sourcePath: string; sourceSha256: string;
};
export type DreamCareerPhase1AuthorityArtifact = {
  artifactSchemaVersion: 1; authorityType: FutureDirectionMappingAuthorityDocument['authorityType'] | TaxonomyRejectionAuthorityDocument['authorityType'];
  authoritySchemaVersion: 1; authorityVersion: '1.0.0'; filename: string; mediaType: 'application/json';
  artifactJson: string; artifactSha256: string; authority: FutureDirectionMappingAuthorityDocument | TaxonomyRejectionAuthorityDocument;
};
export type DraftReviewCommand = { kind: 'draft'; careerId: string; body: { expectedVersion: number; idempotencyKey: string; sourceHashes: DreamCareerPhase1SourceHashes; primaryDirectionId: string; secondaryDirectionIds: string[] } };
export type FinalizeReviewCommand = { kind: 'finalize'; careerId: string; confirmedDirectionIds: string[]; body: { expectedVersion: number; idempotencyKey: string; sourceHashes: DreamCareerPhase1SourceHashes; confirmed: true } };

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DreamCareerPhase1ContractError(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = [], label = 'object'): void {
  const allowed = new Set([...required, ...optional]);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unexpected.length || missing.length) throw new DreamCareerPhase1ContractError(`${label} has invalid or unexpected fields: ${[...unexpected, ...missing].join(', ')}`);
}
function text(value: unknown, label: string, max = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new DreamCareerPhase1ContractError(`${label} must be valid text`);
  return value;
}
function dateTime(value: unknown, label: string): string {
  const result = text(value, label, 64);
  if (Number.isNaN(Date.parse(result)) || !/T/.test(result)) throw new DreamCareerPhase1ContractError(`${label} must be an ISO date-time`);
  return result;
}
function integer(value: unknown, label: string, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > max) throw new DreamCareerPhase1ContractError(`${label} must be a non-negative integer`);
  return Number(value);
}
function member<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new DreamCareerPhase1ContractError(`${label} is invalid`);
  return value as T;
}
function uniqueStrings(value: unknown, label: string, min: number, max: number): string[] {
  if (!Array.isArray(value) || value.length < min || value.length > max || value.some((item) => typeof item !== 'string') || new Set(value).size !== value.length) throw new DreamCareerPhase1ContractError(`${label} must contain ${min}-${max} unique IDs`);
  return value as string[];
}
function same(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((item, index) => same(item, right[index]));
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const leftKeys = Object.keys(left as object).sort(); const rightKeys = Object.keys(right as object).sort();
    return same(leftKeys, rightKeys) && leftKeys.every((key) => same((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
  }
  return false;
}
function sourceHashes(value: unknown, label: string): DreamCareerPhase1SourceHashes {
  const result = object(value, label); exact(result, SOURCE_FIELDS, [], label);
  for (const field of SOURCE_FIELDS) if (typeof result[field] !== 'string' || !SHA256.test(result[field])) throw new DreamCareerPhase1ContractError(`${label}.${field} must be a lowercase SHA-256 hash`);
  return result as DreamCareerPhase1SourceHashes;
}
function reviewer(value: unknown, label: string) {
  const result = object(value, label); exact(result, ['reviewerId', 'reviewedAt'], [], label);
  if (typeof result.reviewerId !== 'string' || !ADMIN_REVIEWER.test(result.reviewerId)) throw new DreamCareerPhase1ContractError(`${label}.reviewerId is invalid`);
  return { reviewerId: result.reviewerId, reviewedAt: dateTime(result.reviewedAt, `${label}.reviewedAt`) };
}
function directionIds(value: unknown, label: string, min = 1, max = 3): string[] {
  const result = uniqueStrings(value, label, min, max);
  if (result.some((item) => !DIRECTION_IDS.includes(item as (typeof DIRECTION_IDS)[number]))) throw new DreamCareerPhase1ContractError(`${label} contains an unknown Direction ID`);
  return result;
}
function directionOptions(value: unknown): DreamCareerPhase1DirectionOption[] {
  if (!Array.isArray(value) || value.length !== 6) throw new DreamCareerPhase1ContractError('directionOptions must contain exactly six options');
  value.forEach((item, index) => {
    const option = object(item, `directionOptions[${index}]`);
    exact(option, ['directionId', 'canonicalOrder', 'defaultLocale', 'label', 'localizedLabels', 'description', 'sourceVersion'], [], `directionOptions[${index}]`);
    if (option.directionId !== DIRECTION_IDS[index] || option.canonicalOrder !== index) throw new DreamCareerPhase1ContractError('directionOptions canonical IDs/order are inconsistent');
    member(option.defaultLocale, ['en', 'ml', 'ta'], `directionOptions[${index}].defaultLocale`);
    text(option.label, `directionOptions[${index}].label`, 120); text(option.description, `directionOptions[${index}].description`); text(option.sourceVersion, `directionOptions[${index}].sourceVersion`, 200);
    const localized = object(option.localizedLabels, `directionOptions[${index}].localizedLabels`); exact(localized, ['en', 'ml', 'ta'], [], `directionOptions[${index}].localizedLabels`);
    for (const locale of ['en', 'ml', 'ta']) text(localized[locale], `directionOptions[${index}].localizedLabels.${locale}`, 120);
  });
  return value as DreamCareerPhase1DirectionOption[];
}
function careerDisplay(value: unknown, careerId: string): DreamCareerPhase1CareerDisplay | null {
  if (value === null) return null;
  const result = object(value, 'careerDisplay');
  exact(result, ['careerId', 'title', 'sourcePath', 'inventoryVersion', 'releaseId', 'sourceHashes'], ['description'], 'careerDisplay');
  if (result.careerId !== careerId || !CAREER_ID.test(careerId)) throw new DreamCareerPhase1ContractError('careerDisplay identity is inconsistent');
  text(result.title, 'careerDisplay.title', 200); if (result.description !== undefined) text(result.description, 'careerDisplay.description');
  text(result.sourcePath, 'careerDisplay.sourcePath'); text(result.releaseId, 'careerDisplay.releaseId');
  if (result.inventoryVersion !== 'dream-career-phase1-review-inventory-v1') throw new DreamCareerPhase1ContractError('careerDisplay inventoryVersion is invalid');
  sourceHashes(result.sourceHashes, 'careerDisplay.sourceHashes');
  return result as DreamCareerPhase1CareerDisplay;
}
function sourceBinding(value: unknown, recordHashes: DreamCareerPhase1SourceHashes, display: DreamCareerPhase1CareerDisplay | null): DreamCareerPhase1SourceBinding {
  const result = object(value, 'sourceBinding');
  exact(result, ['status', 'isCurrent', 'isStale', 'isMismatch', 'boundSourceHashes', 'currentSourceHashes', 'mismatchFields', 'blockers'], [], 'sourceBinding');
  const status = member(result.status, ['current', 'stale', 'mismatch'], 'sourceBinding.status');
  const flags = { current: result.isCurrent, stale: result.isStale, mismatch: result.isMismatch };
  if (Object.values(flags).some((flag) => typeof flag !== 'boolean') || flags[status] !== true || Object.entries(flags).some(([key, flag]) => key !== status && flag !== false)) throw new DreamCareerPhase1ContractError('source binding flags are inconsistent');
  const bound = sourceHashes(result.boundSourceHashes, 'sourceBinding.boundSourceHashes');
  if (!same(bound, recordHashes)) throw new DreamCareerPhase1ContractError('source binding bound hashes do not match the record');
  const current = result.currentSourceHashes === null ? null : sourceHashes(result.currentSourceHashes, 'sourceBinding.currentSourceHashes');
  const mismatchFields = uniqueStrings(result.mismatchFields, 'sourceBinding.mismatchFields', 0, 4);
  if (mismatchFields.some((field) => !SOURCE_FIELDS.includes(field as (typeof SOURCE_FIELDS)[number]))) throw new DreamCareerPhase1ContractError('source binding mismatch fields are invalid');
  const blockers = uniqueStrings(result.blockers, 'sourceBinding.blockers', 0, 3);
  if (blockers.some((blocker) => !SOURCE_BLOCKERS.includes(blocker as (typeof SOURCE_BLOCKERS)[number]))) throw new DreamCareerPhase1ContractError('source binding blockers are invalid');
  if (status === 'current' && (!current || mismatchFields.length || blockers.length || !same(bound, current))) throw new DreamCareerPhase1ContractError('source binding current state is inconsistent');
  if (status === 'stale' && (!current || !mismatchFields.length || !blockers.includes('source_hash_mismatch'))) throw new DreamCareerPhase1ContractError('source binding stale state is inconsistent');
  if (status === 'mismatch' && !blockers.length) throw new DreamCareerPhase1ContractError('source binding mismatch state is inconsistent');
  if (display && current && !same(display.sourceHashes, current)) throw new DreamCareerPhase1ContractError('source binding current hashes do not match the display snapshot');
  return result as DreamCareerPhase1SourceBinding;
}

const RECORD_KEYS = ['schemaVersion', 'reviewId', 'careerId', 'canonicalOrder', 'sourceHashes', 'canonicalDirectionIds', 'status', 'draft', 'finalDecision', 'version', 'lastMutation', 'createdAt', 'updatedAt'] as const;
function reviewRecord(value: unknown, projected: boolean): DreamCareerPhase1ReviewRecord | DreamCareerPhase1ReviewQueueItem {
  const result = object(value, 'review record');
  exact(result, projected ? [...RECORD_KEYS, 'careerDisplay', 'sourceBinding'] : RECORD_KEYS, [], 'review record');
  if (result.schemaVersion !== 1) throw new DreamCareerPhase1ContractError('review record schemaVersion is invalid');
  const careerId = text(result.careerId, 'review record careerId', 180); if (!CAREER_ID.test(careerId)) throw new DreamCareerPhase1ContractError('review record career ID is invalid');
  text(result.reviewId, 'review record reviewId', 180); integer(result.canonicalOrder, 'review record canonicalOrder', 228);
  const hashes = sourceHashes(result.sourceHashes, 'review record sourceHashes');
  if (!same(result.canonicalDirectionIds, DIRECTION_IDS)) throw new DreamCareerPhase1ContractError('review record canonical Direction IDs/order are inconsistent');
  const status = member(result.status, REVIEW_STATUSES, 'review record status');
  let draft: DreamCareerPhase1ReviewRecord['draft'] = null;
  if (result.draft !== null) {
    const item = object(result.draft, 'review record draft'); exact(item, ['primaryDirectionId', 'secondaryDirectionIds', 'updatedBy', 'updatedAt'], [], 'review record draft');
    const primary = member(item.primaryDirectionId, DIRECTION_IDS, 'draft primary Direction'); const secondary = directionIds(item.secondaryDirectionIds, 'draft secondary Directions', 0, 2);
    if (secondary.includes(primary)) throw new DreamCareerPhase1ContractError('draft primary and secondary Directions overlap');
    draft = { primaryDirectionId: primary, secondaryDirectionIds: secondary, updatedBy: text(item.updatedBy, 'draft author', 128), updatedAt: dateTime(item.updatedAt, 'draft updatedAt') };
  }
  let finalDecision: DreamCareerPhase1ReviewRecord['finalDecision'] = null;
  if (result.finalDecision !== null) {
    const item = object(result.finalDecision, 'review record finalDecision'); exact(item, ['futureDirectionIds', 'reviewerId', 'reviewedAt'], [], 'review record finalDecision');
    const reviewerValue = reviewer({ reviewerId: item.reviewerId, reviewedAt: item.reviewedAt }, 'finalDecision');
    finalDecision = { futureDirectionIds: directionIds(item.futureDirectionIds, 'finalDecision Directions'), ...reviewerValue };
  }
  if ((status === 'pending' && (draft || finalDecision)) || (status === 'draft' && (!draft || finalDecision)) || (status === 'finalized' && !finalDecision)) throw new DreamCareerPhase1ContractError('review record status and decisions are inconsistent');
  integer(result.version, 'review record version'); dateTime(result.createdAt, 'review record createdAt'); dateTime(result.updatedAt, 'review record updatedAt');
  if (result.lastMutation !== null) {
    const mutation = object(result.lastMutation, 'lastMutation'); exact(mutation, ['idempotencyKey', 'commandSha256'], [], 'lastMutation');
    text(mutation.idempotencyKey, 'lastMutation.idempotencyKey', 120); if (typeof mutation.commandSha256 !== 'string' || !SHA256.test(mutation.commandSha256)) throw new DreamCareerPhase1ContractError('lastMutation command SHA-256 is invalid');
  }
  if (!projected) return result as DreamCareerPhase1ReviewRecord;
  const display = careerDisplay(result.careerDisplay, careerId);
  sourceBinding(result.sourceBinding, hashes, display);
  return result as DreamCareerPhase1ReviewQueueItem;
}
function counts(value: unknown): DreamCareerPhase1ReviewCounts {
  const result = object(value, 'counts'); exact(result, ['total', 'pending', 'draft', 'finalized'], [], 'counts');
  const parsed = { total: integer(result.total, 'counts.total', 229), pending: integer(result.pending, 'counts.pending', 229), draft: integer(result.draft, 'counts.draft', 229), finalized: integer(result.finalized, 'counts.finalized', 229) };
  if (parsed.pending + parsed.draft + parsed.finalized !== parsed.total) throw new DreamCareerPhase1ContractError('counts do not add up to total');
  return parsed;
}
function blockers(value: unknown): DreamCareerPhase1ReviewSummary['blockers'] {
  const result = uniqueStrings(value, 'blockers', 0, QUEUE_BLOCKERS.length);
  if (result.some((item) => !QUEUE_BLOCKERS.includes(item as (typeof QUEUE_BLOCKERS)[number]))) throw new DreamCareerPhase1ContractError('blockers contain an invalid value');
  return result as DreamCareerPhase1ReviewSummary['blockers'];
}

export function parseDreamCareerPhase1Summary(value: unknown): DreamCareerPhase1ReviewSummary {
  const result = object(value, 'complete summary'); exact(result, ['reviewId', 'expectedTotal', 'counts', 'blockers'], [], 'complete summary');
  if (result.expectedTotal !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('complete summary expectedTotal is invalid');
  const parsed: DreamCareerPhase1ReviewSummary = { reviewId: text(result.reviewId, 'complete summary reviewId', 180), expectedTotal: EXPECTED_TOTAL, counts: counts(result.counts), blockers: blockers(result.blockers) };
  if (parsed.counts.total !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('complete summary total must be exactly 229');
  if (parsed.blockers.length === 0 && !isDreamCareerPhase1ReviewComplete(parsed)) throw new DreamCareerPhase1ContractError('blocker-free complete summary must have exactly 229 finalized reviews');
  return parsed;
}
export function isDreamCareerPhase1ReviewComplete(summary: DreamCareerPhase1ReviewSummary): boolean {
  return summary.expectedTotal === EXPECTED_TOTAL
    && summary.counts.total === EXPECTED_TOTAL
    && summary.counts.pending === 0
    && summary.counts.draft === 0
    && summary.counts.finalized === EXPECTED_TOTAL
    && summary.blockers.length === 0;
}
export function parseDreamCareerPhase1Queue(value: unknown): DreamCareerPhase1ReviewQueue {
  const result = object(value, 'queue'); exact(result, ['reviewId', 'expectedTotal', 'counts', 'blockers', 'directionOptions', 'records'], [], 'queue');
  const summary = parseDreamCareerPhase1Summary({ reviewId: result.reviewId, expectedTotal: result.expectedTotal, counts: result.counts, blockers: result.blockers });
  const options = directionOptions(result.directionOptions);
  if (!Array.isArray(result.records) || result.records.length !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('queue records must contain exactly 229 careers');
  const records = result.records.map((item, index) => {
    const record = reviewRecord(item, true) as DreamCareerPhase1ReviewQueueItem;
    if (record.reviewId !== summary.reviewId || record.canonicalOrder !== index) throw new DreamCareerPhase1ContractError('queue record review identity or canonical order is inconsistent');
    return record;
  });
  if (new Set(records.map((record) => record.careerId)).size !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('queue career IDs are not unique');
  const actual = { total: records.length, pending: records.filter((record) => record.status === 'pending').length, draft: records.filter((record) => record.status === 'draft').length, finalized: records.filter((record) => record.status === 'finalized').length };
  if (!same(summary.counts, actual)) throw new DreamCareerPhase1ContractError('queue counts do not match record statuses');
  return { ...summary, directionOptions: options, records };
}
export function parseDreamCareerPhase1Detail(value: unknown): DreamCareerPhase1ReviewDetail {
  const result = object(value, 'detail');
  const optionsValue = result.directionOptions;
  const recordValue = { ...result };
  delete recordValue.directionOptions;
  const record = reviewRecord(recordValue, true) as DreamCareerPhase1ReviewQueueItem;
  return { ...record, directionOptions: directionOptions(optionsValue) };
}

function parseReviewerAuthority(value: unknown, label: string) { return reviewer(value, label); }
function futureAuthority(value: unknown): FutureDirectionMappingAuthorityDocument {
  const result = object(value, 'Future Direction authority'); exact(result, ['schemaVersion', 'authorityType', 'authorityVersion', 'reviewer', 'canonicalDirectionIds', 'careerMappings', 'directionRoles'], [], 'Future Direction authority');
  if (result.schemaVersion !== 1 || result.authorityType !== 'dream-career-future-direction-mapping-authority' || result.authorityVersion !== '1.0.0' || !same(result.canonicalDirectionIds, DIRECTION_IDS)) throw new DreamCareerPhase1ContractError('Future Direction authority metadata or canonical Directions are invalid');
  const topReviewer = parseReviewerAuthority(result.reviewer, 'Future Direction authority reviewer');
  if (!Array.isArray(result.careerMappings) || result.careerMappings.length !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('Future Direction authority must contain 229 career mappings');
  const mappings = result.careerMappings.map((value, index) => {
    const item = object(value, `careerMappings[${index}]`); exact(item, ['careerId', 'futureDirectionIds', 'reviewerId', 'reviewedAt'], [], `careerMappings[${index}]`);
    const careerId = text(item.careerId, `careerMappings[${index}].careerId`, 180); if (!CAREER_ID.test(careerId)) throw new DreamCareerPhase1ContractError('Future Direction authority career ID is invalid');
    const mappingReviewer = parseReviewerAuthority({ reviewerId: item.reviewerId, reviewedAt: item.reviewedAt }, `careerMappings[${index}] reviewer`);
    if (!same(mappingReviewer, topReviewer)) throw new DreamCareerPhase1ContractError('Future Direction authority mapping reviewer is inconsistent');
    return { careerId, futureDirectionIds: directionIds(item.futureDirectionIds, `careerMappings[${index}].futureDirectionIds`), ...mappingReviewer };
  });
  if (new Set(mappings.map((mapping) => mapping.careerId)).size !== EXPECTED_TOTAL) throw new DreamCareerPhase1ContractError('Future Direction authority career mappings are not unique');
  if (!Array.isArray(result.directionRoles) || result.directionRoles.length !== 6) throw new DreamCareerPhase1ContractError('Future Direction authority direction roles must contain six entries');
  const roles = result.directionRoles.map((value, index) => {
    const item = object(value, `directionRoles[${index}]`); exact(item, ['directionId', 'careerIds'], [], `directionRoles[${index}]`);
    if (item.directionId !== DIRECTION_IDS[index]) throw new DreamCareerPhase1ContractError('Future Direction authority direction role order is invalid');
    const careerIds = uniqueStrings(item.careerIds, `directionRoles[${index}].careerIds`, 1, EXPECTED_TOTAL);
    const expected = mappings.filter((mapping) => mapping.futureDirectionIds.includes(DIRECTION_IDS[index])).map((mapping) => mapping.careerId);
    if (!same(careerIds, expected)) throw new DreamCareerPhase1ContractError('Future Direction authority reverse direction roles are inconsistent');
    return { directionId: DIRECTION_IDS[index], careerIds };
  });
  return { schemaVersion: 1, authorityType: 'dream-career-future-direction-mapping-authority', authorityVersion: '1.0.0', reviewer: topReviewer, canonicalDirectionIds: [...DIRECTION_IDS], careerMappings: mappings, directionRoles: roles };
}
function taxonomyAuthority(value: unknown): TaxonomyRejectionAuthorityDocument {
  const result = object(value, 'taxonomy rejection authority'); exact(result, ['schemaVersion', 'authorityType', 'authorityVersion', 'reviewer', 'registryVersion', 'registrySha256', 'releaseId', 'releaseContentSha256', 'legacyFamily', 'category', 'rawValue', 'assignmentCount', 'tagId', 'disposition', 'sourcePath', 'sourceSha256'], [], 'taxonomy rejection authority');
  if (result.schemaVersion !== 1 || result.authorityType !== 'dream-career-taxonomy-rejection-authority' || result.authorityVersion !== '1.0.0' || result.legacyFamily !== 'traits' || result.category !== 'traitIds' || result.rawValue !== 'ytical' || result.assignmentCount !== 1 || result.tagId !== null || result.disposition !== 'rejected') throw new DreamCareerPhase1ContractError('taxonomy rejection authority exact identity is invalid');
  const reviewerValue = reviewer(result.reviewer, 'taxonomy rejection authority reviewer');
  text(result.registryVersion, 'taxonomy registryVersion', 200); text(result.releaseId, 'taxonomy releaseId', 200); text(result.sourcePath, 'taxonomy sourcePath');
  for (const field of ['registrySha256', 'releaseContentSha256', 'sourceSha256']) if (typeof result[field] !== 'string' || !SHA256.test(result[field])) throw new DreamCareerPhase1ContractError(`taxonomy ${field} must be SHA-256`);
  return { ...(result as Omit<TaxonomyRejectionAuthorityDocument, 'reviewer'>), reviewer: reviewerValue } as TaxonomyRejectionAuthorityDocument;
}
async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new DreamCareerPhase1ContractError('browser SHA-256 validation is unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function authorityArtifact(value: unknown, expectedType: DreamCareerPhase1AuthorityArtifact['authorityType']): Promise<DreamCareerPhase1AuthorityArtifact> {
  const result = object(value, 'authority artifact'); exact(result, ['artifactSchemaVersion', 'authorityType', 'authoritySchemaVersion', 'authorityVersion', 'filename', 'mediaType', 'artifactJson', 'artifactSha256', 'authority'], [], 'authority artifact');
  const filename = expectedType === 'dream-career-future-direction-mapping-authority' ? 'dream-career-phase1-future-direction-mapping-authority-v1.json' : 'dream-career-phase1-taxonomy-rejection-authority-v1.json';
  if (result.artifactSchemaVersion !== 1 || result.authorityType !== expectedType || result.authoritySchemaVersion !== 1 || result.authorityVersion !== '1.0.0' || result.filename !== filename || result.mediaType !== 'application/json') throw new DreamCareerPhase1ContractError('authority artifact metadata is inconsistent');
  if (typeof result.artifactJson !== 'string' || !result.artifactJson.endsWith('\n') || result.artifactJson.endsWith('\n\n') || typeof result.artifactSha256 !== 'string' || !SHA256.test(result.artifactSha256)) throw new DreamCareerPhase1ContractError('authority artifact byte/hash fields are invalid');
  let parsed: unknown; try { parsed = JSON.parse(result.artifactJson); } catch { throw new DreamCareerPhase1ContractError('authority artifact bytes are not JSON'); }
  const authority = expectedType === 'dream-career-future-direction-mapping-authority' ? futureAuthority(result.authority) : taxonomyAuthority(result.authority);
  const parsedAuthority = expectedType === 'dream-career-future-direction-mapping-authority' ? futureAuthority(parsed) : taxonomyAuthority(parsed);
  if (!same(authority, parsedAuthority)) throw new DreamCareerPhase1ContractError('authority artifact parsed bytes do not match the authority document');
  if (await sha256(result.artifactJson) !== result.artifactSha256) throw new DreamCareerPhase1ContractError('authority artifact SHA-256 hash does not match its bytes');
  return { ...(result as Omit<DreamCareerPhase1AuthorityArtifact, 'authority'>), authority } as DreamCareerPhase1AuthorityArtifact;
}

function recordPath(careerId: string): string { return `/admin/dream-career-phase1-review/${encodeURIComponent(careerId)}`; }
export function createDraftReviewCommand(record: DreamCareerPhase1ReviewDetail, primaryDirectionId: string, secondaryDirectionIds: string[], idempotencyKey: string): DraftReviewCommand {
  parseDreamCareerPhase1Detail(record); member(primaryDirectionId, DIRECTION_IDS, 'draft primary Direction'); directionIds(secondaryDirectionIds, 'draft secondary Directions', 0, 2); text(idempotencyKey, 'idempotencyKey', 120);
  if (secondaryDirectionIds.includes(primaryDirectionId)) throw new DreamCareerPhase1ContractError('draft primary and secondary Directions overlap');
  return { kind: 'draft', careerId: record.careerId, body: { expectedVersion: record.version, idempotencyKey, sourceHashes: record.sourceHashes, primaryDirectionId, secondaryDirectionIds: [...secondaryDirectionIds] } };
}
export function createFinalizeReviewCommand(record: DreamCareerPhase1ReviewDetail, idempotencyKey: string): FinalizeReviewCommand {
  parseDreamCareerPhase1Detail(record); text(idempotencyKey, 'idempotencyKey', 120);
  if (!record.draft) throw new DreamCareerPhase1ContractError('finalize command requires a persisted draft selection');
  return {
    kind: 'finalize', careerId: record.careerId,
    confirmedDirectionIds: [record.draft.primaryDirectionId, ...record.draft.secondaryDirectionIds],
    body: { expectedVersion: record.version, idempotencyKey, sourceHashes: record.sourceHashes, confirmed: true },
  };
}

function verifyMutation(record: DreamCareerPhase1ReviewRecord, command: DraftReviewCommand | FinalizeReviewCommand): void {
  if (record.careerId !== command.careerId || record.version !== command.body.expectedVersion + 1 || record.lastMutation?.idempotencyKey !== command.body.idempotencyKey) throw new DreamCareerPhase1ContractError('mutation readback identity/version/idempotency is inconsistent');
  if (command.kind === 'draft' && (record.status !== 'draft' || !record.draft || record.draft.primaryDirectionId !== command.body.primaryDirectionId || !same(record.draft.secondaryDirectionIds, command.body.secondaryDirectionIds))) throw new DreamCareerPhase1ContractError('draft mutation readback does not match the command');
  if (command.kind === 'finalize' && (record.status !== 'finalized' || !record.finalDecision || !same(record.finalDecision.futureDirectionIds, command.confirmedDirectionIds))) throw new DreamCareerPhase1ContractError('finalize mutation directions do not match the confirmed command');
}
function verifyDetailReadback(detail: DreamCareerPhase1ReviewDetail, mutation: DreamCareerPhase1ReviewRecord): void {
  const record = { ...detail } as Record<string, unknown>;
  delete record.careerDisplay; delete record.sourceBinding; delete record.directionOptions;
  if (!same(record, mutation)) throw new DreamCareerPhase1ContractError('persisted detail readback does not match the mutation response');
}

export const dreamCareerPhase1ReviewApi = {
  async listQueue() { return parseDreamCareerPhase1Queue(await xtaraApi.get<unknown>('/admin/dream-career-phase1-review')); },
  async getDetail(careerId: string) {
    const detail = parseDreamCareerPhase1Detail(await xtaraApi.get<unknown>(recordPath(careerId)));
    if (detail.careerId !== careerId) throw new DreamCareerPhase1ContractError('detail career identity does not match the requested career');
    return detail;
  },
  async getComplete() { return parseDreamCareerPhase1Summary(await xtaraApi.get<unknown>('/admin/dream-career-phase1-review/complete')); },
  async saveDraft(command: DraftReviewCommand) {
    const mutation = reviewRecord(await xtaraApi.put<unknown>(`${recordPath(command.careerId)}/draft`, command.body), false) as DreamCareerPhase1ReviewRecord;
    verifyMutation(mutation, command); const detail = await this.getDetail(command.careerId); verifyDetailReadback(detail, mutation); return detail;
  },
  async finalize(command: FinalizeReviewCommand) {
    const mutation = reviewRecord(await xtaraApi.post<unknown>(`${recordPath(command.careerId)}/finalize`, command.body), false) as DreamCareerPhase1ReviewRecord;
    verifyMutation(mutation, command); const detail = await this.getDetail(command.careerId); verifyDetailReadback(detail, mutation); return detail;
  },
  async exportFutureDirections() { return authorityArtifact(await xtaraApi.post<unknown>('/admin/dream-career-phase1-review/export/future-directions', {}), 'dream-career-future-direction-mapping-authority'); },
  async exportTaxonomyRejection() { return authorityArtifact(await xtaraApi.post<unknown>('/admin/dream-career-phase1-review/export/taxonomy-rejection', {}), 'dream-career-taxonomy-rejection-authority'); },
};

export function authorityArtifactDownload(artifact: DreamCareerPhase1AuthorityArtifact): { blob: Blob; filename: string } {
  return { blob: new Blob([artifact.artifactJson], { type: artifact.mediaType }), filename: artifact.filename };
}
export function downloadAuthorityArtifact(artifact: DreamCareerPhase1AuthorityArtifact): void {
  const { blob, filename } = authorityArtifactDownload(artifact);
  const href = URL.createObjectURL(blob); const anchor = window.document.createElement('a');
  anchor.href = href; anchor.download = filename; anchor.click(); URL.revokeObjectURL(href);
}

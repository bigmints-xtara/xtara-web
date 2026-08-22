import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reviewApi = vi.hoisted(() => ({
  listQueue: vi.fn(), getDetail: vi.fn(), saveDraft: vi.fn(), finalize: vi.fn(),
  exportFutureDirections: vi.fn(), exportTaxonomyRejection: vi.fn(),
}));
vi.mock('@/lib/dream-career-phase1-review', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/dream-career-phase1-review')>(),
  dreamCareerPhase1ReviewApi: reviewApi,
}));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));

import DreamCareerPhase1ReviewPage from './DreamCareerPhase1ReviewPage';
import type { DreamCareerPhase1ReviewDetail, DreamCareerPhase1ReviewQueue } from '@/lib/dream-career-phase1-review';

const hashes = {
  canonicalSourceSha256: 'a'.repeat(64), guideSha256: 'b'.repeat(64),
  taxonomySha256: 'c'.repeat(64), relationshipSha256: 'd'.repeat(64),
};
const directions = ['business', 'design', 'health', 'science', 'society', 'technology'].map((directionId, canonicalOrder) => ({
  directionId, canonicalOrder, defaultLocale: 'en', label: `Server ${directionId}`,
  localizedLabels: { en: `Server ${directionId}`, ml: `ML ${directionId}`, ta: `TA ${directionId}` },
  description: `Server description ${directionId}`, sourceVersion: 'future-directions-v1',
}));

function record(index: number, status: 'pending' | 'draft' | 'finalized' = 'pending') {
  const careerId = `career-${String(index + 1).padStart(3, '0')}`;
  return {
    schemaVersion: 1 as const, reviewId: 'dream-career-phase-1', careerId, canonicalOrder: index,
    sourceHashes: hashes, canonicalDirectionIds: directions.map((item) => item.directionId), status,
    draft: status === 'draft' ? { primaryDirectionId: 'business', secondaryDirectionIds: ['society'], updatedBy: 'hidden-reviewer-id', updatedAt: '2026-08-22T10:00:00.000Z' } : null,
    finalDecision: status === 'finalized' ? { futureDirectionIds: ['business', 'society'], reviewerId: 'admin_user:11111111-1111-4111-8111-111111111111', reviewedAt: '2026-08-22T11:00:00.000Z' } : null,
    version: status === 'pending' ? 0 : 1, lastMutation: null,
    createdAt: '2026-08-22T09:00:00.000Z', updatedAt: '2026-08-22T10:00:00.000Z',
    careerDisplay: { careerId, title: `Canonical Career ${index + 1}`, description: `Canonical source snapshot ${index + 1}`, sourcePath: `catalogue/${careerId}.json`, inventoryVersion: 'dream-career-phase1-review-inventory-v1' as const, releaseId: 'release-1', sourceHashes: hashes },
    sourceBinding: { status: 'current' as const, isCurrent: true, isStale: false, isMismatch: false, boundSourceHashes: hashes, currentSourceHashes: hashes, mismatchFields: [], blockers: [] },
  };
}

function queue(overrides: Partial<DreamCareerPhase1ReviewQueue> = {}): DreamCareerPhase1ReviewQueue {
  const records = Array.from({ length: 229 }, (_, index) => record(index, index === 0 ? 'draft' : index === 1 ? 'finalized' : 'pending'));
  return {
    reviewId: 'dream-career-phase-1', expectedTotal: 229,
    counts: { total: 229, pending: 227, draft: 1, finalized: 1 },
    blockers: ['incomplete_human_review'], directionOptions: directions, records, ...overrides,
  };
}

function detail(item = record(0, 'draft')): DreamCareerPhase1ReviewDetail {
  return { ...item, directionOptions: directions };
}

describe('DreamCareerPhase1ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewApi.listQueue.mockResolvedValue(queue());
    reviewApi.getDetail.mockResolvedValue(detail());
  });

  it('keeps review controls unavailable while loading and shows forbidden state without leaking them', async () => {
    let reject!: (error: Error) => void;
    reviewApi.listQueue.mockReturnValue(new Promise((_resolve, rejected) => { reject = rejected; }));
    render(<DreamCareerPhase1ReviewPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading authenticated review queue');
    expect(screen.queryByRole('button', { name: /review canonical career/i })).not.toBeInTheDocument();
    reject(new Error('You do not have permission to access this review'));
    expect(await screen.findByRole('alert')).toHaveTextContent('permission');
    expect(screen.queryByText('Canonical Career 1')).not.toBeInTheDocument();
  });

  it('fails closed for an empty or impossible queue and supports retry', async () => {
    reviewApi.listQueue.mockResolvedValueOnce(queue({ records: [], counts: { total: 0, pending: 0, draft: 0, finalized: 0 } }));
    render(<DreamCareerPhase1ReviewPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('expected 229');
    fireEvent.click(screen.getByRole('button', { name: 'Retry queue' }));
    await waitFor(() => expect(reviewApi.listQueue).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Canonical Career 1')).toBeInTheDocument();
  });

  it('renders all 229 canonically ordered rows and filters by status, source state, title, and ID', async () => {
    render(<DreamCareerPhase1ReviewPage />);
    expect(await screen.findByText('Canonical Career 229')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /review canonical career/i })).toHaveLength(229);
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by review status' }), { target: { value: 'finalized' } });
    expect(screen.getByText('Canonical Career 2')).toBeInTheDocument();
    expect(screen.queryByText('Canonical Career 1')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by review status' }), { target: { value: 'all' } });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search careers' }), { target: { value: 'career-229' } });
    expect(screen.getByText('Canonical Career 229')).toBeInTheDocument();
    expect(screen.queryByText('Canonical Career 228')).not.toBeInTheDocument();
  });

  it('shows exactly six server-labelled choices and validates one primary with at most two distinct secondaries', async () => {
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    expect(within(editor).getAllByRole('radio')).toHaveLength(6);
    expect(within(editor).getAllByRole('checkbox')).toHaveLength(6);
    expect(within(editor).getByLabelText('Primary Server business')).toBeChecked();
    expect(within(editor).getByLabelText('Secondary Server business')).toBeDisabled();
    fireEvent.click(within(editor).getByLabelText('Secondary Server design'));
    expect(within(editor).getByLabelText('Secondary Server health')).toBeDisabled();
  });

  it('retains edits on failed readback and reports success only from persisted readback', async () => {
    reviewApi.saveDraft.mockRejectedValueOnce(new Error('Persisted readback failed'));
    reviewApi.saveDraft.mockResolvedValueOnce({ ...detail(), version: 2, draft: { primaryDirectionId: 'science', secondaryDirectionIds: [], updatedBy: 'hidden', updatedAt: '2026-08-22T12:00:00.000Z' } });
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    fireEvent.click(within(editor).getByLabelText('Primary Server science'));
    fireEvent.click(within(editor).getByRole('button', { name: 'Save draft' }));
    expect(await within(editor).findByRole('alert')).toHaveTextContent('Persisted readback failed');
    expect(within(editor).getByLabelText('Primary Server science')).toBeChecked();
    fireEvent.click(within(editor).getByRole('button', { name: 'Retry save' }));
    expect(await within(editor).findByRole('status')).toHaveTextContent('Persisted readback confirmed');
  });

  it('keeps the draft visible when the server rejects a stale expected version', async () => {
    reviewApi.saveDraft.mockRejectedValue(new Error('Review version conflict. Reload the current record before retrying.'));
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    fireEvent.click(within(editor).getByLabelText('Primary Server health'));
    fireEvent.click(within(editor).getByRole('button', { name: 'Save draft' }));
    expect(await within(editor).findByRole('alert')).toHaveTextContent('version conflict');
    expect(within(editor).getByLabelText('Primary Server health')).toBeChecked();
  });

  it('fails closed on stale source and keeps server blockers visible', async () => {
    const stale = detail();
    stale.sourceBinding = { ...stale.sourceBinding, status: 'stale', isCurrent: false, isStale: true, blockers: ['source_hash_mismatch'], mismatchFields: ['guideSha256'] };
    reviewApi.getDetail.mockResolvedValue(stale);
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    expect(within(editor).getByRole('alert')).toHaveTextContent('source_hash_mismatch');
    expect(within(editor).getByRole('button', { name: 'Save draft' })).toBeDisabled();
    expect(within(editor).getByRole('button', { name: 'Review final decision' })).toBeDisabled();
  });

  it('requires exact irreversible confirmation and exposes self-finalization failure without discarding draft', async () => {
    reviewApi.finalize.mockRejectedValue(new Error('A different authenticated reviewer must finalize this draft'));
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Review final decision' }));
    const dialog = screen.getByRole('dialog', { name: 'Finalize this decision?' });
    expect(dialog).toHaveTextContent('career-001');
    expect(dialog).toHaveTextContent('Canonical Career 1');
    expect(dialog).toHaveTextContent('Server business');
    expect(dialog).toHaveTextContent('Server society');
    expect(dialog).toHaveTextContent('Version 1');
    expect(dialog).toHaveTextContent('catalogue/career-001.json');
    expect(dialog).toHaveTextContent('another authenticated reviewer');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalize permanently' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('different authenticated reviewer');
    expect(screen.getAllByText('Draft author recorded').length).toBeGreaterThan(0);
  });

  it('never renders reviewer IDs, hashes as editable fields, status controls, or reverse-role fields', async () => {
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    await screen.findByRole('region', { name: 'Decision editor' });
    expect(screen.queryByText('hidden-reviewer-id')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reviewer id/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reviewed at/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Set review status')).not.toBeInTheDocument();
    expect(screen.queryByText(/directionRoles/)).not.toBeInTheDocument();
  });

  it('shows the exact taxonomy rejection and export controls only when the server summary is eligible', async () => {
    const eligible = queue({ blockers: [], counts: { total: 229, pending: 0, draft: 0, finalized: 229 }, records: Array.from({ length: 229 }, (_, index) => record(index, 'finalized')) });
    reviewApi.listQueue.mockResolvedValue(eligible);
    reviewApi.exportTaxonomyRejection.mockResolvedValue({ legacyFamily: 'traits', category: 'traitIds', rawValue: 'ytical', disposition: 'rejected' });
    render(<DreamCareerPhase1ReviewPage />);
    expect(await screen.findByText('Raw value: ytical')).toBeInTheDocument();
    expect(screen.getByText(/omitted, not corrected to analytical/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Future Direction mapping' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export taxonomy rejection' }));
    expect(await screen.findByText(/"rawValue": "ytical"/)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reviewApi = vi.hoisted(() => ({
  listQueue: vi.fn(), getDetail: vi.fn(), getComplete: vi.fn(), saveDraft: vi.fn(), finalize: vi.fn(),
  exportFutureDirections: vi.fn(), exportTaxonomyRejection: vi.fn(),
}));
const testContext = vi.hoisted(() => ({ locale: 'en', userProfile: { adminRole: 'admin' } as { adminRole: string } }));
vi.mock('@/lib/dream-career-phase1-review', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/dream-career-phase1-review')>(),
  dreamCareerPhase1ReviewApi: reviewApi,
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ userProfile: testContext.userProfile }) }));
vi.mock('@/i18n/language-provider', async () => {
  const { defaultMessages, getMessages } = await import('@/i18n/messages');
  const { translate } = await import('@/i18n/translate');
  return {
    useTranslations: () => ({
      locale: testContext.locale,
      t: (key: string, vars?: Record<string, string | number>) => translate(
        getMessages(testContext.locale as Parameters<typeof getMessages>[0]), key, vars, defaultMessages,
      ),
    }),
  };
});

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
    testContext.locale = 'en';
    testContext.userProfile = { adminRole: 'admin' };
    reviewApi.listQueue.mockResolvedValue(queue());
    reviewApi.getDetail.mockResolvedValue(detail());
    reviewApi.getComplete.mockResolvedValue({ reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 227, draft: 1, finalized: 1 }, blockers: ['incomplete_human_review'] });
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
    expect(await screen.findAllByText('Canonical Career 1')).not.toHaveLength(0);
  });

  it('localizes a fail-closed canonical-count mismatch in Malayalam', async () => {
    testContext.locale = 'ml';
    reviewApi.listQueue.mockResolvedValue(queue({ records: [], counts: { total: 0, pending: 0, draft: 0, finalized: 0 } }));
    render(<DreamCareerPhase1ReviewPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('229 അംഗീകൃത കരിയറുകൾ പ്രതീക്ഷിച്ചു, പക്ഷേ 0 ലഭിച്ചു');
    expect(alert).not.toHaveTextContent('Review queue unavailable');
  });

  it('localizes a fail-closed queue identity mismatch in Tamil', async () => {
    testContext.locale = 'ta';
    reviewApi.getComplete.mockResolvedValue({
      reviewId: 'different-review', expectedTotal: 229,
      counts: { total: 229, pending: 227, draft: 1, finalized: 1 },
      blockers: ['incomplete_human_review'],
    });
    render(<DreamCareerPhase1ReviewPage />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('வரிசை மற்றும் நிறைவு அடையாளங்கள் பொருந்தவில்லை');
    expect(alert).not.toHaveTextContent('Review queue unavailable');
  });

  it('keeps all queue-integrity translation keys present in every locale catalog', async () => {
    const { getMessages } = await import('@/i18n/messages');
    const { translate } = await import('@/i18n/translate');
    const keys = ['integrityCount', 'integrityIdentity', 'integrityDirections', 'integrityOrder'];
    for (const locale of ['en', 'hi', 'ml', 'ta'] as const) {
      for (const key of keys) {
        const path = `admin.dreamCareerPhase1Review.errors.${key}`;
        expect(translate(getMessages(locale), path)).not.toBe(path);
      }
    }
  });

  it('renders all 229 canonically ordered rows and filters by status, source state, title, and ID', async () => {
    const filteredQueue = queue();
    filteredQueue.records[2].sourceBinding = { ...filteredQueue.records[2].sourceBinding, status: 'stale', isCurrent: false, isStale: true, blockers: ['source_hash_mismatch'], mismatchFields: ['guideSha256'] };
    reviewApi.listQueue.mockResolvedValue(filteredQueue);
    render(<DreamCareerPhase1ReviewPage />);
    expect(await screen.findAllByText('Canonical Career 229')).not.toHaveLength(0);
    expect(screen.getAllByRole('button', { name: /^Review Canonical Career \d+$/i })).toHaveLength(229);
    const firstDesktopRow = screen.getByTestId('desktop-career-career-001');
    expect(firstDesktopRow).toHaveTextContent('Primary: Server business');
    expect(firstDesktopRow).toHaveTextContent('Secondaries: Server society');
    expect(firstDesktopRow).toHaveTextContent('Version 1');
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by review status' }), { target: { value: 'finalized' } });
    expect(screen.getAllByText('Canonical Career 2')).not.toHaveLength(0);
    expect(screen.queryByText('Canonical Career 1')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by review status' }), { target: { value: 'all' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by source state' }), { target: { value: 'stale' } });
    expect(screen.getByTestId('desktop-career-career-003')).toHaveTextContent('Canonical Career 3');
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by source state' }), { target: { value: 'all' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by blocked state' }), { target: { value: 'blocked' } });
    expect(screen.getByTestId('desktop-career-career-003')).toHaveTextContent('source_hash_mismatch');
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by blocked state' }), { target: { value: 'all' } });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search careers' }), { target: { value: 'career-229' } });
    expect(screen.getAllByText('Canonical Career 229')).not.toHaveLength(0);
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
    const firstCommand = reviewApi.saveDraft.mock.calls[0][0];
    const retriedCommand = reviewApi.saveDraft.mock.calls[1][0];
    expect(retriedCommand).toEqual(firstCommand);
    expect(retriedCommand.body.idempotencyKey).toBe(firstCommand.body.idempotencyKey);
  });

  it('resets the pending draft command when the reviewer changes the action', async () => {
    reviewApi.saveDraft.mockRejectedValueOnce(new Error('Readback unavailable')).mockRejectedValueOnce(new Error('Readback unavailable'));
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    fireEvent.click(within(editor).getByLabelText('Primary Server science'));
    fireEvent.click(within(editor).getByRole('button', { name: 'Save draft' }));
    await within(editor).findByRole('alert');
    const firstCommand = reviewApi.saveDraft.mock.calls[0][0];
    fireEvent.click(within(editor).getByLabelText('Primary Server health'));
    fireEvent.click(within(editor).getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(reviewApi.saveDraft).toHaveBeenCalledTimes(2));
    const changedCommand = reviewApi.saveDraft.mock.calls[1][0];
    expect(changedCommand.body.idempotencyKey).not.toBe(firstCommand.body.idempotencyKey);
    expect(changedCommand.body.primaryDirectionId).toBe('health');
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
    const rendered = render(<DreamCareerPhase1ReviewPage />);
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
    expect(rendered.container).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(within(dialog).getByRole('button', { name: 'Finalize permanently' })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(within(dialog).getByRole('button', { name: 'Finalize permanently' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalize permanently' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('different authenticated reviewer');
    expect(screen.getAllByText('Draft author recorded').length).toBeGreaterThan(0);
  });

  it('closes confirmation with Escape and restores focus to its trigger', async () => {
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const trigger = await screen.findByRole('button', { name: 'Review final decision' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Finalize this decision?' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('retries finalize with the identical command after commit-success/readback failure', async () => {
    reviewApi.finalize.mockRejectedValueOnce(new Error('Readback unavailable')).mockResolvedValueOnce({ ...detail(), status: 'finalized', version: 2, finalDecision: { futureDirectionIds: ['business', 'society'], reviewerId: 'admin_user:22222222-2222-4222-8222-222222222222', reviewedAt: '2026-08-22T13:00:00.000Z' } });
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Review final decision' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalize permanently' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Readback unavailable');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalize permanently' }));
    await waitFor(() => expect(reviewApi.finalize).toHaveBeenCalledTimes(2));
    expect(reviewApi.finalize.mock.calls[1][0]).toEqual(reviewApi.finalize.mock.calls[0][0]);
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

  it('uses /complete as the sole count and export gate, regardless of queue summary', async () => {
    const eligible = queue({ blockers: [], counts: { total: 229, pending: 0, draft: 0, finalized: 229 }, records: Array.from({ length: 229 }, (_, index) => record(index, 'finalized')) });
    reviewApi.listQueue.mockResolvedValue(eligible);
    reviewApi.getComplete.mockResolvedValue({ reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 1, draft: 0, finalized: 228 }, blockers: ['incomplete_human_review'] });
    render(<DreamCareerPhase1ReviewPage />);
    const counts = await screen.findByRole('region', { name: 'Review counts' });
    expect(within(counts).getByText('228')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export Future Direction mapping' })).not.toBeInTheDocument();
  });

  it('fails closed when /complete has no blockers but is not exactly complete', async () => {
    reviewApi.getComplete.mockResolvedValue({
      reviewId: 'dream-career-phase-1', expectedTotal: 229,
      counts: { total: 229, pending: 229, draft: 0, finalized: 0 }, blockers: [],
    });
    render(<DreamCareerPhase1ReviewPage />);
    await screen.findByRole('region', { name: 'Review counts' });
    expect(screen.queryByRole('button', { name: 'Export Future Direction mapping' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export taxonomy rejection' })).not.toBeInTheDocument();
  });

  it('shows exact taxonomy identity and artifact export controls only when /complete is eligible', async () => {
    reviewApi.getComplete.mockResolvedValue({ reviewId: 'dream-career-phase-1', expectedTotal: 229, counts: { total: 229, pending: 0, draft: 0, finalized: 229 }, blockers: [] });
    const authority = { schemaVersion: 1, authorityType: 'dream-career-taxonomy-rejection-authority', authorityVersion: '1.0.0', reviewer: { reviewerId: 'admin_user:11111111-1111-4111-8111-111111111111', reviewedAt: '2026-08-22T12:00:00.000Z' }, registryVersion: 'v1', registrySha256: 'a'.repeat(64), releaseId: 'release-1', releaseContentSha256: 'b'.repeat(64), legacyFamily: 'traits', category: 'traitIds', rawValue: 'ytical', assignmentCount: 1, tagId: null, disposition: 'rejected', sourcePath: 'language-policy-officer', sourceSha256: 'c'.repeat(64) };
    const artifactJson = `${JSON.stringify(authority)}\n`;
    reviewApi.exportTaxonomyRejection.mockResolvedValue({ artifactSchemaVersion: 1, authorityType: authority.authorityType, authoritySchemaVersion: 1, authorityVersion: '1.0.0', filename: 'dream-career-phase1-taxonomy-rejection-authority-v1.json', mediaType: 'application/json', artifactJson, artifactSha256: 'd'.repeat(64), authority });
    render(<DreamCareerPhase1ReviewPage />);
    const taxonomy = await screen.findByRole('region', { name: 'Taxonomy rejection acknowledgement' });
    expect(within(taxonomy).getByText('language-policy-officer')).toBeInTheDocument();
    expect(within(taxonomy).getByText('traits')).toBeInTheDocument();
    expect(within(taxonomy).getByText('traitIds')).toBeInTheDocument();
    expect(within(taxonomy).getByText('ytical')).toBeInTheDocument();
    expect(within(taxonomy).getByText('1')).toBeInTheDocument();
    expect(within(taxonomy).getByText('null')).toBeInTheDocument();
    expect(within(taxonomy).getByText('rejected')).toBeInTheDocument();
    expect(screen.getByText(/omitted, not corrected to analytical/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Future Direction mapping' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export taxonomy rejection' }));
    expect(await screen.findByText(new RegExp('"rawValue":"ytical"'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Download ${artifactJson.length} authoritative bytes` })).toBeInTheDocument();
  });

  it('renders usable compact career cards with a reachable review action', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    window.dispatchEvent(new Event('resize'));
    render(<DreamCareerPhase1ReviewPage />);
    const compact = await screen.findByTestId('compact-career-list');
    const first = within(compact).getByTestId('compact-career-career-001');
    expect(first).toHaveTextContent('Canonical Career 1');
    expect(first).toHaveTextContent('Primary: Server business');
    const action = within(first).getByRole('button', { name: 'Review Canonical Career 1 compact' });
    fireEvent.click(action);
    expect(await screen.findByRole('region', { name: 'Decision editor' })).toBeInTheDocument();
  });

  it('shows compact blocker mismatch fields and does not duplicate the record version', async () => {
    const blockedQueue = queue();
    blockedQueue.records[0].sourceBinding = {
      ...blockedQueue.records[0].sourceBinding,
      status: 'mismatch', isCurrent: false, isMismatch: true,
      blockers: ['source_hash_mismatch'], mismatchFields: ['guideSha256'],
    };
    reviewApi.listQueue.mockResolvedValue(blockedQueue);
    render(<DreamCareerPhase1ReviewPage />);
    const first = within(await screen.findByTestId('compact-career-list')).getByTestId('compact-career-career-001');
    expect(first).toHaveTextContent('source_hash_mismatch');
    expect(first).toHaveTextContent('guideSha256');
    expect(within(first).getAllByText('Version 1')).toHaveLength(1);
  });

  it('keeps Tab focus inside the busy dialog when every action is disabled', async () => {
    reviewApi.finalize.mockReturnValue(new Promise(() => undefined));
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Review final decision' }));
    const dialog = screen.getByRole('dialog', { name: 'Finalize this decision?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalize permanently' }));
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled());
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(dialog).toHaveFocus();
  });

  it('restores focus to the page heading after successful finalization disables the trigger', async () => {
    reviewApi.finalize.mockResolvedValue({
      ...detail(), status: 'finalized', version: 2, draft: null,
      finalDecision: {
        futureDirectionIds: ['business', 'society'],
        reviewerId: 'admin_user:22222222-2222-4222-8222-222222222222',
        reviewedAt: '2026-08-22T13:00:00.000Z',
      },
    });
    render(<DreamCareerPhase1ReviewPage />);
    const heading = screen.getByRole('heading', { name: 'Dream Career Phase 1 review' });
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Review final decision' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalize permanently' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(heading).toHaveFocus();
  });

  it('lets editors save drafts but hides finalization and authority exports', async () => {
    testContext.userProfile = { adminRole: 'editor' };
    reviewApi.getComplete.mockResolvedValue({
      reviewId: 'dream-career-phase-1', expectedTotal: 229,
      counts: { total: 229, pending: 0, draft: 0, finalized: 229 }, blockers: [],
    });
    render(<DreamCareerPhase1ReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review Canonical Career 1' }));
    const editor = await screen.findByRole('region', { name: 'Decision editor' });
    expect(within(editor).getByRole('button', { name: 'Save draft' })).toBeEnabled();
    expect(within(editor).queryByRole('button', { name: 'Review final decision' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export Future Direction mapping' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export taxonomy rejection' })).not.toBeInTheDocument();
  });

  it.each([
    ['ml', 'ഡ്രീം കരിയർ ഘട്ടം 1 അവലോകനം', 'കരിയറുകൾ തിരയുക'],
    ['ta', 'கனவு தொழில் கட்டம் 1 மதிப்பாய்வு', 'தொழில்களைத் தேடுக'],
  ])('renders the complete workflow in %s without hard-coded English fallback', async (locale, title, searchLabel) => {
    testContext.locale = locale;
    render(<DreamCareerPhase1ReviewPage />);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: searchLabel })).toBeInTheDocument();
    expect(screen.queryByText('Dream Career Phase 1 review')).not.toBeInTheDocument();
    expect(screen.queryByText('Human review required')).not.toBeInTheDocument();
    expect(screen.queryByText('All statuses')).not.toBeInTheDocument();
    expect(screen.queryByText('Taxonomy rejection acknowledgement')).not.toBeInTheDocument();
    expect(screen.queryByText('Final release remains blocked')).not.toBeInTheDocument();
  });
});

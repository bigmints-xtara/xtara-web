import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Panel from './CareerReviewEvidencePanel';
import type { CareerContentVersion } from '@/lib/career-content-versions';
import type { ReviewSnapshot } from '@/lib/career-review-evidence';
const api = vi.hoisted(() => ({ get: vi.fn(), record: vi.fn(), revoke: vi.fn() }));
vi.mock('@/lib/career-review-evidence', () => ({ getReviewSnapshot: api.get, recordReviewEvidence: api.record, revokeReviewEvidence: api.revoke }));
const versions = [{ id: 'v2', revision: 2, status: 'inReview' }] as CareerContentVersion[];
const snapshot: ReviewSnapshot = { versionId: 'v2', lockVersion: 3, status: 'inReview', contentChecksum: 'digest-v2', content: { title: 'Exact snapshot' }, receipts: [], coverage: { complete: false, blockers: ['Missing Hindi review'] }, allowedScopes: { grades: ['grade8', 'grade11', 'grade12'], locales: ['en', 'ml', 'hi', 'ta'], jurisdictions: ['Kerala', 'Tamil Nadu'] } };
beforeEach(() => { vi.clearAllMocks(); api.get.mockResolvedValue(snapshot); });
async function selectVersion(mayRecord = true) {
  render(<Panel collection="dream_careers" recordId="doctor" versions={versions} mayRecord={mayRecord} />);
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Content version'), { target: { value: 'v2' } });
  await screen.findByText(/Content checksum: digest-v2/);
}
it('pins an explicit version and keeps editors read-only', async () => {
  await selectVersion(false);
  expect(screen.getByText(/verified human Admin/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Record review evidence' })).toBeNull();
  expect(screen.getByText('Missing Hindi review')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith({ collection: 'dream_careers', recordId: 'doctor', versionId: 'v2' });
});
it('submits only explicitly selected scope and retains notes/idempotency after a failure', async () => {
  await selectVersion();
  fireEvent.change(screen.getByLabelText('Review type'), { target: { value: 'jurisdiction' } });
  expect(screen.getByLabelText('Kerala')).not.toBeChecked();
  expect(screen.getByLabelText('Tamil Nadu')).not.toBeChecked();
  fireEvent.click(screen.getByLabelText('Kerala'));
  fireEvent.click(screen.getByLabelText('grade11'));
  fireEvent.click(screen.getByLabelText('en'));
  fireEvent.change(screen.getByLabelText(/Content paths reviewed/), { target: { value: 'studentGuide.aboutCareer.whatYouDo' } });
  fireEvent.change(screen.getByLabelText(/Evidence source IDs/), { target: { value: 'official-source' } });
  fireEvent.change(screen.getByLabelText(/Supported claims/), { target: { value: 'Reviewed claim' } });
  fireEvent.change(screen.getByLabelText(/Applicability rationale/), { target: { value: 'This evidence specifically supports Kerala.' } });
  fireEvent.click(screen.getByLabelText(/I reviewed this exact/));
  api.record.mockRejectedValueOnce(new Error('Readback unavailable')).mockResolvedValueOnce(snapshot);
  fireEvent.click(screen.getByRole('button', { name: 'Record review evidence' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText(/Supported claims/)).toHaveValue('Reviewed claim');
  fireEvent.click(screen.getByRole('button', { name: 'Record review evidence' }));
  await screen.findByText(/Review evidence saved and verified/);
  expect(api.record.mock.calls[0][1]).toEqual(api.record.mock.calls[1][1]);
  expect(api.record.mock.calls[0][1]).toMatchObject({ expectedLockVersion: 3, expectedContentChecksum: 'digest-v2', scope: { grades: ['grade11'], locales: ['en'], jurisdictions: ['Kerala'] } });
});
it('retries snapshot failures without manufacturing review coverage', async () => {
  api.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(snapshot);
  render(<Panel collection="dream_careers" recordId="doctor" versions={versions} mayRecord />);
  fireEvent.change(screen.getByLabelText('Content version'), { target: { value: 'v2' } });
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Retry snapshot' }));
  await waitFor(() => expect(screen.getByText('Review coverage is incomplete.')).toBeInTheDocument());
});
it('shows server receipt identity and requires a reason before revocation', async () => {
  const receipt = { id: 'review-1', versionId: 'v2', contentChecksum: 'digest-v2', idempotencyKey: 'request-1', kind: 'factual' as const, scope: { grades: ['grade11'], locales: ['en'], jurisdictions: ['Kerala'] }, contentPaths: ['studentGuide.aboutCareer.whatYouDo'], sourceIds: ['official'], supportedClaims: ['Checked statement'], applicabilityRationale: 'Applies to this selected scope.', reviewedBy: 'human-admin', reviewedAt: '2026-11-02T00:00:00Z', revoked: false };
  api.get.mockResolvedValue({ ...snapshot, receipts: [receipt] });
  api.revoke.mockResolvedValue({ ...snapshot, lockVersion: 4, receipts: [{ ...receipt, revoked: true }] });
  await selectVersion();
  expect(screen.getByText(/Reviewer: human-admin/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Revoke review' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Revocation reason for review-1'), { target: { value: 'Evidence is no longer applicable.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Revoke review' }));
  await screen.findByText(/Review revocation saved and verified/);
  expect(api.revoke).toHaveBeenCalledWith(expect.objectContaining({ versionId: 'v2' }), 'review-1', expect.objectContaining({ reason: 'Evidence is no longer applicable.', expectedLockVersion: 3, expectedContentChecksum: 'digest-v2' }));
  expect(screen.getByText('factual · Revoked')).toBeInTheDocument();
});

import { beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('./api/client', () => ({ xtaraApi: api }));
import { shareConversation, updateConversation, getConversations, type CareerConversation } from './career-conversations';
const record = { id: 'one', membershipId: 'student-membership', version: 1, title: 'Design', recap: 'Explore design', occurredOn: '2026-11-14', followUpOn: null, actions: [], reflection: '' } as unknown as CareerConversation;
beforeEach(() => { api.get.mockReset(); api.post.mockReset(); api.patch.mockReset(); });
it('creates then independently reads with pinned account and no cached credentials', async () => {
  api.post.mockResolvedValue(record); api.get.mockResolvedValue(record);
  await expect(shareConversation('teacher', 'student-membership', { requestId: 'unique-request-12345', title: 'Design', recap: 'Explore design', occurredOn: '2026-11-14', followUpOn: null, actions: [] })).resolves.toEqual(record);
  expect(api.get).toHaveBeenCalledWith('/organizations/students/student-membership/conversations/one', { expectedUserId: 'teacher', credentials: 'omit', cache: 'no-store' });
});
it('rejects acknowledged writes when independent readback differs', async () => {
  api.patch.mockResolvedValue({ ...record, version: 2, reflection: 'New reflection' }); api.get.mockResolvedValue(record);
  await expect(updateConversation('student', record, { kind: 'reflection', reflection: 'New reflection', version: 1 })).rejects.toThrow('could not be verified');
});
it('reads student history through the self endpoint and validates completed action readback', async () => {
  api.get.mockResolvedValueOnce({ items: [record], nextOffset: null, canRecord: false }); await getConversations('student');
  expect(api.get.mock.calls[0][0]).toBe('/me/conversations?offset=0');
  const saved = { ...record, version: 2, actions: [{ id: 'step-1', completedAt: '2026-11-15' }] }; api.patch.mockResolvedValue(saved); api.get.mockResolvedValue(saved);
  await expect(updateConversation('student', record, { kind: 'action', actionId: 'step-1', completed: true, version: 1 })).resolves.toEqual(saved);
});

import { beforeEach, expect, it, vi } from 'vitest';
import { updatePersonalInfo } from './profile-service';
const api = vi.hoisted(() => ({ patch: vi.fn(), get: vi.fn() }));
vi.mock('@/lib/firebase-client', () => ({ getFirebaseAuth: () => ({ currentUser: { uid: 'learner' } }) }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));
beforeEach(() => { vi.clearAllMocks(); api.patch.mockResolvedValue({}); });
it('personal updates require matching authenticated account readback', async () => {
  api.get.mockResolvedValue({ uid: 'other-user', fullName: 'Asha', displayName: 'Ash' });
  await expect(updatePersonalInfo('learner', { fullName: ' Asha ', displayName: 'Ash' })).rejects.toThrow('readback');
  api.get.mockResolvedValue({ uid: 'learner', fullName: 'Asha', displayName: 'Ash' });
  await expect(updatePersonalInfo('learner', { fullName: ' Asha ', displayName: 'Ash' })).resolves.toBeUndefined();
});

import { beforeEach, expect, it, vi } from 'vitest';
import { xtaraApi } from './api/client';
import { getCareerOverview, getExplorerAccountContext } from './career-overview-api';
import { getDirectionOverview } from './direction-api';
vi.mock('./api/client', () => ({ xtaraApi: { get: vi.fn() } }));
vi.mock('./direction-api', () => ({ getDirectionOverview: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it('binds private reads to the expected owner and rejects incomplete assessment state', async () => {
  vi.mocked(xtaraApi.get).mockResolvedValue({});
  vi.mocked(getDirectionOverview).mockResolvedValue({ direction: null });
  await expect(getExplorerAccountContext('student')).rejects.toThrow('incomplete');
  expect(xtaraApi.get).toHaveBeenCalledWith('/assessment/latest', { expectedUserId: 'student' });
  expect(getDirectionOverview).toHaveBeenCalledWith('en', 'student');
  vi.mocked(xtaraApi.get).mockResolvedValue({ assessment: null });
  await expect(getExplorerAccountContext('student')).resolves.toMatchObject({ assessed: false });
});
it('uses the public generated endpoint and rejects mismatched overview identities', async () => {
  vi.mocked(xtaraApi.get).mockResolvedValue({ schemaVersion: 1, id: 'other', locale: 'en' });
  await expect(getCareerOverview('doctor')).rejects.toThrow('requested career');
  expect(xtaraApi.get).toHaveBeenCalledWith('/api/v1/dream-careers/doctor/overview?locale=en', { signal: undefined });
});

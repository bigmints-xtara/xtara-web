import { beforeEach, expect, it, vi } from 'vitest';
import { pathwayFromAccount, saveAccountStudy } from './profile-study';
import type { UserProfile } from './firebase/auth-helpers';
const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), put: vi.fn(), owner: 'learner' }));
vi.mock('@/lib/firebase-client', () => ({ getFirebaseAuth: () => ({ currentUser: { uid: api.owner } }) }));
vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));
const pathway = { state: 'Kerala', district: 'Ernakulam', city: 'Kochi', educationBoard: 'CBSE', studyLanguage: '', locationPreference: '', affordability: '', scholarshipInterest: '' };
const values = { pathway, grade: 'grade11' as const, academicYear: '2026-27', subjects: ['Science'] };
const saved = { uid: 'learner', currentGrade: 'grade11', gradeStage: 'grade11', educationBoard: 'CBSE', state: 'Kerala', city: 'Kochi', country: 'India', subjectsLearning: ['Science'], pathwayProfile: { ...pathway, updatedAt: 'server-time' } };
beforeEach(() => { vi.clearAllMocks(); api.owner = 'learner'; api.patch.mockResolvedValue(saved); api.put.mockResolvedValue({ period: {} }); });
it('uses explicit empty account fields and excludes stored timestamp', () => {
  const draft = pathwayFromAccount({ ...saved, pathwayProfile: { ...saved.pathwayProfile, city: '', studyLanguage: '' } } as unknown as UserProfile);
  expect(draft.city).toBe('');
  expect(draft.studyLanguage).toBe('');
  expect(draft).not.toHaveProperty('updatedAt');
  expect(pathwayFromAccount({ ...saved, pathwayProfile: null } as unknown as UserProfile).state).toBe('');
});
it('does not announce success when writes fail or readback differs', async () => {
  api.patch.mockRejectedValueOnce(new Error('offline'));
  await expect(saveAccountStudy('learner', values)).rejects.toThrow('offline');
  expect(api.get).not.toHaveBeenCalled();
  api.get.mockImplementation(async (path: string) => path === '/me' ? { ...saved, pathwayProfile: { ...pathway, city: 'Old city' } } : { period: { academicYear: '2026-27', gradeStage: 'grade11', boardId: 'CBSE', subjects: ['Science'] } });
  await expect(saveAccountStudy('learner', values)).rejects.toThrow('readback');
});
it('returns only the verified server profile after both reads agree', async () => {
  api.get.mockImplementation(async (path: string) => path === '/me' ? saved : { period: { academicYear: '2026-27', gradeStage: 'grade11', boardId: 'CBSE', subjects: ['Science'] } });
  await expect(saveAccountStudy('learner', values)).resolves.toEqual(saved);
  expect(api.get).toHaveBeenCalledWith('/me', { expectedUserId: 'learner' });
  expect(api.get).toHaveBeenCalledWith('/me/academic-period', { expectedUserId: 'learner' });
});

it('stops the second mutation if account changes while profile write is pending', async () => {
  let finish!: () => void;
  api.patch.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
  const saving = saveAccountStudy('learner', values);
  api.owner = 'other-account';
  finish();
  await expect(saving).rejects.toThrow('account changed');
  expect(api.put).not.toHaveBeenCalled();
  expect(api.get).not.toHaveBeenCalled();
});
it('normalizes academic year and subjects before writes and comparison', async () => {
  api.get.mockImplementation(async (path: string) => path === '/me' ? saved : { period: { academicYear: '2026-27', gradeStage: 'grade11', boardId: 'CBSE', subjects: ['Science'] } });
  await expect(saveAccountStudy('learner', { ...values, academicYear: ' 2026-27 ', subjects: [' Science ', 'Science'] })).resolves.toEqual(saved);
  expect(api.put).toHaveBeenCalledWith('/me/academic-period', expect.objectContaining({ academicYear: '2026-27', subjects: ['Science'] }), { expectedUserId: 'learner' });
});

it('matches server case-insensitive subject deduplication and final spelling', async () => {
  const normalized = { ...saved, subjectsLearning: ['science'] };
  api.get.mockImplementation(async (path: string) => path === '/me' ? normalized : { period: { academicYear: '2026-27', gradeStage: 'grade11', boardId: 'CBSE', subjects: ['science'] } });
  await expect(saveAccountStudy('learner', { ...values, subjects: ['Science', ' science '] })).resolves.toEqual(normalized);
  expect(api.patch).toHaveBeenCalledWith('/me', expect.objectContaining({ subjectsLearning: ['science'] }), { expectedUserId: 'learner' });
});

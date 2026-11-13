import { beforeEach, describe, expect, it, vi } from 'vitest';
import { xtaraApi } from './api/client';
import { pursueCareer } from './career-pursuit-api';
import { getFirebaseAuth } from './firebase-client';
vi.mock('./api/client', () => ({ xtaraApi: { get: vi.fn(), put: vi.fn() } }));
vi.mock('./firebase-client', () => ({ getFirebaseAuth: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getFirebaseAuth).mockReturnValue({ currentUser: { uid: 'learner-1' } } as ReturnType<typeof getFirebaseAuth>);
});
describe('authenticated career pursuit', () => {
  it('submits identities only and verifies the parent plus specialization readback', async () => {
    const response = { pursuit: {careerId:'specialty',dreamCareerId:'parent',directionId:'health'},direction:{savedDirections:{health:{dreamCareerIds:['parent']}}} };
    vi.mocked(xtaraApi.put).mockResolvedValue(response);
    vi.mocked(xtaraApi.get).mockResolvedValue(response);
    expect(await pursueCareer('specialty','health','learner-1')).toEqual(response);
    expect(xtaraApi.put).toHaveBeenCalledWith('/me/career-pursuit',{careerId:'specialty',directionId:'health'},{expectedUserId:'learner-1'});
    expect(xtaraApi.get).toHaveBeenCalledWith('/me/career-pursuit',{expectedUserId:'learner-1'});
  });
  it('does not report success for missing or different saved choices', async () => {
    vi.mocked(xtaraApi.put).mockResolvedValue({});
    vi.mocked(xtaraApi.get).mockResolvedValue({pursuit:null,direction:null});
    await expect(pursueCareer('career','health','learner-1')).rejects.toThrow('verified');
  });
  it('rejects readback if the signed-in account changes while the request is pending', async () => {
    vi.mocked(xtaraApi.get).mockResolvedValue({ pursuit: { careerId:'career', dreamCareerId:'career', directionId:'health' }, direction: { savedDirections: { health: { dreamCareerIds:['career'] } } } });
    vi.mocked(getFirebaseAuth).mockReturnValue({ currentUser: { uid:'another-learner' } } as ReturnType<typeof getFirebaseAuth>);
    await expect(pursueCareer('career','health','learner-1')).rejects.toThrow('account changed');
  });
});

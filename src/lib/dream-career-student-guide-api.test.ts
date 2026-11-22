import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ xtaraApi: { get: mocks.get } }));

import {
  getDreamCareerStudentContext,
  getDreamCareerStudentGuide,
} from './dream-career-student-guide-api';

describe('Dream Career Student Guide API adapter', () => {
  beforeEach(() => {
    mocks.get.mockResolvedValue({});
  });

  it('requests the public guide by accepted career ID and optional location without a catalogue limit', async () => {
    await getDreamCareerStudentGuide('data/engineer', {
      locale: 'en',
      location: { city: 'Kochi', state: 'Kerala', country: 'India' },
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/dream-careers/data%2Fengineer/student-guide?locale=en&city=Kochi&state=Kerala&country=India',
      expect.objectContaining({ signal: undefined }),
    );
    expect(mocks.get.mock.calls[0][0]).not.toContain('limit=100');
  });

  it('requests the localized saved screen for the current account', async () => {
    await getDreamCareerStudentContext('data/engineer', { expectedUserId: 'learner', screenLocale: 'ta' });
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/me/dream-careers/data%2Fengineer/student-context?screen=1&locale=ta&visuals=1',
      expect.objectContaining({ expectedUserId: 'learner' }),
    );
  });

  it.each([{ schemaVersion: 2 }, { schemaVersion: 1, sections: [{ id: 'study' }] }])('keeps legacy context when the optional screen is incompatible', async screen => {
    mocks.get.mockResolvedValueOnce({ careerId: 'data-engineer', saved: true, screen });
    expect(await getDreamCareerStudentContext('data-engineer', { screenLocale: 'en' })).toEqual({
      careerId: 'data-engineer', saved: true, screen: undefined,
    });
  });

  it('retains approved media on the hero and nested specialization after parsing the actual wire format', async () => {
    const art = { url: 'https://xtara.ai/xtara-service/api/v1/media/images/approved', alt: 'Medicine' };
    const child = { url: 'http://127.0.0.1:4012/api/v1/media/images/cardio', alt: 'Cardiology' };
    const screen = { schemaVersion: 1, careerId: 'doctor', locale: 'en', title: 'Medicine', summary: '', englishFallback: false,
      illustration: art, tabs: [{ id: 'specializations', title: 'Specializations', sectionIds: ['specializations'] }],
      sections: [{ id: 'specializations', title: 'Specializations', blocks: [{ kind: 'specializations', title: 'Specializations',
        items: [{ id: 'cardiologist', title: 'Cardiology', overview: 'Heart health', illustration: child }] }] }] };
    mocks.get.mockResolvedValueOnce({ careerId: 'doctor', screen });
    expect((await getDreamCareerStudentContext('doctor', { screenLocale: 'en' })).screen).toEqual(screen);
  });

  it('requests signed-in context through its separate authenticated operation', async () => {
    await getDreamCareerStudentContext('data/engineer');

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/me/dream-careers/data%2Fengineer/student-context',
      expect.objectContaining({ signal: undefined }),
    );
  });
});

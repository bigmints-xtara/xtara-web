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

  it('requests signed-in context through its separate authenticated operation', async () => {
    await getDreamCareerStudentContext('data/engineer');

    expect(mocks.get).toHaveBeenCalledWith(
      '/api/v1/me/dream-careers/data%2Fengineer/student-context',
      expect.objectContaining({ signal: undefined }),
    );
  });
});

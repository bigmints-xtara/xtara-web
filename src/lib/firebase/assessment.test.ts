import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  xtaraApi: api,
}));

import {
  generateRecommendations,
  getCareerPath,
  getQuestionnaire,
  saveAssessment,
  waitForCareerPath,
} from './assessment';

describe('Assessment Service API boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getQuestionnaire', () => {
    it('returns a questionnaire array response', async () => {
      api.get.mockResolvedValueOnce([{ id: 'q1', label: 'Name', fieldType: 'text' }]);

      await expect(getQuestionnaire()).resolves.toEqual([
        { id: 'q1', label: 'Name', fieldType: 'text' },
      ]);
      expect(api.get).toHaveBeenCalledWith('/questionnaire');
    });

    it('returns steps from an enveloped questionnaire response', async () => {
      api.get.mockResolvedValueOnce({ steps: [{ id: 'q2', label: 'Age', fieldType: 'number' }] });

      await expect(getQuestionnaire()).resolves.toEqual([
        { id: 'q2', label: 'Age', fieldType: 'number' },
      ]);
    });

    it('returns an empty array when the API has no steps', async () => {
      api.get.mockResolvedValueOnce({});
      await expect(getQuestionnaire()).resolves.toEqual([]);
    });

    it('surfaces API failures to the caller', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(getQuestionnaire()).rejects.toThrow('Network error');
    });
  });

  describe('saveAssessment', () => {
    it('sends answers and returns the created assessment ID', async () => {
      api.post.mockResolvedValueOnce({ assessmentId: 'assessment-1' });

      await expect(saveAssessment('user-1', { interests: ['coding'] }, true)).resolves.toBe('assessment-1');
      expect(api.post).toHaveBeenCalledWith('/assessment', {
        answers: { interests: ['coding'] },
        isRetake: true,
      });
    });

    it('surfaces save failures', async () => {
      api.post.mockRejectedValueOnce(new Error('Save failed'));
      await expect(saveAssessment('user-2', { interests: ['art'] })).rejects.toThrow('Save failed');
    });
  });

  it('queues recommendation generation with the assessment context', async () => {
    api.post.mockResolvedValueOnce({ jobId: 'job-1' });
    const assessmentData = { results: { fullName: 'Alice' } };

    await expect(generateRecommendations('assessment-1', assessmentData)).resolves.toEqual({ jobId: 'job-1' });
    expect(api.post).toHaveBeenCalledWith('/recommendations/jobs', {
      assessmentId: 'assessment-1',
      assessmentData,
    });
  });

  describe('getCareerPath', () => {
    it('returns an API career path', async () => {
      api.get.mockResolvedValueOnce({ id: 'cp-1', title: 'Software Engineer' });
      await expect(getCareerPath('cp-1')).resolves.toEqual({ id: 'cp-1', title: 'Software Engineer' });
    });

    it('returns null when the path cannot be loaded', async () => {
      api.get.mockRejectedValueOnce(new Error('Not found'));
      await expect(getCareerPath('cp-2')).resolves.toBeNull();
    });
  });

  describe('waitForCareerPath', () => {
    it('returns a career path ID when a later poll finds one', async () => {
      api.get
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ items: [{ id: 'cp-1' }] });

      const result = waitForCareerPath('assessment-1', 3);
      await vi.advanceTimersByTimeAsync(2000);

      await expect(result).resolves.toBe('cp-1');
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('returns null after the configured attempts', async () => {
      api.get.mockResolvedValue({ items: [] });

      const result = waitForCareerPath('assessment-1', 3);
      await vi.advanceTimersByTimeAsync(14000);

      await expect(result).resolves.toBeNull();
      expect(api.get).toHaveBeenCalledTimes(3);
    });
  });
});

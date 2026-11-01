import { assessmentSubmission } from '@/lib/assessment-submission';
import { xtaraApi } from '@/lib/api/client';
import type { Question as QuestionModel } from '@/types/assessment';

export const AssessmentService = {
  async getQuestionnaire(): Promise<QuestionModel[]> {
    const response = await xtaraApi.get<QuestionModel[] | { steps?: QuestionModel[] }>('/questionnaire');
    return Array.isArray(response) ? response : response.steps || [];
  },

  async saveAssessmentResults(userId: string, results: Record<string, unknown>, isRetake = false): Promise<void> {
    await xtaraApi.post('/assessment', {
      answers: assessmentSubmission(results),
      isRetake,
    }, { expectedUserId: userId });
  },

  async hasCompletedAssessment(_userId: string): Promise<boolean> {
    const latest = await xtaraApi.get<{ assessment?: unknown }>('/assessment/latest').catch(() => ({ assessment: null }));
    return Boolean(latest.assessment);
  },
};

export default AssessmentService;

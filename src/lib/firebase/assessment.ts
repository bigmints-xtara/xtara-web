import { assessmentSubmission } from '@/lib/assessment-submission';
import { xtaraApi } from '@/lib/api/client';
import type { Question } from '@/types/assessment';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getQuestionnaire(): Promise<Question[]> {
  const response = await xtaraApi.get<Question[] | { steps?: Question[] }>('/questionnaire');
  return Array.isArray(response) ? response : response.steps || [];
}

export async function saveAssessment(userId: string, data: Record<string, unknown>, isRetake = false, submissionId?: string): Promise<string> {
  const result = await xtaraApi.post<{ assessmentId: string }>('/assessment', {
    answers: assessmentSubmission(data),
    isRetake,
    ...(submissionId ? { submissionId } : {}),
  }, { expectedUserId: userId });
  return result.assessmentId;
}

export async function generateRecommendations(assessmentId: string, assessmentData: any) {
  return xtaraApi.post('/recommendations/jobs', {
    assessmentId,
    assessmentData,
  });
}

export async function getCareerPath(documentId: string): Promise<any> {
  return xtaraApi.get(`/career-paths/${documentId}`).catch(() => null);
}

export async function waitForCareerPath(_assessmentId: string, maxAttempts = 15): Promise<string | null> {
  let delay = 2000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await xtaraApi.get<{ items?: Array<{ id: string }> }>('/career-paths/me').catch(() => ({ items: [] }));
    const path = response.items?.[0];
    if (path?.id) return path.id;
    await sleep(delay);
    delay = Math.min(delay * 2, 16000);
  }
  return null;
}

export async function getUserCareerPath(_userId: string): Promise<any | null> {
  const response = await xtaraApi.get<{ items?: any[] }>('/career-paths/me').catch(() => ({ items: [] }));
  return response.items?.[0] || null;
}

export async function getUserCareerPaths(_userId: string): Promise<any[]> {
  const response = await xtaraApi.get<{ items?: any[] }>('/career-paths/me').catch(() => ({ items: [] }));
  return response.items || [];
}

export default getUserCareerPath;

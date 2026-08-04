import { xtaraApi } from '@/lib/api/client';

export type AcademicGrade = 'grade8' | 'grade9' | 'grade10';
export type AcademicExamType = 'unit_test' | 'term' | 'annual' | 'board' | 'other';

export interface AcademicPeriod {
  id?: string;
  userId?: string;
  academicYear: string;
  gradeStage: AcademicGrade;
  boardId: string;
  subjects: string[];
  status?: 'active';
  updatedAt?: string;
}

export interface AcademicSubjectResult {
  subject: string;
  status: 'scored';
  marksObtained: number;
  maximumMarks: number;
}

export interface AcademicExamInput {
  examName: string;
  examType: AcademicExamType;
  examDate: string;
  academicYear: string;
  gradeStage: AcademicGrade;
  note?: string;
  subjectResults: AcademicSubjectResult[];
}

export interface AcademicExamRecord extends AcademicExamInput {
  id: string;
  logicalId: string;
  revision: number;
  source: 'self_reported' | 'institution';
  verification: 'unverified' | 'verified' | 'disputed';
  createdAt?: string;
}

export async function getAcademicProgress(): Promise<{ period: AcademicPeriod | null; exams: AcademicExamRecord[] }> {
  const [periodResponse, examsResponse] = await Promise.all([
    xtaraApi.get<{ period?: AcademicPeriod | null }>('/me/academic-period'),
    xtaraApi.get<{ items?: AcademicExamRecord[] }>('/me/academic-exams'),
  ]);
  return { period: periodResponse.period ?? null, exams: examsResponse.items ?? [] };
}

export async function saveAcademicPeriod(period: Omit<AcademicPeriod, 'id' | 'userId' | 'status' | 'updatedAt'>): Promise<AcademicPeriod> {
  const response = await xtaraApi.put<{ period: AcademicPeriod }>('/me/academic-period', period);
  return response.period;
}

export async function addAcademicExam(exam: AcademicExamInput): Promise<AcademicExamRecord> {
  const response = await xtaraApi.post<{ exam: AcademicExamRecord }>('/me/academic-exams', exam);
  return response.exam;
}

export async function deleteAcademicExam(id: string): Promise<void> {
  await xtaraApi.delete(`/me/academic-exams/${encodeURIComponent(id)}`);
}

export function academicExamPercentage(exam: Pick<AcademicExamInput, 'subjectResults'>): number {
  const totals = exam.subjectResults.reduce(
    (sum, item) => ({ obtained: sum.obtained + item.marksObtained, maximum: sum.maximum + item.maximumMarks }),
    { obtained: 0, maximum: 0 },
  );
  return totals.maximum ? Math.round((totals.obtained / totals.maximum) * 1000) / 10 : 0;
}

export function defaultAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const start = date.getMonth() < 3 ? year - 1 : year;
  return `${start}-${String(start + 1).slice(-2)}`;
}

import { xtaraApi } from '@/lib/api/client';

export async function updatePersonalInfo(_userId: string, values: { fullName: string; displayName: string }) {
  await xtaraApi.patch('/me', {
    displayName: values.displayName.trim(),
    fullName: values.fullName.trim(),
  });
}

export async function updateLearnerProfile(_userId: string, values: Record<string, unknown>) {
  return xtaraApi.patch('/me', values);
}

export async function updateAcademicProfile(
  _userId: string,
  academicData: {
    currentGrade?: string;
    educationBoard?: string;
    currentStream?: string;
    grade12Streams?: string[];
  }
) {
  await xtaraApi.patch('/me', academicData);
}

export async function updateSubjects(_userId: string, subjects: string[]) {
  await xtaraApi.patch('/me', { subjectsLearning: subjects });
}

export async function updateExamMarks(_userId: string, examMarks: Record<string, number>) {
  await xtaraApi.patch('/me', {
    exam_performance: {
      marks: examMarks,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function updatePursuingCareer(_userId: string, careerId: string) {
  await xtaraApi.put('/me/current-career', { careerId });
}

export async function updateLocation(_userId: string, city: string, state: string, country: string) {
  await xtaraApi.patch('/me', {
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
  });
}

export async function getAssessmentData(_userId: string) {
  void _userId;
  const latest = await xtaraApi.get<{ assessment?: { results?: unknown } }>('/assessment/latest');
  return latest.assessment?.results || latest.assessment || null;
}

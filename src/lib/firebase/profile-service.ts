import { getFirebaseAuth } from '@/lib/firebase-client';
import { xtaraApi } from '@/lib/api/client';

export async function updatePersonalInfo(userId: string, values: { fullName: string; displayName: string }) {
  const assertOwner = () => { if (getFirebaseAuth().currentUser?.uid !== userId) throw new Error('The signed-in account changed. Reopen your profile before saving.'); };
  assertOwner();
  await xtaraApi.patch('/me', {
    displayName: values.displayName.trim(),
    fullName: values.fullName.trim(),
  }, { expectedUserId: userId });
  assertOwner();
  const saved = await xtaraApi.get<{ uid?: string; fullName?: string; displayName?: string }>('/me', { expectedUserId: userId });
  assertOwner();
  if (saved.uid !== userId || saved.fullName !== values.fullName.trim() || saved.displayName !== values.displayName.trim()) {
    throw new Error('Your personal details were not returned by account readback.');
  }
}

export async function updateLearnerProfile(userId: string, values: Record<string, unknown>) {
  return xtaraApi.patch('/me', values, { expectedUserId: userId });
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

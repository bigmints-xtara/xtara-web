import { getFirebaseAuth } from '@/lib/firebase-client';
import { xtaraApi } from '@/lib/api/client';
import { saveAcademicPeriod, type AcademicGrade, type AcademicPeriod } from '@/lib/academic-progress-api';
import { updateLearnerProfile } from '@/lib/firebase/profile-service';
import type { UserProfile } from '@/lib/firebase/auth-helpers';
import { emptyPathwayProfile, type PathwayProfileDraft } from '@/lib/pathway-profile';

/** Explicit account nulls/empty fields never borrow anonymous browser answers. */
export function pathwayFromAccount(profile: UserProfile | null): PathwayProfileDraft {
  const saved = profile?.pathwayProfile;
  const legacy = saved === undefined ? { state: profile?.state ?? '', city: profile?.city ?? '', educationBoard: profile?.educationBoard ?? '' } : {};
  const values = { ...emptyPathwayProfile, ...legacy, ...(saved ?? {}) };
  return Object.fromEntries(Object.keys(emptyPathwayProfile).map((key) => [key, values[key as keyof PathwayProfileDraft] ?? ''])) as unknown as PathwayProfileDraft;
}
export async function saveAccountStudy(userId: string, values: { pathway: PathwayProfileDraft; grade: AcademicGrade; academicYear: string; subjects: string[] }): Promise<UserProfile> {
  const assertOwner = () => { if (getFirebaseAuth().currentUser?.uid !== userId) throw new Error('The signed-in account changed. Reopen your profile before saving.'); };
  assertOwner();
  const academicYear = values.academicYear.trim();
  const subjects = [...new Map(values.subjects.map((subject) => subject.trim()).filter(Boolean).map((subject) => [subject.toLocaleLowerCase(), subject])).values()];
  const pathway = Object.fromEntries(Object.entries(values.pathway).map(([key, value]) => [key, value.trim()])) as unknown as PathwayProfileDraft;
  const pathwayProfile = { ...pathway, updatedAt: new Date().toISOString() };
  const patch = { currentGrade: values.grade, gradeStage: values.grade, educationBoard: pathway.educationBoard, city: pathway.city, state: pathway.state, country: 'India', subjectsLearning: subjects, pathwayProfile };
  await updateLearnerProfile(userId, patch);
  assertOwner();
  await saveAcademicPeriod({ academicYear, gradeStage: values.grade, boardId: pathway.educationBoard, subjects }, userId);
  assertOwner();
  const [profile, academic] = await Promise.all([
    xtaraApi.get<UserProfile>('/me', { expectedUserId: userId }),
    xtaraApi.get<{ period: AcademicPeriod | null }>('/me/academic-period', { expectedUserId: userId }),
  ]);
  assertOwner();
  const sameSubjects = (actual: string[] | undefined) => JSON.stringify([...(actual ?? [])].sort()) === JSON.stringify([...subjects].sort());
  if (profile.uid !== userId || profile.gradeStage !== values.grade || profile.currentGrade !== values.grade
    || profile.educationBoard !== pathway.educationBoard || profile.state !== pathway.state || profile.city !== pathway.city || profile.country !== 'India'
    || !sameSubjects(profile.subjectsLearning) || !profile.pathwayProfile
    || Object.entries(pathway).some(([key, value]) => profile.pathwayProfile?.[key as keyof PathwayProfileDraft] !== value)
    || academic.period?.academicYear !== academicYear || academic.period.gradeStage !== values.grade || academic.period.boardId !== pathway.educationBoard || !sameSubjects(academic.period.subjects)) {
    throw new Error('Your study details were not returned by account readback. Your form is kept for retry.');
  }
  return profile;
}

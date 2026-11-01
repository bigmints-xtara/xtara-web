import {
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { xtaraApi } from '@/lib/api/client';
import { createApiSession } from '@/lib/api/auth';
import { getFirebaseAuth } from '@/lib/firebase-client';

export interface UserRole {
  isSuperAdmin?: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isStudent: boolean;
  isParent: boolean;
  isEducator: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
  isEmailVerified?: boolean;
  roles?: UserRole;
  adminRole?: 'super_admin' | 'admin' | 'editor' | null;
  isSuperAdmin?: boolean;
  city?: string;
  state?: string;
  country?: string;
  fullName?: string;
  currentGrade?: string;
  educationBoard?: string;
  currentStream?: string;
  grade12Streams?: string | string[];
  subjectsLearning?: string[];
  pursuingCareer?: string;
  exam_performance?: {
    marks?: Record<string, number>;
    timestamp?: string;
  };
  gradeStage?: 'grade8' | 'grade9' | 'grade10' | 'grade11' | 'grade12';
  pathwayProfile?: {
    state?: string;
    district?: string;
    city?: string;
    educationBoard?: string;
    studyLanguage?: string;
    locationPreference?: string;
    affordability?: string;
    scholarshipInterest?: string;
    updatedAt?: string;
  };
  discoverySummary?: {
    assessmentVersion?: string;
    areaIds?: string[];
    signalIds?: string[];
    traitIds?: string[];
    pursuedAreaId?: string;
    selectedDreamCareerIds?: string[];
  };
  [key: string]: unknown;
}

export const createAnonymousUser = async (fullName?: string): Promise<UserCredential> => {
  const credential = await signInAnonymously(getFirebaseAuth());
  if (fullName) {
    await updateProfile(credential.user, { displayName: fullName });
  }
  await createApiSession(await credential.user.getIdToken(true));
  return credential;
};

export const createUserDocument = async (user: User, additionalData: Partial<UserProfile> = {}) => {
  await createApiSession(await user.getIdToken(true));
  if (Object.keys(additionalData).length) {
    await xtaraApi.patch('/me', additionalData);
  }
};

export const getUserProfile = async (_uid: string): Promise<UserProfile | null> => {
  void _uid;
  return xtaraApi.get<UserProfile>('/me').catch(() => null);
};

export const convertAnonymousUser = async (user: User, email: string, pass: string, name: string) => {
  const credential = EmailAuthProvider.credential(email, pass);
  const userCredential = await linkWithCredential(user, credential);
  await updateProfile(userCredential.user, { displayName: name });
  await createApiSession(await userCredential.user.getIdToken(true));
  await xtaraApi.patch('/me', { email, displayName: name, fullName: name, isAnonymous: false });
  return userCredential.user;
};

export default createUserDocument;

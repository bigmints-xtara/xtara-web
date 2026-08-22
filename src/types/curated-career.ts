import type { AdminEntity } from '@/types/admin';
import type {
  DreamCareerDetailProfileReview,
  DreamCareerDetailProfileTranslations,
  DreamCareerDetailProfileV3,
} from '@/types/dream-career-detail-profile';

export type CurationStatus = 'draft' | 'inReview' | 'published' | 'retired';
export type AssessmentGrade = 'grade8' | 'grade9' | 'grade10';

export interface ReviewMetadata {
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ProvenanceMetadata {
  origin: 'editorial' | 'legacy_migration' | 'seed';
  sourceVersion: string;
  sourceIds: string[];
  legacyDocumentIds: string[];
  importedAt?: string;
}

export interface FutureDirectionTranslation {
  title: string;
  summary: string;
  reflectionPrompt: string;
}

export interface CareerRoleTranslation {
  title: string;
  summary: string;
  dailyWork: string[];
  workSetting: string;
  pathway: string;
  tradeoffs: string[];
  specializations: string[];
  tryThis: string;
}

export interface FutureDirection extends AdminEntity {
  slug: string;
  recordType: 'future_direction';
  schemaVersion: 1;
  version: number;
  status: CurationStatus;
  published: boolean;
  inReview: boolean;
  defaultLocale: 'en' | 'ml' | 'hi' | 'ta';
  translations: {
    en: FutureDirectionTranslation;
    ml?: FutureDirectionTranslation;
    hi?: FutureDirectionTranslation;
    ta?: FutureDirectionTranslation;
  };
  signalWeights: Record<string, number>;
  minimumEvidence: {
    distinctQuestions: number;
    distinctSignals: number;
    totalScore: number;
  };
  roleIds: string[];
  skillIds: string[];
  toolIds: string[];
  courseQueries?: string[];
  gradeGuidance: {
    en: Record<AssessmentGrade, string[]>;
    ml?: Record<AssessmentGrade, string[]>;
    hi?: Record<AssessmentGrade, string[]>;
    ta?: Record<AssessmentGrade, string[]>;
  };
  displayOrder: number;
  review: ReviewMetadata;
  provenance: ProvenanceMetadata;
}

export interface CuratedDreamCareer extends AdminEntity {
  slug: string;
  recordType: 'career_role';
  schemaVersion: 1;
  version: number;
  status: CurationStatus;
  published: boolean;
  inReview: boolean;
  defaultLocale: 'en' | 'ml' | 'hi' | 'ta';
  translations: {
    en: CareerRoleTranslation;
    ml?: CareerRoleTranslation;
    hi?: CareerRoleTranslation;
    ta?: CareerRoleTranslation;
  };
  futureDirectionIds: string[];
  primaryFutureDirectionId: string;
  skillIds: string[];
  toolIds: string[];
  sourceIds: string[];
  regulated?: boolean;
  regulation?: {
    status: 'regulated' | 'education-regulated' | 'requirements-vary' | 'not-role-regulated';
    jurisdiction: string;
    authoritySourceIds: string[];
  };
  courseQueries?: string[];
  imageUrl?: string;
  salaryRange?: string;
  growthOutlook?: string;
  detailProfile?: DreamCareerDetailProfileV3;
  detailProfileReview?: DreamCareerDetailProfileReview;
  detailProfileTranslations?: DreamCareerDetailProfileTranslations;
  translationOperation?: {
    schemaVersion: 1;
    operation: 'dream-career-translation';
    sourceReleaseId: string;
    sourceTaskId: string;
    sourceCareerId: string;
    sourceSha256: string;
    translationSha256: string;
    runId: string;
    idempotencyKey: string;
    priorDraftId?: string;
    translationCoverage?: {
      canonicalLocale: 'en';
      releaseBlocking: false;
      locales: Partial<Record<'en' | 'ml' | 'hi' | 'ta', {
        canonical?: boolean;
        complete: boolean;
        fieldStatus?: Record<string, 'canonical' | 'translated' | 'missing'>;
        totalFields?: number;
        translatedFieldTokens?: string[];
      }>>;
    };
  };
  review: ReviewMetadata;
  provenance: ProvenanceMetadata;
}

export interface CuratedCareerSource extends AdminEntity {
  slug: string;
  recordType: 'career_source';
  schemaVersion: 1;
  version: number;
  status: CurationStatus;
  published: boolean;
  inReview: boolean;
  label: string;
  organization: string;
  url: string;
  lastVerifiedAt?: string;
  review: ReviewMetadata;
}

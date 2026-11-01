// Mirrors the approved DreamCareerStudentGuideV1 and public response contracts.
// Replace this seam with generated OpenAPI types when the API generator exposes them.

export type DreamCareerGuideLocale = 'en' | 'ml' | 'hi' | 'ta';
export type DreamCareerStudentGuideChapter = 'aboutCareer' | 'howToGetThere' | 'whatYouCanDoNow';
export type StudentGuideSourceIds = string[];

export interface CareerActivity {
  id: string;
  title: string;
  description: string;
  sourceIds: StudentGuideSourceIds;
}

export interface CareerDayMoment extends CareerActivity {
  order: number;
  timeLabel: string;
}

export interface EarningsScenario {
  id: string;
  careerStage: 'intern' | 'trainee' | 'junior' | 'associate' | 'midLevel' | 'senior' | 'lead' | 'manager' | 'independent' | 'varies';
  geography: string;
  currency: 'INR';
  amountMin: number;
  amountMax: number;
  period: 'month' | 'year';
  asOf: string;
  sourceIds: StudentGuideSourceIds;
}

export interface NotablePerson {
  id: string;
  name: string;
  whyRelevant: string;
  sourceIds: StudentGuideSourceIds;
}

export interface CareerSubjectGuidance {
  subjectId: string;
  importance: 'core' | 'helpful' | 'optional';
  guidance: string;
  gradeIds: Array<'grade8' | 'grade9' | 'grade10' | 'grade11' | 'grade12'>;
  sourceIds: StudentGuideSourceIds;
}

export interface EducationRoute {
  id: string;
  routeType: 'diploma' | 'degree' | 'vocational' | 'postgraduate' | 'portfolio' | 'regulated' | 'apprenticeship' | 'other';
  title: string;
  description: string;
  courseConceptIds: string[];
  sourceIds: StudentGuideSourceIds;
}

export interface FirstJobStep {
  id: string;
  order: number;
  title: string;
  description: string;
  sourceIds: StudentGuideSourceIds;
}

export interface CareerProgressionStage extends FirstJobStep {
  level: 'intern' | 'trainee' | 'junior' | 'associate' | 'midLevel' | 'senior' | 'lead' | 'manager' | 'director' | 'independent' | 'varies';
}

export interface CareerSkillGuidance {
  skillId: string;
  importance: 'core' | 'important' | 'useful';
  howUsed: string;
  sourceIds: StudentGuideSourceIds;
}

export interface CareerToolGuidance {
  toolId: string;
  importance: 'core' | 'important' | 'useful';
  whyLearn: string;
  sourceIds: StudentGuideSourceIds;
}

export interface CareerEntranceExam {
  id: string;
  name: string;
  requirement: 'required' | 'onePossibleRoute' | 'optional' | 'notApplicable';
  appliesToRouteIds: string[];
  officialUrl: string;
  sourceIds: StudentGuideSourceIds;
}

export interface LearnerActivity {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sourceIds: StudentGuideSourceIds;
}

export type CareerAdditionalTopicBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'resourceLinks'; resourceIds: string[] };

export interface CareerAdditionalTopic {
  id: string;
  chapter: DreamCareerStudentGuideChapter;
  title: string;
  summary: string;
  blocks: CareerAdditionalTopicBlock[];
  sourceIds: StudentGuideSourceIds;
}

export interface CareerProfileSource {
  id: string;
  label: string;
  organization: string;
  url: string;
  reviewStatus: 'pending' | 'reviewed' | 'rejected';
  lastVerifiedAt?: string;
  staleAfter?: string;
}

export interface DreamCareerStudentGuideV1 {
  schemaVersion: 1;
  careerId: string;
  locale: DreamCareerGuideLocale;
  aboutCareer: {
    whatYouDo: string;
    activities: CareerActivity[];
    dayInLife: CareerDayMoment[];
    whyItMatters: string;
    earnings: EarningsScenario[];
    notablePeople: NotablePerson[];
    relatedCareerIds: string[];
  };
  howToGetThere: {
    subjects: CareerSubjectGuidance[];
    educationRoutes: EducationRoute[];
    firstJobBridge: FirstJobStep[];
    careerProgression: CareerProgressionStage[];
    employerLinkIds: string[];
    opportunityQuery: { careerId: string };
  };
  whatYouCanDoNow: {
    learningResourceIds: string[];
    skills: CareerSkillGuidance[];
    tools: CareerToolGuidance[];
    entranceExams: CareerEntranceExam[];
    starterActivity: LearnerActivity | null;
  };
  additionalTopics: CareerAdditionalTopic[];
  sources: CareerProfileSource[];
  provenance: {
    sourceVersion: string;
    sourceIds: StudentGuideSourceIds;
    authoredAt?: string;
    authoredBy?: string;
  };
}

type DeepPartial<T> = T extends Array<infer Item>
  ? Array<DeepPartial<Item>>
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

export type DreamCareerStudentGuideTranslationPatchV1 = DeepPartial<Omit<DreamCareerStudentGuideV1, 'locale'>> & {
  locale: Exclude<DreamCareerGuideLocale, 'en'>;
};

const TRANSLATABLE_STUDENT_GUIDE_PATHS = new Set([
  '$.aboutCareer.whatYouDo',
  '$.aboutCareer.activities[*].title',
  '$.aboutCareer.activities[*].description',
  '$.aboutCareer.dayInLife[*].timeLabel',
  '$.aboutCareer.dayInLife[*].title',
  '$.aboutCareer.dayInLife[*].description',
  '$.aboutCareer.whyItMatters',
  '$.aboutCareer.earnings[*].geography',
  '$.aboutCareer.notablePeople[*].whyRelevant',
  '$.howToGetThere.subjects[*].guidance',
  '$.howToGetThere.educationRoutes[*].title',
  '$.howToGetThere.educationRoutes[*].description',
  '$.howToGetThere.firstJobBridge[*].title',
  '$.howToGetThere.firstJobBridge[*].description',
  '$.howToGetThere.careerProgression[*].title',
  '$.howToGetThere.careerProgression[*].description',
  '$.whatYouCanDoNow.skills[*].howUsed',
  '$.whatYouCanDoNow.tools[*].whyLearn',
  '$.whatYouCanDoNow.starterActivity.title',
  '$.whatYouCanDoNow.starterActivity.description',
  '$.additionalTopics[*].title',
  '$.additionalTopics[*].summary',
  '$.additionalTopics[*].blocks[*].text',
  '$.additionalTopics[*].blocks[*].items[*]',
  '$.sources[*].label',
]);

export function resolveDreamCareerStudentGuideTranslation(
  canonical: DreamCareerStudentGuideV1,
  translation: DreamCareerStudentGuideTranslationPatchV1,
): DreamCareerStudentGuideV1 {
  return {
    ...mergeTranslationPatch(canonical, translation, '$') as DreamCareerStudentGuideV1,
    locale: translation.locale,
  };
}

function mergeTranslationPatch(canonical: unknown, translation: unknown, path: string): unknown {
  if (translation === undefined) return canonical;
  const normalizedPath = path.replace(/\[\d+\]/g, '[*]');
  if (TRANSLATABLE_STUDENT_GUIDE_PATHS.has(normalizedPath)
    && typeof canonical === 'string'
    && typeof translation === 'string') {
    return translation.trim() === '' ? canonical : translation;
  }
  if (Array.isArray(canonical) && Array.isArray(translation)) {
    return canonical.map((value, index) => mergeTranslationPatch(value, translation[index], `${path}[${index}]`));
  }
  if (isObject(canonical) && isObject(translation)) {
    return Object.fromEntries(Object.entries(canonical).map(([key, value]) => [
      key,
      mergeTranslationPatch(value, translation[key], `${path}.${key}`),
    ]));
  }
  return translation;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type CareerGuideQuestionId =
  | 'whatYouDo'
  | 'dayInLife'
  | 'whyItMatters'
  | 'earnings'
  | 'notablePeople'
  | 'relatedCareers'
  | 'subjects'
  | 'educationRoutes'
  | 'coursesAndColleges'
  | 'firstJobBridge'
  | 'careerProgression'
  | 'employers'
  | 'opportunities'
  | 'learningResources'
  | 'skills'
  | 'tools'
  | 'entranceExams'
  | 'starterActivity';

export interface CareerGuideCoverageItem {
  questionId: CareerGuideQuestionId;
  chapter: DreamCareerStudentGuideChapter;
  status: 'available' | 'partial' | 'missing' | 'stale';
  itemCount: number;
  staleAfter?: string;
  reason?: string;
  evidence: { paths: string[]; sourceIds: StudentGuideSourceIds };
}

export interface CareerIdentityView {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  primaryFutureDirectionId: string | null;
  futureDirectionIds: string[];
}

export interface CareerCourseOptionView {
  id: string;
  courseConceptId: string;
  courseTitle: string;
  institution: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    website?: string;
  };
  match: 'direct' | 'adjacent';
  releaseId: string;
}

export interface CareerCourseOptionsView {
  status: 'available' | 'mapping_unavailable';
  items: CareerCourseOptionView[];
}

export interface CareerEmployerView {
  id: string;
  name: string;
  geography: string;
  verifiedAt: string;
  website?: string;
  evidenceSourceIds: string[];
}

export interface CareerOpportunityView {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  kind: 'internship' | 'apprenticeship' | 'placement';
  opensAt: string | null;
  closesAt: string | null;
}

export interface CareerLearningResourceView {
  id: string;
  title: string;
  providerName: string;
  url: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'paid' | 'varies';
}

export interface CareerGuideLabelView {
  id: string;
  label: string;
}

export type CareerGuideRelationshipSubsection =
  | 'relatedCareers'
  | 'courseOptions'
  | 'employers'
  | 'opportunities'
  | 'learningResources';

export interface CareerGuideRelationshipError {
  subsection: CareerGuideRelationshipSubsection;
  code: 'temporarily_unavailable';
  retryable: true;
}

export interface DreamCareerStudentGuideResponse {
  career: CareerIdentityView;
  guide: DreamCareerStudentGuideV1;
  resolved: {
    labels: {
      subjects: CareerGuideLabelView[];
      skills: CareerGuideLabelView[];
      occupationalTools: CareerGuideLabelView[];
    };
    relatedCareers: CareerIdentityView[];
    courseOptions: CareerCourseOptionsView;
    employers: CareerEmployerView[];
    opportunities: CareerOpportunityView[];
    learningResources: CareerLearningResourceView[];
  };
  coverage: {
    items: CareerGuideCoverageItem[];
    byQuestion: Record<CareerGuideQuestionId, CareerGuideCoverageItem>;
  };
  relationshipErrors: CareerGuideRelationshipError[];
}

export interface CareerStudentContextResponse {
  careerId: string;
  saved: boolean;
  assessmentReasons: Array<{ signalId: string; label: string; evidence: string }>;
  grade?: 'grade8' | 'grade9' | 'grade10' | 'grade11' | 'grade12';
  location: { city?: string; state?: string; country?: string };
}

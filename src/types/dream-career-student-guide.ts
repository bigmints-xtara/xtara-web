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
  gradeIds: Array<'grade8' | 'grade9' | 'grade10'>;
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
    courseOptions: CareerCourseOptionView[];
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
  grade?: 'grade8' | 'grade9' | 'grade10';
  location: { city?: string; state?: string; country?: string };
}


export const DREAM_CAREER_DETAIL_PROFILE_SCHEMA_VERSION = 3 as const;

export type StableId = string;
export type SourceIds = StableId[];

export interface NumericRange {
  min: number;
  max: number;
}

export interface MoneyRange extends NumericRange {
  currency: 'INR';
}

export interface SourcedItem {
  sourceIds: SourceIds;
}

export interface DreamCareerWorkActivity extends SourcedItem {
  id: StableId;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'periodic' | 'varies';
}

export interface DreamCareerWorkSetting extends SourcedItem {
  id: StableId;
  environment: string;
  workModes: Array<'on_site' | 'hybrid' | 'remote' | 'field_based' | 'varies'>;
  schedule: 'standard_hours' | 'shifts' | 'flexible' | 'project_based' | 'seasonal' | 'varies';
  travel: 'none' | 'occasional' | 'frequent' | 'varies';
  description: string;
}

export interface DreamCareerWork {
  summary: string;
  whyItMatters: string;
  activities: DreamCareerWorkActivity[];
  settings: DreamCareerWorkSetting[];
}

export interface DreamCareerExam extends SourcedItem {
  name: string;
  requirement: 'required' | 'conditional' | 'one_possible_route' | 'optional' | 'not_applicable';
  authority: string;
  officialUrl: string;
  appliesTo: string;
  verifiedAt: string;
}

export interface DreamCareerStreamOption extends SourcedItem {
  stream: 'science' | 'commerce' | 'humanities' | 'vocational' | 'any_stream' | 'not_verified' | 'not_applicable';
  relevance: 'required' | 'accepted' | 'helpful' | 'not_required' | 'varies';
  subjects: string[];
  notes: string;
}

export interface DreamCareerEducationStage extends SourcedItem {
  id: StableId;
  order: number;
  stageType: 'grade_10' | 'higher_secondary' | 'diploma' | 'certificate' | 'undergraduate' | 'postgraduate' | 'doctoral' | 'professional_training' | 'apprenticeship' | 'licence' | 'entry_preparation';
  title: string;
  description: string;
  requirement: 'required' | 'commonly_expected' | 'one_possible_route' | 'optional' | 'varies';
  streamOptions: DreamCareerStreamOption[];
  qualificationExamples: string[];
  typicalDurationMonths?: NumericRange;
}

export interface DreamCareerSelectionBenchmark extends SourcedItem {
  id: StableId;
  year: number;
  category: string;
  geography: string;
  measure: 'rank' | 'percentile' | 'score';
  range: NumericRange;
  outcome: string;
}

export interface DreamCareerAdmissionExam extends SourcedItem {
  id: StableId;
  name: string;
  requirement: 'required' | 'conditional' | 'one_possible_route' | 'optional' | 'not_applicable';
  authority: string;
  officialUrl: string;
  appliesToStageIds: StableId[];
  scoreType: 'rank' | 'percentile' | 'score' | 'qualifying_status' | 'portfolio_or_interview' | 'varies';
  scoreUse: 'eligibility' | 'institution_access' | 'seat_category' | 'scholarship' | 'selection' | 'multiple' | 'varies';
  benchmarks: DreamCareerSelectionBenchmark[];
  verifiedAt: string;
}

export interface DreamCareerEducationPathway extends SourcedItem {
  id: StableId;
  title: string;
  routeType: 'school_to_degree' | 'school_to_diploma' | 'school_to_vocational' | 'postgraduate_specialization' | 'apprenticeship' | 'competitive_exam' | 'portfolio' | 'licence' | 'mixed' | 'other';
  description: string;
  timeline: DreamCareerEducationStage[];
  entranceExams: DreamCareerAdmissionExam[];
}

export interface DreamCareerSkill extends SourcedItem {
  id: StableId;
  name: string;
  category: 'technical' | 'human' | 'digital' | 'domain' | 'business' | 'creative' | 'physical';
  importance: 'core' | 'important' | 'useful';
  howUsed: string;
}

export interface DreamCareerTimelineStage extends SourcedItem {
  id: StableId;
  order: number;
  level: 'intern' | 'trainee' | 'junior' | 'associate' | 'mid_level' | 'senior' | 'lead' | 'manager' | 'senior_manager' | 'director' | 'executive' | 'independent' | 'varies';
  track: 'individual_contributor' | 'management' | 'leadership' | 'research' | 'independent' | 'mixed' | 'varies';
  commonTitles: string[];
  typicalExperienceYears?: NumericRange;
  responsibilities: string;
  progressionSignals: string[];
}

export interface DreamCareerTimeline {
  model: 'illustrative' | 'common' | 'regulated';
  summary: string;
  stages: DreamCareerTimelineStage[];
}

export interface DreamCareerAdmissionRoute {
  basis: 'entrance_exam' | 'qualifying_marks' | 'merit_and_counselling' | 'management_quota' | 'direct_admission' | 'scholarship' | 'mixed' | 'not_applicable' | 'varies';
  entranceExamIds: StableId[];
  selectionBenchmarkIds: StableId[];
  seatCategory: 'all_india_quota' | 'state_quota' | 'government_merit' | 'private_merit' | 'management' | 'nri' | 'scholarship' | 'open' | 'not_applicable' | 'varies';
  scoreEffects: Array<'eligibility' | 'institution_access' | 'seat_allocation' | 'seat_category' | 'scholarship' | 'fee_waiver' | 'none_on_published_fee' | 'varies'>;
  publishedFeeChangesWithScore: boolean;
  description: string;
}

export interface DreamCareerEducationCost extends SourcedItem {
  id: StableId;
  educationPathwayId: StableId;
  educationStageId: StableId;
  institutionName: string;
  programName: string;
  campus?: string | null;
  institutionType: 'government' | 'central_government' | 'state_government' | 'government_aided' | 'private' | 'deemed_university' | 'online' | 'training_provider' | 'mixed' | 'varies';
  feeCategory: 'published_regular' | 'published_scholarship' | 'published_subsidized' | 'published_variable' | 'estimated_program_cost' | 'other';
  admissionRoute: DreamCareerAdmissionRoute;
  geography: string;
  amount: MoneyRange;
  feePeriod: 'total_program' | 'year' | 'semester' | 'course' | 'exam' | 'varies';
  durationMonths: NumericRange | null;
  durationEvidence?: 'program_duration' | 'fee_coverage_period' | 'not_published';
  basis: 'tuition_only' | 'tuition_and_required_fees' | 'estimated_program_cost' | 'training_and_exam_fees';
  asOf: string;
  includes: string[];
  excludes: string[];
}

export interface DreamCareerEarningsScenario extends SourcedItem {
  id: StableId;
  careerStage: 'intern' | 'trainee' | 'junior' | 'associate' | 'mid_level' | 'senior' | 'lead' | 'manager' | 'director' | 'executive' | 'independent' | 'all_levels' | 'varies';
  employmentType: 'salaried' | 'self_employed' | 'contract' | 'mixed' | 'varies';
  geography: string;
  amount: MoneyRange;
  period: 'year';
  basis: 'gross_salary' | 'gross_compensation' | 'reported_income' | 'advertised_range';
  asOf: string;
  evidenceNotes?: string[];
}

export interface DreamCareerReturnScenario extends SourcedItem {
  id: StableId;
  educationCostId: StableId;
  earningsScenarioId: StableId;
  method: 'simple_gross_payback';
  paybackMonths: NumericRange;
  includesLivingCosts: boolean;
  includesForegoneEarnings: boolean;
  assumptions: string[];
}

export interface DreamCareerFinancials {
  educationCosts: DreamCareerEducationCost[];
  earnings: DreamCareerEarningsScenario[];
  returnOnEducation: DreamCareerReturnScenario[];
}

export interface DreamCareerOutlookMetric {
  name: string;
  value: number;
  unit: 'percent' | 'jobs' | 'vacancies' | 'index' | 'other';
}

export interface DreamCareerOutlookClaim extends SourcedItem {
  geography: string;
  fromYear: number;
  toYear: number;
  trend: 'declining' | 'stable' | 'growing' | 'rapid_growth' | 'uncertain' | 'varies_by_sector';
  summary: string;
  metrics: DreamCareerOutlookMetric[];
}

export interface DreamCareerAuthority {
  name: string;
  officialUrl: string;
}

export interface DreamCareerLicence extends SourcedItem {
  name: string;
  requirement: 'required' | 'conditional' | 'optional' | 'varies';
  authority: string;
  officialUrl: string;
  verifiedAt: string;
}

export interface DreamCareerRequirements {
  regulation: {
    status: 'regulated' | 'education_regulated' | 'requirements_vary' | 'not_role_regulated' | 'not_verified';
    jurisdiction: string;
    authorities: DreamCareerAuthority[];
    notes: string;
    sourceIds: SourceIds;
  };
  governmentExams: DreamCareerExam[];
  licences: DreamCareerLicence[];
}

export interface DreamCareerSpecialization extends SourcedItem {
  id: StableId;
  title: string;
  description: string;
}

export interface DreamCareerTradeoff extends SourcedItem {
  id: StableId;
  category: 'study_commitment' | 'education_cost' | 'competition' | 'schedule' | 'location' | 'travel' | 'physical_demands' | 'emotional_demands' | 'income_variability' | 'regulation' | 'technology_change' | 'other';
  impact: 'low' | 'medium' | 'high' | 'varies';
  description: string;
}

export interface DreamCareerPerson extends SourcedItem {
  id: StableId;
  name: string;
  relationship: 'same_role' | 'field_leader' | 'researcher' | 'founder' | 'public_service_leader' | 'adjacent_role';
  knownFor: string;
  whyRelevant: string;
  country: string;
  profileUrl: string;
}

export interface DreamCareerLearnerActivity {
  title: string;
  purpose: string;
  durationMinutes: number;
  cost: 'free' | 'low_cost';
  materials: string[];
  steps: string[];
  reflectionQuestions: string[];
  safetyNotes: string[];
}

export interface DreamCareerProfileSource {
  id: StableId;
  sourceType: 'government' | 'regulator' | 'professional_body' | 'official_statistics' | 'education_provider' | 'official_profile' | 'research' | 'industry_report' | 'job_market_data' | 'secondary_reference';
  title: string;
  organization: string;
  url: string;
  geography: string;
  publishedAt: string | null;
  verifiedAt: string;
  contentHash: string;
}

export interface DreamCareerDetailProfileV3 {
  schemaVersion: typeof DREAM_CAREER_DETAIL_PROFILE_SCHEMA_VERSION;
  careerId: StableId;
  locale: 'en';
  work: DreamCareerWork;
  educationPathways: DreamCareerEducationPathway[];
  skills: DreamCareerSkill[];
  careerTimeline: DreamCareerTimeline;
  financials: DreamCareerFinancials;
  outlook: DreamCareerOutlookClaim[];
  requirements: DreamCareerRequirements;
  specializations: DreamCareerSpecialization[];
  tradeoffs: DreamCareerTradeoff[];
  notablePeople: DreamCareerPerson[];
  tryThis: DreamCareerLearnerActivity;
  relatedCareerIds: StableId[];
  courseQueries: string[];
  sources: DreamCareerProfileSource[];
  provenance: {
    authorship: {
      method: 'agent_research' | 'human_research';
      authorType: 'codex_subagent' | 'human_editor';
      curatorId: string;
      batchId: StableId;
      authoredAt: string;
    };
    processing?: {
      tool: 'xtara-factory';
      actions: Array<'validate' | 'normalize' | 'checksum' | 'package'>;
      toolVersion: string;
    };
  };
}

export type DreamCareerDetailTranslationLocale = 'ml' | 'hi' | 'ta';

export type DreamCareerDetailProfileTranslationV3 = Omit<DreamCareerDetailProfileV3, 'locale'> & {
  locale: DreamCareerDetailTranslationLocale;
};

export type DreamCareerDetailProfileTranslations = Partial<Record<
  DreamCareerDetailTranslationLocale,
  DreamCareerDetailProfileTranslationV3
>>;

export const DETAIL_PROFILE_REVIEW_STATUSES = ['pending', 'inReview', 'changesRequested', 'approved'] as const;
export type DetailProfileReviewStatus = (typeof DETAIL_PROFILE_REVIEW_STATUSES)[number];
export type DetailProfileSourceReviewStatus = 'pending' | 'approved' | 'rejected';

export interface DreamCareerDetailProfileSourceReview {
  sourceId: StableId;
  status: DetailProfileSourceReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface DreamCareerDetailProfileReview {
  status: DetailProfileReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  sourceReviews: DreamCareerDetailProfileSourceReview[];
}

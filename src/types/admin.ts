import type { CareerPathwayStep, RelatedCareer } from '@/types/career';

export interface AdminEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentTagFields {
  futureDirectionIds: string[];
  dreamCareerIds: string[];
  skillIds: string[];
  gradeStages: string[];
  topics: string[];
}

export interface Story extends AdminEntity, ContentTagFields {
  title: string;
  description: string;
  image: string;
  career_clusters: string[];
  published: boolean;
  draft: boolean;
  inReview: boolean;
  featured: boolean;
  ad: boolean;
  byXtara: boolean;
  publishedAt?: Date;
  publishedUntil?: Date;
  callToAction?: string;
  hyperlink?: string;
  hyperlinkText?: string;
  careerRelevance: string[];
  slides: StorySlide[];
}

export interface Spark extends AdminEntity, ContentTagFields {
  title: string;
  type: string;
  published: boolean;
  draft: boolean;
  inReview: boolean;
  careerClusters?: string[];
  careerRelevance?: string[];
}

export interface GameInstance extends AdminEntity, ContentTagFields {
  title: string;
  mode: 'quiz' | 'puzzle' | 'memory';
  isPublished: boolean;
  schedule: {
    startDateTime: Date;
    endDateTime: Date;
  };
}

export interface GoodRead extends AdminEntity, ContentTagFields {
  title: string;
  image: string;
  domain: string;
  published: boolean;
  draft: boolean;
  inReview: boolean;
  hyperlink?: string;
  hyperlinkText?: string;
  careerRelevance: string[];
  type: string;
  content: string;
  publishedAt?: Date;
  publishedUntil?: Date;
}

export interface ChallengeQuestion {
  title: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Challenge extends AdminEntity, ContentTagFields {
  title: string;
  image: string;
  domain: string;
  published: boolean;
  draft: boolean;
  inReview: boolean;
  hyperlink?: string;
  hyperlinkText?: string;
  callToAction?: string;
  careerRelevance: string[];
  type: string;
  rewardPerQuestion: number;
  instructions: string;
  questions: ChallengeQuestion[];
  publishedAt?: Date;
  publishedUntil?: Date;
}

export interface StorySlide {
  title: string;
  description: string;
  image?: string;
  hyperlink?: string;
  hyperlinkText?: string;
  date?: string;
}

export type EntityStatus = 'published' | 'draft' | 'inReview' | 'all' | 'created' | 'updated' | 'archived';

export interface AdminCareerPath extends AdminEntity {
  userId: string;
  careerName: string;
  title?: string;
  whatYouDo?: string;
  whyItMatters?: string;
  matchScore?: number;
  streamSuggestions?: string[];
  expectedSalaryRange?: string;
  matchReasoning?: string;
  archetypes?: string[];
  careerPathway?: CareerPathwayStep[];
  relatedCareers?: RelatedCareer[];
  strengths?: string[];
  description?: string;
  internshipExamples?: unknown[];
  onlineTrainings?: unknown[];
  topInstitutions?: unknown[];
  toolsAndSoftware?: unknown[];
}

export interface AdminConfig<T extends AdminEntity> {
  entityName: string;
  entityNamePlural: string;
  collectionName: string;
  supportsApproval?: boolean;
  hideNewButton?: boolean;
  orderByField?: string | null;
  orderByDirection?: 'asc' | 'desc';
  
  // Entity operations
  createEmpty: () => Partial<T>;
  getId: (entity: T) => string;
  getTitle: (entity: T) => string;
  getStatus: (entity: T) => EntityStatus;
  getDomain: (entity: T) => string;
  getSubtitle: (entity: T) => string;
  getSearchText: (entity: T) => string;
  
  // Filtering
  availableStatuses: EntityStatus[];
  getAvailableDomains: (entities: T[]) => string[];
  
  // Validation
  validateEntity?: (entity: Partial<T>) => string | null;
  
  // Data conversion
  toFirestore: (entity: Partial<T>) => Record<string, unknown>;
  fromFirestore: (data: Record<string, unknown>, id: string) => T;
}

export interface FilterState {
  status: EntityStatus;
  domain: string;
  searchQuery: string;
}

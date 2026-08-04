export type CareerAreaId =
  | "technology"
  | "health"
  | "science"
  | "business"
  | "design"
  | "society";

export type CareerReviewStatus = "pilot" | "reviewed";

export interface CareerAreaContent {
  id: CareerAreaId;
  title: string;
  summary: string;
  prompt: string;
}

export interface CareerRoleContent {
  id: string;
  areaId: CareerAreaId;
  title: string;
  englishTitle: string;
  summary: string;
  dailyWork: string[];
  workSetting: string;
  pathway: string;
  tradeoffs: string[];
  specializations: string[];
  tryThis: string;
  salaryRange?: string;
  growthOutlook?: string;
  sourceIds: string[];
  reviewStatus: CareerReviewStatus;
  lastReviewed: string;
}

export interface CareerSource {
  id: string;
  label: string;
  organization: string;
  url: string;
}

export interface CareerKnowledgeCatalog {
  ui: Record<string, string>;
  areas: CareerAreaContent[];
  roles: CareerRoleContent[];
  sources: CareerSource[];
}

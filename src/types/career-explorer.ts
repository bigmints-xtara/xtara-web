import type { Locale } from "@/i18n/config";

// Mirrors CareerExplorerResponse in the API OpenAPI contract.
export interface ExplorerDirection {
  id: string;
  title: string;
  summary: string;
  careerIds: string[];
  industryIds: string[];
  translationFallback: boolean;
}
export interface ExplorerIndustry {
  id: string;
  title: string;
  description: string;
  directionIds: string[];
  careerIds: string[];
  translationFallback: boolean;
}
export interface ExplorerCareer {
  id: string;
  title: string;
  summary: string;
  directionIds: string[];
  industryIds: string[];
  activities: string[];
  subjects: string[];
  studyRoutes: Array<{
    id: string;
    title: string;
    description: string;
    sourceIds: string[];
  }>;
  relatedCareerIds: string[];
  parentCareerId?: string;
  specializationIds?: string[];
  sources: Array<{ id: string; label: string; url: string }>;
  translationFallback: boolean;
}
export interface CareerExplorerResponse {
  schemaVersion: 1;
  locale: Locale;
  catalogSource: "database" | "local_refined_preview";
  directions: ExplorerDirection[];
  industries: ExplorerIndustry[];
  careers: ExplorerCareer[];
}

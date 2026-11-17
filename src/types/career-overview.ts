import type { ExplorerIllustration } from './career-explorer';

export interface CareerOverviewIdentity {
  id: string;
  title: string;
  overview: string;
  illustration?: ExplorerIllustration;
}
export interface CareerStudyItem {
  id: string;
  kind: 'subject' | 'education_stage';
  title?: string;
  description: string;
  gradeIds: string[];
  stageType?: string;
  pathwayId?: string;
  pathwayTitle?: string;
  requirement: string;
  sourceIds: string[];
}
export interface CareerOverview extends CareerOverviewIdentity {
  schemaVersion: 1;
  locale: string;
  translationFallback: boolean;
  directionIds: string[];
  careerGroup?: CareerOverviewIdentity & { specializations: CareerOverviewIdentity[] };
  whatYouDo: { summary: string; activities: string[] };
  jobRoles: { id: string; stage: string; label: string; description: string; jobTitles: string[]; sourceIds: string[] }[];
  skills: string[];
  workplaces: string[];
  earnings: { status: 'unavailable'; reason: 'reviewed_evidence_required' } | {
    status: 'available'; description: string; geography: string; experience: string;
    population: string; asOf: string; measure: string; sourceIds: string[];
  };
  studyPaths: { grades8To10: CareerStudyItem[]; afterGrade10: CareerStudyItem[]; afterGrade12: CareerStudyItem[] };
  sources: { id: string; label: string; url: string }[];
  studyOptions: 'public_pilot' | 'unavailable';
}

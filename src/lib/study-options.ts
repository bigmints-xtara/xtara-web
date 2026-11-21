import { xtaraApi } from "@/lib/api/client";
import { xtaraApiOperationPath } from "@/lib/api/generated/xtara-api-operations";

export function isStudyOptionsCareer(careerId: string): boolean {
  return careerId === "software-developer" || careerId === "ux-designer";
}

const studyPath = (careerId: string) => `/explore/roles/${encodeURIComponent(careerId)}/study-options`;

export function studyOptionsHref(careerId: string, returnTo: string) {
  const destination = /^\/dream-careers\/[\w-]+\?from=dashboard$/.test(returnTo) ? returnTo + '#career-study' : returnTo;
  return `${studyPath(careerId)}?${new URLSearchParams({ returnTo: destination })}`;
}

export function studyOptionsCareerReturn(careerId: string, returnTo: string | null) {
  const path = returnTo?.split(/[?#]/, 1)[0];
  if (returnTo && path && (path === "/explore" || /^\/(?:dream-careers|explore\/roles)\/[\w-]+$/.test(path))) {
    return returnTo;
  }
  return `/explore?${new URLSearchParams({ career: careerId, step: "work" })}`;
}

export function studyOptionsReturn(returnTo: string | null): string | null {
  const path = returnTo?.split(/[?#]/, 1)[0];
  if (!path) return null;
  return /^\/explore\/roles\/[\w-]+\/study-options$/.test(path) || /^\/dream-careers\/[\w-]+$/.test(path) ? returnTo : null;
}

export function studyOfferingAnchor(offeringId: string) {
  return `study-offering-${offeringId}`;
}

export interface StudyOffering {
  offeringId: string;
  institutionId: string;
  institutionName: string;
  title: string;
  city?: string;
  state?: string;
  match: "direct" | "adjacent";
}

export interface CareerStudyPreview {
  status: "available" | "no_reviewed_mapping" | "no_results" | "temporarily_unavailable";
  browse: boolean;
  offerings: StudyOffering[];
}

export function savedCareerHref(id: string) {
  return `/dream-careers/${encodeURIComponent(id)}?from=dashboard`;
}

export function collegeOfferingHref(offering: StudyOffering, returnTo: string) {
  const params = new URLSearchParams({ offeringId: offering.offeringId, returnTo });
  return `/colleges/${encodeURIComponent(offering.institutionId)}?${params}`;
}

export interface StudyProgramme {
  courseConceptId: string;
  title: string;
  qualificationCode?: string;
  level?: string;
  offerings: StudyOffering[];
}

export interface StudyOptionsResponse {
  careerId: string;
  releaseId: string;
  state: string | null;
  status: "available" | "no_reviewed_mapping" | "no_results";
  programmes: StudyProgramme[];
  nextCursor: string | null;
}

export function getStudyOptions(
  careerId: string,
  options: { state: string | null; cursor: string | null; signal?: AbortSignal },
) {
  const params = new URLSearchParams();
  if (options.state) params.set("state", options.state);
  if (options.cursor) params.set("cursor", options.cursor);
  const query = params.size ? `?${params}` : "";
  const path = xtaraApiOperationPath("getStudyOptionsCareerId", { careerId });
  return xtaraApi.get<StudyOptionsResponse>(
    `${path}${query}`,
    { signal: options.signal },
  );
}

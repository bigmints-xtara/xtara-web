import type { DiscoveryResult } from "@/lib/assessment-v2";

const fallbackCourseQueries: Record<string, string[]> = {
  technology: ["Computer Science", "Bachelor of Computer Applications"],
  health: ["Bachelor of Medicine", "Allied Health Sciences"],
  science: ["Bachelor of Science", "Data Science"],
  business: ["Bachelor of Business Administration", "Bachelor of Commerce"],
  design: ["Bachelor of Design", "Mass Communication"],
  society: ["Bachelor of Education", "Social Work"],
};

export function getDirectionCourseQueries(result: DiscoveryResult, areaId: string): string[] {
  const curated = result.catalogSnapshot?.directions.find((direction) => direction.id === areaId)?.courseQueries;
  return curated?.length ? curated : fallbackCourseQueries[areaId] || [];
}

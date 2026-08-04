import type { DiscoveryResult } from "@/lib/assessment-v2";
import type { DirectionPlan } from "@/lib/direction";

export function getRecommendedArea(result: DiscoveryResult | null, areaId: string) {
  return result?.areas.find((area) => area.id === areaId) ?? null;
}

export function canAccessPursuedArea(
  result: DiscoveryResult | null,
  plan: DirectionPlan | null,
  areaId: string,
): boolean {
  return Boolean(getRecommendedArea(result, areaId) && plan?.areaId === areaId);
}

export function canAccessPursuedRole(
  result: DiscoveryResult | null,
  plan: DirectionPlan | null,
  areaId: string,
  roleId: string,
): boolean {
  const area = getRecommendedArea(result, areaId);
  return Boolean(area && plan?.areaId === areaId && area.roleIds.includes(roleId));
}

export function isDirectionPlanCompatible(result: DiscoveryResult, plan: DirectionPlan): boolean {
  const area = getRecommendedArea(result, plan.areaId);
  return Boolean(area && plan.dreamCareerIds.every((id) => area.roleIds.includes(id)));
}

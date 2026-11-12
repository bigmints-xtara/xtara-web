import { xtaraApi } from "@/lib/api/client";
import type { Locale } from "@/i18n/config";
import type { DirectionPlan } from "@/lib/direction";

export type DirectionCareerPreview = { id: string; title: string; summary: string };
export type DirectionOverview = DirectionCareerPreview & {
  reasons: string[];
  guidance: string[];
  reflectionPrompt: string;
  careers: DirectionCareerPreview[];
};
type DirectionResponse = { direction: DirectionPlan | null; overview?: DirectionOverview | null };

export function getDirectionOverview(locale: Locale, expectedUserId: string): Promise<DirectionResponse> {
  return xtaraApi.get<DirectionResponse>(`/me/direction?locale=${locale}`, { expectedUserId });
}

export async function getDirectionFromApi(expectedUserId?: string): Promise<DirectionPlan | null> {
  const response = await (expectedUserId ? xtaraApi.get<DirectionResponse>("/me/direction", { expectedUserId }) : xtaraApi.get<DirectionResponse>("/me/direction"));
  return response.direction;
}

export async function saveDirectionToApi(plan: DirectionPlan, expectedUserId?: string): Promise<DirectionPlan> {
  const response = await (expectedUserId ? xtaraApi.put<DirectionResponse>("/me/direction", plan, { expectedUserId }) : xtaraApi.put<DirectionResponse>("/me/direction", plan));
  if (!response.direction) throw new Error("The direction API returned no saved direction");
  const saved = await getDirectionFromApi(expectedUserId);
  if (!saved || saved.areaId !== plan.areaId
    || saved.dreamCareerIds.join("\0") !== plan.dreamCareerIds.join("\0")
    || (["learn", "try", "discuss"] as const).some((action) => saved.actions[action] !== plan.actions[action])) {
    throw new Error("Your Career Direction was not returned by account readback.");
  }
  return saved;
}


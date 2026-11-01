import { xtaraApi } from "@/lib/api/client";
import type { DirectionPlan } from "@/lib/direction";

type DirectionResponse = { direction: DirectionPlan | null };

export async function getDirectionFromApi(): Promise<DirectionPlan | null> {
  const response = await xtaraApi.get<DirectionResponse>("/me/direction");
  return response.direction;
}

export async function saveDirectionToApi(plan: DirectionPlan): Promise<DirectionPlan> {
  const response = await xtaraApi.put<DirectionResponse>("/me/direction", plan);
  if (!response.direction) throw new Error("The direction API returned no saved direction");
  const saved = await getDirectionFromApi();
  if (!saved || saved.areaId !== plan.areaId
    || saved.dreamCareerIds.join("\0") !== plan.dreamCareerIds.join("\0")
    || (["learn", "try", "discuss"] as const).some((action) => saved.actions[action] !== plan.actions[action])) {
    throw new Error("Your Career Direction was not returned by account readback.");
  }
  return saved;
}


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
  return response.direction;
}


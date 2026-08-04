import { xtaraApi } from "@/lib/api/client";

import type { DirectionActionId } from "@/lib/direction";

export type ExperienceContentGroupId = "lessons" | "games" | "challenges" | "stories" | "reads";

export type ExperienceProgressGoal = {
  id: DirectionActionId;
  title: string;
  completed: boolean;
  recommended: boolean;
};

export type ExperienceRecommendation = {
  id: string;
  goalId: DirectionActionId;
  kind: ExperienceContentGroupId | "discussion";
  title: string;
  reason: string;
  reasonCode: string;
  action:
    | { type: "open_content"; contentGroupId: ExperienceContentGroupId; contentId: string }
    | { type: "confirm_discussion" };
  policyVersion: "next-best-v1";
};

export type MyCareerPathExperience = {
  version: string;
  surface: "my-career-path";
  progress: {
    completed: number;
    total: number;
    goals: ExperienceProgressGoal[];
  };
  nextBest: ExperienceRecommendation | null;
  alternatives: ExperienceRecommendation[];
  contentLibraries: Array<{
    id: ExperienceContentGroupId;
    title: string;
    description: string;
    items: Array<Record<string, unknown> & { id: string; title: string }>;
  }>;
  contentGroups: Array<{
    id: ExperienceContentGroupId;
    title: string;
    description: string;
    items: Array<Record<string, unknown> & { id: string; title: string }>;
  }>;
};

export function getMyCareerPathExperience(locale: string, limit = 8): Promise<MyCareerPathExperience> {
  const query = new URLSearchParams({
    surface: "my-career-path",
    locale,
    limit: String(limit),
  });
  return xtaraApi.get<MyCareerPathExperience>(`/me/experience?${query.toString()}`);
}

export async function recordRecommendationEvent(
  type: "impression" | "start" | "dismiss",
  recommendationId: string,
): Promise<void> {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replaceAll("-", "")
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await xtaraApi.post("/me/experience/events", {
    eventId: `web_${random}`,
    type,
    recommendationId,
  });
}

export function recommendationHref(recommendation: ExperienceRecommendation): string | null {
  if (recommendation.action.type !== "open_content") return null;
  const { contentGroupId, contentId } = recommendation.action;
  if (contentGroupId === "lessons") return `/dashboard/sparks/${contentId}`;
  if (contentGroupId === "reads") return `/dashboard/good-reads/${contentId}`;
  if (contentGroupId === "challenges") return "/dashboard/challenges";
  return "/learn";
}

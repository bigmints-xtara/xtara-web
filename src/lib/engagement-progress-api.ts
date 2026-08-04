import { xtaraApi } from "@/lib/api/client";

export type EngagementProgressRecord = Record<string, unknown>;

export interface EngagementProgress {
  stories: EngagementProgressRecord[];
  goodReads: EngagementProgressRecord[];
  challenges: EngagementProgressRecord[];
  sparks: EngagementProgressRecord[];
  games: EngagementProgressRecord[];
  events: EngagementProgressRecord[];
}

export interface ChallengeSubmissionInput {
  answers: number[];
  score: number;
  isPractice: boolean;
}

const emptyProgress: EngagementProgress = {
  stories: [],
  goodReads: [],
  challenges: [],
  sparks: [],
  games: [],
  events: [],
};

export async function getEngagementProgress(): Promise<EngagementProgress> {
  const progress = await xtaraApi.get<Partial<EngagementProgress>>("/me/engagement-progress");
  return {
    ...emptyProgress,
    ...progress,
    stories: progress.stories ?? [],
    goodReads: progress.goodReads ?? [],
    challenges: progress.challenges ?? [],
    sparks: progress.sparks ?? [],
    games: progress.games ?? [],
    events: progress.events ?? [],
  };
}

export async function markStoryWatched(storyId: string): Promise<EngagementProgressRecord> {
  await xtaraApi.post(`/stories/${encodeURIComponent(storyId)}/watched`);
  return requireReadback("stories", "storyId", storyId, (record) => record.watched === true);
}

export async function markGoodReadCompleted(
  goodReadId: string,
  options: { hasOpenedLink?: boolean } = {},
): Promise<EngagementProgressRecord> {
  await xtaraApi.post(`/good-reads/${encodeURIComponent(goodReadId)}/read`, options);
  return requireReadback(
    "goodReads",
    "goodReadId",
    goodReadId,
    (record) => record.completed === true || record.read === true,
  );
}

export async function markSparkCompleted(sparkId: string): Promise<EngagementProgressRecord> {
  await xtaraApi.post(`/sparks/${encodeURIComponent(sparkId)}/complete`);
  return requireReadback("sparks", "sparkId", sparkId, (record) => record.completed === true);
}

export async function submitChallenge(
  challengeId: string,
  input: ChallengeSubmissionInput,
): Promise<EngagementProgressRecord> {
  await xtaraApi.post(`/challenges/${encodeURIComponent(challengeId)}/submit`, input);
  return requireReadback("challenges", "challengeId", challengeId);
}

export async function hasChallengeSubmission(challengeId: string): Promise<boolean> {
  const progress = await getEngagementProgress();
  return progress.challenges.some((record) => record.challengeId === challengeId);
}

async function requireReadback(
  group: keyof EngagementProgress,
  identityKey: string,
  identityValue: string,
  verify: (record: EngagementProgressRecord) => boolean = () => true,
): Promise<EngagementProgressRecord> {
  const progress = await getEngagementProgress();
  const record = progress[group].find(
    (candidate) => candidate[identityKey] === identityValue && verify(candidate),
  );

  if (!record) {
    throw new Error(`Saved ${group} progress was not returned by account readback.`);
  }

  return record;
}

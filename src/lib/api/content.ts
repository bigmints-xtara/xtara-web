import { xtaraApi } from '@/lib/api/client';
import {
  hasChallengeSubmission,
  markGoodReadCompleted,
  markSparkCompleted,
  markStoryWatched,
  submitChallenge,
  type ChallengeSubmissionInput,
} from '@/lib/engagement-progress-api';

export interface StorySlide {
  title: string;
  description: string;
  image?: string;
  hyperlink?: string;
  hyperlinkText?: string;
  date?: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  publishedAt?: Date | string;
  publishedUntil?: Date | string;
  career_clusters: string[];
  slides: StorySlide[];
}

export interface GoodRead {
  id: string;
  title: string;
  type?: string;
  image?: string;
  publishedAt?: Date | string;
  publishUntil?: Date | string;
  summary?: string;
  hyperlink?: string;
  content?: string;
  career_clusters?: string[];
  skill_ids?: string[];
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface Challenge {
  id: string;
  title: string;
  image?: string;
  publishedAt?: Date | string;
  publishUntil?: Date | string;
  content?: string;
  points?: number;
  questions?: ChallengeQuestion[];
  career_clusters?: string[];
  skill_ids?: string[];
}

export interface GameInstance {
  id: string;
  title: string;
  mode: string;
  isPublished?: boolean;
  schedule?: {
    startDateTime?: Date | string;
    endDateTime?: Date | string;
  };
  career_clusters?: string[];
  skill_ids?: string[];
  [key: string]: unknown;
}

export interface SparkSlide {
  type: string;
  title?: string;
  content: string;
  image?: string;
}

export interface SparkKnowledgeCheck {
  question: string;
  options: string[];
  correctOptionIndex?: number;
  correct_answer?: string;
  explanation?: string;
}

export interface Spark {
  id: string;
  title: string;
  type?: string;
  image?: string;
  rewardPerQuestion?: number;
  medalPoints?: number;
  slides?: SparkSlide[];
  lessons?: Array<{ knowledge_check?: SparkKnowledgeCheck[] }>;
  knowledgeChecks?: SparkKnowledgeCheck[];
  career_clusters?: string[];
  skill_ids?: string[];
  [key: string]: unknown;
}

type ListResponse<T> = { items?: T[] } | T[];

function itemsFrom<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items || [];
}

export const ContentService = {
  async getStoriesForHome(limitCount = 5): Promise<Story[]> {
    const response = await xtaraApi.get<ListResponse<Story>>(`/stories?limit=${limitCount}`);
    return itemsFrom(response);
  },

  async getStoryById(id: string): Promise<Story | null> {
    return xtaraApi.get<Story>(`/stories/${id}`).catch(() => null);
  },

  async getGoodReadsForHome(limitCount = 5): Promise<GoodRead[]> {
    const response = await xtaraApi.get<ListResponse<GoodRead>>(`/good-reads?limit=${limitCount}`);
    return itemsFrom(response);
  },

  async getGoodReadById(id: string): Promise<GoodRead | null> {
    return xtaraApi.get<GoodRead>(`/good-reads/${id}`).catch(() => null);
  },

  async getChallengesForHome(limitCount = 5): Promise<Challenge[]> {
    const response = await xtaraApi.get<ListResponse<Challenge>>(`/challenges?limit=${limitCount}`);
    return itemsFrom(response);
  },

  async getChallengeById(id: string): Promise<Challenge | null> {
    return xtaraApi.get<Challenge>(`/challenges/${id}`).catch(() => null);
  },

  async getSparksForHome(limitCount = 5): Promise<Spark[]> {
    const response = await xtaraApi.get<ListResponse<Spark>>(`/sparks?limit=${limitCount}`);
    return itemsFrom(response);
  },

  async getSparkById(id: string): Promise<Spark | null> {
    return xtaraApi.get<Spark>(`/sparks/${id}`).catch(() => null);
  },

  async getPlayableGames(limitCount = 5): Promise<GameInstance[]> {
    const response = await xtaraApi.get<ListResponse<GameInstance>>(`/games?limit=${limitCount}`);
    return itemsFrom(response);
  },

  async markStoryWatched(_userId: string, storyId: string): Promise<void> {
    await markStoryWatched(storyId);
  },

  async markGoodReadCompleted(goodReadId: string): Promise<void> {
    await markGoodReadCompleted(goodReadId);
  },

  async markGoodReadLinkOpened(goodReadId: string): Promise<void> {
    await markGoodReadCompleted(goodReadId, { hasOpenedLink: true });
  },

  async markSparkCompleted(sparkId: string): Promise<void> {
    await markSparkCompleted(sparkId);
  },

  async submitChallenge(challengeId: string, input: ChallengeSubmissionInput): Promise<void> {
    await submitChallenge(challengeId, input);
  },

  async hasChallengeSubmission(challengeId: string): Promise<boolean> {
    return hasChallengeSubmission(challengeId);
  },
};

export default ContentService;

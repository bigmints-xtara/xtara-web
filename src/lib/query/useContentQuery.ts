import { useApiQuery } from './useApiQuery';
import { ContentService, Story, GoodRead, Challenge, Spark, GameInstance } from '@/lib/api/content';

const TWELVE_HOURS = 43200000;

export function useStoriesQuery(limitCount = 5) {
  return useApiQuery<Story[]>(
    ['stories', limitCount],
    async () => {
      return ContentService.getStoriesForHome(limitCount);
    },
    { staleTime: TWELVE_HOURS }
  );
}

export function useGoodReadsQuery(limitCount = 5) {
  return useApiQuery<GoodRead[]>(
    ['good-reads', limitCount],
    async () => {
      return ContentService.getGoodReadsForHome(limitCount);
    },
    { staleTime: TWELVE_HOURS }
  );
}

export function useChallengesQuery(limitCount = 5) {
  return useApiQuery<Challenge[]>(
    ['challenges', limitCount],
    async () => {
      return ContentService.getChallengesForHome(limitCount);
    },
    { staleTime: TWELVE_HOURS }
  );
}

export function useSparksQuery(limitCount = 5) {
  return useApiQuery<Spark[]>(
    ['sparks', limitCount],
    async () => {
      return ContentService.getSparksForHome(limitCount);
    },
    { staleTime: TWELVE_HOURS }
  );
}

export function useGamesQuery(limitCount = 5) {
  return useApiQuery<GameInstance[]>(
    ['games', limitCount],
    async () => {
      return ContentService.getPlayableGames(limitCount);
    },
    { staleTime: TWELVE_HOURS }
  );
}

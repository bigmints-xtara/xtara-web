import { xtaraApi } from '@/lib/api/client';

export interface TierData {
  name: string;
  currentTierId: string;
  nextTier: string | null;
}

export interface WeeklyGoalData {
  goodReads: { current: number; target: number };
  challenges: { current: number; target: number };
  sparks: { current: number; target: number };
}

export interface AchievementStats {
  games: number;
  sparks: number;
  challenges: number;
  goodReads: number;
}

export interface PointsByCategory {
  games: number;
  sparks: number;
  challenges: number;
  goodReads: number;
  streaks: number;
}

export interface MedalData {
  total: number;
  common: number;
  rare: number;
  epic: number;
}

type PointRecord = {
  id?: string;
  category?: string;
  source?: string;
  totalPoints?: number;
  points?: number;
  createdAt?: string | { seconds?: number; _seconds?: number };
  timestamp?: string | { seconds?: number; _seconds?: number };
};

export interface PointHistoryRecord {
  id: string;
  category: string;
  reason: string;
  points: number;
  createdAt: string | null;
}

export class AchievementsService {
  private rewardsRequest?: Promise<{
    points?: number;
    tier?: string;
    pointsToNextTier?: number;
    nextTierPoints?: number;
    medals?: MedalData | Array<{ rarity?: string }>;
    weeklyProgress?: {
      readsCompleted?: number;
      challengesCompleted?: number;
      sparksCompleted?: number;
      requirements?: { minReads?: number; minChallenges?: number; minSparks?: number };
    };
  }>;
  private ledgerRequest?: Promise<PointRecord[]>;

  private async rewards() {
    this.rewardsRequest ??= xtaraApi.get('/me/rewards');
    return this.rewardsRequest;
  }

  private async ledger(): Promise<PointRecord[]> {
    this.ledgerRequest ??= xtaraApi
      .get<{ items?: PointRecord[] }>('/me/points-ledger')
      .then((response) => response.items || [])
      .catch(() => []);
    return this.ledgerRequest;
  }

  async getTierData(_userId: string): Promise<TierData | null> {
    void _userId;
    const rewards = await this.rewards();
    const tier = rewards.tier || 'starter';
    return {
      name: tier,
      currentTierId: tier,
      nextTier: tier === 'gold' ? null : 'gold',
    };
  }

  async getTotalPoints(_userId: string): Promise<number> {
    void _userId;
    const rewards = await this.rewards();
    return Number(rewards.points || 0);
  }

  async getWeeklyGoal(_userId: string): Promise<WeeklyGoalData> {
    void _userId;
    const summary = await this.rewards();
    const weekly = summary.weeklyProgress;
    if (weekly) {
      return {
        goodReads: { current: Number(weekly.readsCompleted || 0), target: Number(weekly.requirements?.minReads || 1) },
        challenges: { current: Number(weekly.challengesCompleted || 0), target: Number(weekly.requirements?.minChallenges || 1) },
        sparks: { current: Number(weekly.sparksCompleted || 0), target: Number(weekly.requirements?.minSparks || 2) },
      };
    }
    const ledger = (await this.ledger()).filter((item) => isThisWeek(item.createdAt || item.timestamp));
    const stats = countActivities(ledger);
    return {
      goodReads: { current: stats.goodReads, target: 1 },
      challenges: { current: stats.challenges, target: 1 },
      sparks: { current: stats.sparks, target: 2 },
    };
  }

  async getAchievementStats(_userId: string): Promise<AchievementStats> {
    void _userId;
    const ledger = await this.ledger();
    return countActivities(ledger);
  }

  async getPointsByCategory(_userId: string): Promise<PointsByCategory> {
    void _userId;
    const ledger = await this.ledger();
    return ledger.reduce(
      (totals, item) => {
        const points = Number(item.totalPoints || item.points || 0);
        if (item.category === 'games') totals.games += points;
        if (item.category === 'sparks') totals.sparks += points;
        if (item.category === 'challenges') totals.challenges += points;
        if (item.category === 'goodReads') totals.goodReads += points;
        if (item.category === 'streaks') totals.streaks += points;
        return totals;
      },
      { games: 0, sparks: 0, challenges: 0, goodReads: 0, streaks: 0 }
    );
  }

  async getPointsHistory(_userId: string): Promise<PointHistoryRecord[]> {
    void _userId;
    const ledger = await this.ledger();
    return ledger.map((item, index) => ({
      id: item.id || `point-${index}`,
      category: item.category || 'learning',
      reason: item.source || categoryLabel(item.category),
      points: Number(item.totalPoints || item.points || 0),
      createdAt: timestampValue(item.createdAt || item.timestamp),
    }));
  }

  async getMedalData(_userId: string): Promise<MedalData> {
    void _userId;
    const rewards = await this.rewards();
    if (Array.isArray(rewards.medals)) {
      return rewards.medals.reduce(
        (summary, medal) => {
          summary.total += 1;
          if (medal.rarity === 'rare') summary.rare += 1;
          else if (medal.rarity === 'epic') summary.epic += 1;
          else summary.common += 1;
          return summary;
        },
        { total: 0, common: 0, rare: 0, epic: 0 }
      );
    }
    return rewards.medals || { total: 0, common: 0, rare: 0, epic: 0 };
  }

  async addPointsForGoodRead(_userId: string, goodReadId: string): Promise<boolean> {
    const result = await xtaraApi.post<{ awarded: boolean }>('/rewards/award', {
      category: 'goodReads',
      source: 'Good Read',
      sourceId: goodReadId,
      basePoints: 5,
    });
    return result.awarded;
  }

  async addPointsForChallenge(_userId: string, challengeId: string, quizScore: number, isPractice: boolean): Promise<boolean> {
    const result = await xtaraApi.post<{ awarded: boolean }>('/rewards/award', {
      category: 'challenges',
      source: 'Reading Challenge',
      sourceId: challengeId,
      basePoints: isPractice ? 0 : 10,
      bonusPoints: isPractice ? 0 : quizScore,
    });
    return result.awarded;
  }

  async addPointsForSpark(
    _userId: string,
    sparkId: string,
    score: number,
    isPerfect: boolean,
    medalPoints: number,
    sparkTitle: string
  ): Promise<boolean> {
    const result = await xtaraApi.post<{ awarded: boolean }>('/rewards/award', {
      category: 'sparks',
      source: sparkTitle || 'Spark',
      sourceId: sparkId,
      basePoints: score,
      bonusPoints: isPerfect ? medalPoints : 0,
    });
    return result.awarded;
  }
}

function countActivities(ledger: PointRecord[]): AchievementStats {
  return ledger.reduce(
    (stats, item) => {
      if (item.category === 'games') stats.games += 1;
      if (item.category === 'sparks') stats.sparks += 1;
      if (item.category === 'challenges') stats.challenges += 1;
      if (item.category === 'goodReads') stats.goodReads += 1;
      return stats;
    },
    { games: 0, sparks: 0, challenges: 0, goodReads: 0 },
  );
}

function isThisWeek(value?: string | { seconds?: number; _seconds?: number }): boolean {
  const timestamp = timestampValue(value);
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

function categoryLabel(category?: string) {
  if (category === 'goodReads') return 'Good Read';
  if (category === 'sparks') return 'Spark';
  if (category === 'challenges') return 'Reading Challenge';
  if (category === 'games') return 'Learning Game';
  if (category === 'streaks') return 'Learning streak';
  return 'Learning activity';
}

function timestampValue(value?: string | { seconds?: number; _seconds?: number }): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const seconds = value.seconds ?? value._seconds;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}

export default AchievementsService;

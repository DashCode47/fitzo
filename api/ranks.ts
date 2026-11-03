import { supabase } from '@/lib/supabase';
import {
  type Gender,
  type LiftKey,
  type RankTier,
  LIFTS,
  RANK_TIERS,
  REPRESENTATIVE_EXERCISES,
  STREAK_DAYS_FOR_BONUS,
  getThresholds,
  tierIndexFromRankIndex,
} from '@/constants/ranks';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiftRank {
  lift: LiftKey;
  tierIndex: number;
  maxWeight: number;
  progress: number; // 0-1 toward next tier (1 at max tier)
  kgToNext: number | null; // null at max tier
}

export interface UserRanks {
  tier: RankTier;
  tierIndex: number;
  rankIndex: number; // avg lift level (with progress) + streak bonus; leaderboard sorts by this
  progress: number; // 0-1 toward next general tier
  streakBonus: number; // 0-1
  lifts: LiftRank[];
}

interface MaxWeightRow {
  exercise_name: string;
  muscle_group: string;
  max_weight: number;
}

// ─── Pure Calculation ────────────────────────────────────────────────────────

export function calculateLiftRank(
  maxWeight: number,
  bodyWeight: number,
  lift: LiftKey,
  gender: Gender,
): LiftRank {
  const thresholds = getThresholds(gender)[lift];
  const ratio = bodyWeight > 0 ? maxWeight / bodyWeight : 0;

  let tierIndex = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) {
      tierIndex = i;
      break;
    }
  }

  if (tierIndex === thresholds.length - 1) {
    return { lift, tierIndex, maxWeight, progress: 1, kgToNext: null };
  }

  const cur = thresholds[tierIndex];
  const next = thresholds[tierIndex + 1];
  return {
    lift,
    tierIndex,
    maxWeight,
    progress: Math.min((ratio - cur) / (next - cur), 1),
    kgToNext: Math.max(0, Math.ceil(next * bodyWeight - maxWeight)),
  };
}

export function calculateAllRanks(
  maxWeights: MaxWeightRow[],
  bodyWeight: number,
  gender: Gender,
  streak: number = 0,
): UserRanks {
  const lifts = LIFTS.map(({ key }) => {
    const row = maxWeights.find(
      (r: any) => (r.name || r.exercise_name) === REPRESENTATIVE_EXERCISES[key],
    );
    return calculateLiftRank(row?.max_weight ?? 0, bodyWeight, key, gender);
  });

  // Max tier lifts count as tierIndex only (progress there is a "full" marker).
  const liftAvg =
    lifts.reduce((s, l) => s + l.tierIndex + (l.kgToNext === null ? 0 : l.progress), 0) /
    lifts.length;
  const streakBonus = Math.min(Math.max(streak, 0) / STREAK_DAYS_FOR_BONUS, 1);
  const rankIndex = liftAvg + streakBonus;
  const tierIndex = tierIndexFromRankIndex(rankIndex);
  const isMax = tierIndex === RANK_TIERS.length - 1;

  return {
    tier: RANK_TIERS[tierIndex].name,
    tierIndex,
    rankIndex,
    progress: isMax ? 1 : rankIndex - tierIndex,
    streakBonus,
    lifts,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const RanksAPI = {
  getUserMaxWeights: async (userId: string): Promise<MaxWeightRow[]> => {
    const { data, error } = await supabase.rpc('get_user_max_weights', {
      p_user_id: userId,
    });
    if (error) {
      console.error('[RanksAPI] getUserMaxWeights failed:', error);
      throw error;
    }
    return (data as MaxWeightRow[]) || [];
  },

  syncRankToProfile: async (userId: string, ranks: UserRanks) => {
    const { error } = await supabase
      .from('profiles')
      .update({ rank_index: ranks.rankIndex, rank_tier: ranks.tier })
      .eq('id', userId);
    if (error) console.error('[RanksAPI] syncRankToProfile failed:', error);
  },

  // Recomputes the rank and writes it to profiles.rank_index/rank_tier (what the
  // leaderboard sorts by). Every caller must pass the streak, otherwise the
  // bonus silently flips on and off depending on which screen synced last.
  syncUserRank: async (
    userId: string,
    bodyWeight: number,
    gender: Gender,
    streak: number,
  ): Promise<UserRanks | null> => {
    if (!bodyWeight) return null;
    try {
      const maxWeights = await RanksAPI.getUserMaxWeights(userId);
      const ranks = calculateAllRanks(maxWeights, bodyWeight, gender, streak);
      await RanksAPI.syncRankToProfile(userId, ranks);
      return ranks;
    } catch (e) {
      console.error('[RanksAPI] syncUserRank failed:', e);
      return null;
    }
  },
};

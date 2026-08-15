
import { supabase } from '@/lib/supabase';
import {
  type Gender,
  type MuscleGroupKey,
  type RankTier,
  MUSCLE_GROUPS,
  RANK_TIERS,
  REPRESENTATIVE_EXERCISES,
  getThresholds,
} from '@/constants/ranks';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MuscleRank {
  muscleGroup: MuscleGroupKey;
  tier: RankTier;
  tierIndex: number;
  ratio: number;
  nextTierRatio: number | null;
  progress: number; // 0-1 toward next tier
  maxWeight: number;
  representativeExercise: string;
}

export interface UserRanks {
  generalTier: RankTier;
  generalTierIndex: number;
  avgIndex: number; // Raw average of muscle tiers + streak bonus
  performanceAvg: number; // Average without streak bonus
  streakBonus: number;
  muscleRanks: MuscleRank[];
}

interface MaxWeightRow {
  exercise_name: string;
  muscle_group: string;
  max_weight: number;
}

// ─── Pure Calculation Functions ──────────────────────────────────────────────

export function calculateMuscleRank(
  maxWeight: number,
  bodyWeight: number,
  muscleGroup: MuscleGroupKey,
  gender: Gender,
): MuscleRank {
  const thresholds = getThresholds(gender)[muscleGroup];
  const isCore = muscleGroup === 'core';

  // Core uses absolute seconds; others use weight/bodyweight ratio
  const ratio = isCore ? maxWeight : bodyWeight > 0 ? maxWeight / bodyWeight : 0;

  // Find highest tier the user qualifies for
  let tierIndex = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) {
      tierIndex = i;
      break;
    }
  }

  // Progress toward next tier
  const isMaxTier = tierIndex === thresholds.length - 1;
  const nextTierRatio = isMaxTier ? null : thresholds[tierIndex + 1];
  let progress = 0;
  if (!isMaxTier) {
    const currentThreshold = thresholds[tierIndex];
    const nextThreshold = thresholds[tierIndex + 1];
    const range = nextThreshold - currentThreshold;
    progress = range > 0 ? Math.min((ratio - currentThreshold) / range, 1) : 0;
  } else {
    progress = 1;
  }

  return {
    muscleGroup,
    tier: RANK_TIERS[tierIndex].name,
    tierIndex,
    ratio: Math.round(ratio * 100) / 100,
    nextTierRatio,
    progress: Math.round(progress * 100) / 100,
    maxWeight,
    representativeExercise: REPRESENTATIVE_EXERCISES[muscleGroup],
  };
}

export function calculateAllRanks(
  maxWeights: MaxWeightRow[],
  bodyWeight: number,
  gender: Gender,
  streak: number = 0,
): UserRanks {
  const muscleRanks: MuscleRank[] = MUSCLE_GROUPS.map(({ key }) => {
    const repExercise = REPRESENTATIVE_EXERCISES[key];
    const row = maxWeights.find(
      (r: any) => (r.name || r.exercise_name) === repExercise,
    );
    const maxWeight = row?.max_weight ?? 0;
    return calculateMuscleRank(maxWeight, bodyWeight, key, gender);
  });

  // 1. Performance average (0-5)
  const performanceAvg =
    muscleRanks.reduce((sum, r) => sum + r.tierIndex, 0) / muscleRanks.length;

  // 2. Consistency Bonus: Every 30 training days in streak = +1.0 level (Max 1.0)
  const streakBonus = Math.min(streak / 30, 1.0);

  // 3. Final Score
  const avgIndex = performanceAvg + streakBonus;
  const generalTierIndex = Math.min(Math.round(avgIndex), RANK_TIERS.length - 1);

  return {
    generalTier: RANK_TIERS[generalTierIndex].name,
    generalTierIndex,
    avgIndex,
    performanceAvg,
    streakBonus,
    muscleRanks,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const RanksAPI = {
  getUserMaxWeights: async (userId: string): Promise<MaxWeightRow[]> => {
    try {
      const { data, error } = await supabase.rpc('get_user_max_weights', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data as MaxWeightRow[]) || [];
    } catch (e) {
      console.error('[RanksAPI] getUserMaxWeights failed:', e);
      throw e;
    }
  },

  syncRankToProfile: async (userId: string, rankIndex: number, rankTier: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ rank_index: rankIndex, rank_tier: rankTier })
        .eq('id', userId);
      if (error) throw error;
    } catch (e) {
      console.error('[RanksAPI] syncRankToProfile failed:', e);
    }
  },

  // Recomputes a user's rank and writes it to profiles.rank_index/rank_tier —
  // the same steps RanksView.fetchRanks runs when the user visits "Mis Rangos".
  // Without this, profiles.rank_index (what the leaderboard sorts and displays
  // by) only updates when that screen happens to be visited, so it can go
  // stale for anyone who trains without checking their ranks. Call this
  // wherever a workout is saved so the leaderboard reflects recent performance.
  syncUserRank: async (userId: string, bodyWeight: number, gender: Gender, streak = 0) => {
    if (!bodyWeight) return;
    try {
      const maxWeights = await RanksAPI.getUserMaxWeights(userId);
      const ranks = calculateAllRanks(maxWeights, bodyWeight, gender, streak);
      await RanksAPI.syncRankToProfile(userId, ranks.avgIndex, ranks.generalTier);
    } catch (e) {
      console.error('[RanksAPI] syncUserRank failed:', e);
    }
  },
};

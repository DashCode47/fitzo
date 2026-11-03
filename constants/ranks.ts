// ─── Rank System Constants ───────────────────────────────────────────────────
// Rank = average level of the 4 main lifts + streak bonus (30 days = +1 level).

export type RankTier = `Nivel ${number}`;
export type LiftKey = 'bench' | 'squat' | 'deadlift' | 'ohp';
export type Gender = 'M' | 'F';

// ─── Tiers ───────────────────────────────────────────────────────────────────

export interface RankTierInfo {
  name: RankTier;
  color: string;
}

export const RANK_TIERS: RankTierInfo[] = [
  // Distinct hues, cool → hot, gold at the top. No gray: gray reads as "empty".
  '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#A855F7', '#EC4899', '#EF4444', '#F97316', '#EAB308',
].map((color, i) => ({ color, name: `Nivel ${i + 1}` as RankTier }));

// Tier from a continuous rank index (what profiles.rank_index stores). Floors,
// so you only show a tier once you've fully reached it.
export const tierIndexFromRankIndex = (rankIndex: number): number =>
  Math.max(0, Math.min(Math.floor(rankIndex || 0), RANK_TIERS.length - 1));

export const tierFromRankIndex = (rankIndex: number): RankTierInfo =>
  RANK_TIERS[tierIndexFromRankIndex(rankIndex)];

// ─── Lifts ───────────────────────────────────────────────────────────────────

export interface LiftInfo {
  key: LiftKey;
  label: string;
  icon: string; // Ionicons name
}

export const LIFTS: LiftInfo[] = [
  { key: 'bench',    label: 'Press de Banca', icon: 'barbell-outline' },
  { key: 'squat',    label: 'Sentadilla',     icon: 'walk-outline' },
  { key: 'deadlift', label: 'Peso Muerto',    icon: 'body-outline' },
  { key: 'ohp',      label: 'Press Militar',  icon: 'arrow-up-outline' },
];

// Must match exactly the `name` column in the `exercises` table.
export const REPRESENTATIVE_EXERCISES: Record<LiftKey, string> = {
  bench:    'Press de Banca (Bench Press)',
  squat:    'Sentadilla (Squat)',
  deadlift: 'Peso Muerto (Deadlift)',
  ohp:      'Press de Hombro (Shoulder Press)',
};

// ─── Thresholds ──────────────────────────────────────────────────────────────
// Minimum (max_weight / body_weight) ratio for each of the 10 levels.
// Level 2 is an easy first step; after that steps are even (~12kg on bench at 80kg BW).

type ThresholdTable = Record<LiftKey, number[]>;

export const THRESHOLDS_MALE: ThresholdTable = {
  bench:    [0, 0.25, 0.41, 0.56, 0.72, 0.88, 1.03, 1.19, 1.34, 1.50],
  squat:    [0, 0.35, 0.56, 0.76, 0.97, 1.17, 1.38, 1.59, 1.79, 2.00],
  deadlift: [0, 0.30, 0.49, 0.68, 0.86, 1.05, 1.24, 1.43, 1.61, 1.80],
  ohp:      [0, 0.15, 0.26, 0.36, 0.47, 0.57, 0.68, 0.79, 0.89, 1.00],
};

export const THRESHOLDS_FEMALE: ThresholdTable = {
  bench:    [0, 0.15, 0.26, 0.36, 0.47, 0.57, 0.68, 0.79, 0.89, 1.00],
  squat:    [0, 0.25, 0.41, 0.56, 0.72, 0.88, 1.03, 1.19, 1.34, 1.50],
  deadlift: [0, 0.20, 0.32, 0.44, 0.56, 0.68, 0.79, 0.91, 1.03, 1.15],
  ohp:      [0, 0.10, 0.17, 0.25, 0.32, 0.40, 0.47, 0.55, 0.62, 0.70],
};

export const getThresholds = (gender: string): ThresholdTable => {
  const normalized = gender?.toUpperCase()?.charAt(0);
  return normalized === 'F' ? THRESHOLDS_FEMALE : THRESHOLDS_MALE;
};

export const STREAK_DAYS_FOR_BONUS = 30;

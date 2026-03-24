// ─── Rank System Constants ───────────────────────────────────────────────────

export type RankTier = 'Chulla' | 'Camellador' | 'Chagra' | 'Capo' | 'Máquina' | 'Atahualpa';
export type MuscleGroupKey = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'glutes' | 'forearms';
export type Gender = 'M' | 'F';

// ─── Tiers ───────────────────────────────────────────────────────────────────

export interface RankTierInfo {
  name: RankTier;
  color: string;
  icon: string; // Ionicons name
}

export const RANK_TIERS: RankTierInfo[] = [
  { name: 'Chulla',    color: '#8A8A9A', icon: 'fitness-outline' },
  { name: 'Camellador', color: '#34D399', icon: 'leaf-outline' },
  { name: 'Chagra',    color: '#60A5FA', icon: 'shield-outline' },
  { name: 'Capo',      color: '#A78BFA', icon: 'diamond-outline' },
  { name: 'Máquina',   color: '#FBBF24', icon: 'flash-outline' },
  { name: 'Atahualpa', color: '#F87171', icon: 'flame-outline' },
];

// ─── Muscle Groups ───────────────────────────────────────────────────────────

export interface MuscleGroupInfo {
  key: MuscleGroupKey;
  label: string;
  icon: string; // Ionicons name
}

export const MUSCLE_GROUPS: MuscleGroupInfo[] = [
  { key: 'chest',     label: 'Pecho',     icon: 'body-outline' },
  { key: 'back',      label: 'Espalda',   icon: 'arrow-back-outline' },
  { key: 'legs',      label: 'Piernas',   icon: 'walk-outline' },
  { key: 'shoulders', label: 'Hombros',   icon: 'man-outline' },
  { key: 'arms',      label: 'Brazos',    icon: 'barbell-outline' },
  { key: 'core',      label: 'Core',      icon: 'radio-button-on-outline' },
  { key: 'glutes',    label: 'Glúteos',   icon: 'trending-up-outline' },
  { key: 'forearms',  label: 'Antebrazo', icon: 'hand-left-outline' },
];

// ─── Representative Exercises ────────────────────────────────────────────────
// Maps each muscle group to the exercise name used for rank calculation.
// These must match exactly the `name` column in the `exercises` table.

export const REPRESENTATIVE_EXERCISES: Record<MuscleGroupKey, string> = {
  chest:     'Press de Banca (Bench Press)',
  back:      'Peso Muerto (Deadlift)',
  legs:      'Sentadilla (Squat)',
  shoulders: 'Press de Hombro (Shoulder Press)',
  arms:      'Curl de Bíceps (Bicep Curl)',
  core:      'Plancha (Plank)',
  glutes:    'Hip Thrust',
  forearms:  'Curl de Muñeca (Wrist Curl)',
};

// ─── Rank Thresholds ─────────────────────────────────────────────────────────
// Each array has 6 values corresponding to the minimum ratio for each tier.
// ratio = max_weight_lifted / body_weight
// Core is special: uses seconds (from reps field), not weight ratio.

type ThresholdTable = Record<MuscleGroupKey, [number, number, number, number, number, number]>;

export const THRESHOLDS_MALE: ThresholdTable = {
  chest:     [0.00, 0.50, 0.75, 1.00, 1.25, 1.50],
  back:      [0.00, 0.60, 0.90, 1.20, 1.50, 1.80],
  legs:      [0.00, 0.70, 1.00, 1.30, 1.60, 2.00],
  shoulders: [0.00, 0.35, 0.50, 0.65, 0.80, 1.00],
  arms:      [0.00, 0.20, 0.30, 0.40, 0.50, 0.60],
  core:      [0, 30, 60, 90, 120, 180],
  glutes:    [0.00, 0.50, 0.75, 1.00, 1.25, 1.50],
  forearms:  [0.00, 0.15, 0.25, 0.35, 0.45, 0.55],
};

export const THRESHOLDS_FEMALE: ThresholdTable = {
  chest:     [0.00, 0.30, 0.50, 0.65, 0.80, 1.00],
  back:      [0.00, 0.35, 0.55, 0.75, 0.95, 1.15],
  legs:      [0.00, 0.50, 0.75, 1.00, 1.25, 1.50],
  shoulders: [0.00, 0.20, 0.35, 0.45, 0.55, 0.70],
  arms:      [0.00, 0.12, 0.20, 0.28, 0.35, 0.45],
  core:      [0, 30, 60, 90, 120, 180],
  glutes:    [0.00, 0.35, 0.55, 0.70, 0.85, 1.05],
  forearms:  [0.00, 0.10, 0.18, 0.25, 0.32, 0.40],
};

export const getThresholds = (gender: string): ThresholdTable => {
  const normalized = gender?.toUpperCase()?.charAt(0);
  return normalized === 'F' ? THRESHOLDS_FEMALE : THRESHOLDS_MALE;
};

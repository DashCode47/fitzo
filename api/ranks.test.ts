jest.mock('@/lib/supabase', () => ({ supabase: {} }));

import { calculateAllRanks } from './ranks';

const row = (exercise_name: string, max_weight: number) => ({ exercise_name, muscle_group: '', max_weight });

describe('calculateAllRanks', () => {
  it('is Nivel 1 with no lifts and tells how many kg are missing', () => {
    const r = calculateAllRanks([], 80, 'M', 0);
    expect(r.tier).toBe('Nivel 1');
    expect(r.lifts.find((l) => l.lift === 'bench')!.kgToNext).toBe(20); // 0.25 * 80
  });

  it('averages the 4 lifts and floors (no rounding up)', () => {
    // At 100kg BW: bench 5.8, squat 5.62, deadlift 5.79, ohp 4.3 -> avg 5.38
    const lifts = [
      row('Press de Banca (Bench Press)', 100),
      row('Sentadilla (Squat)', 130),
      row('Peso Muerto (Deadlift)', 120),
      row('Press de Hombro (Shoulder Press)', 50),
    ];
    const r = calculateAllRanks(lifts, 100, 'M', 0);
    expect(r.rankIndex).toBeCloseTo(5.38, 1);
    expect(r.tier).toBe('Nivel 6');

    // 30-day streak adds a full level
    const withStreak = calculateAllRanks(lifts, 100, 'M', 30);
    expect(withStreak.rankIndex).toBeCloseTo(6.38, 1);
    expect(withStreak.tier).toBe('Nivel 7');
    expect(calculateAllRanks(lifts, 100, 'M', 90).streakBonus).toBe(1);
  });

  it('caps at Nivel 10', () => {
    const lifts = ['Press de Banca (Bench Press)', 'Sentadilla (Squat)', 'Peso Muerto (Deadlift)', 'Press de Hombro (Shoulder Press)'].map((n) => row(n, 999));
    const r = calculateAllRanks(lifts, 80, 'M', 30);
    expect(r.tier).toBe('Nivel 10');
    expect(r.lifts.every((l) => l.kgToNext === null)).toBe(true);
  });
});

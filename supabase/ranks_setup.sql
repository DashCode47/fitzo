-- ─── Ranks System Setup ──────────────────────────────────────────────────────
-- 1. Add new muscle groups to exercises catalog
--
-- The get_user_max_weights RPC function that used to live in this file has
-- been REMOVED. The real, deployed definition lives in
-- user_personal_records.sql — it reads from the cached user_personal_records
-- table instead of computing MAX() live. Having two CREATE OR REPLACE
-- definitions of the same function in two files caused a multi-hour
-- debugging session in Aug 2026 when this file was re-run and silently
-- reverted production to the live-computing version, desyncing it from
-- api/workouts.ts's syncPersonalRecord (which writes to user_personal_records
-- expecting the RPC to read from it).
--
-- If you need to touch get_user_max_weights, edit it ONLY in
-- user_personal_records.sql.

-- ── Update exercise catalog ──────────────────────────────────────────────────

-- Reclassify Bulgarian Split Squat as glutes
UPDATE public.exercises
SET muscle_group = 'glutes'
WHERE name = 'Sentadilla Búlgara (Bulgarian Split Squat)';

-- Add Hip Thrust as primary glutes exercise
INSERT INTO public.exercises (name, muscle_group, equipment, description)
VALUES ('Hip Thrust', 'glutes', 'barbell', 'Ejercicio compuesto de glúteos')
ON CONFLICT DO NOTHING;

-- Add Wrist Curl as representative forearms exercise
INSERT INTO public.exercises (name, muscle_group, equipment, description)
VALUES ('Curl de Muñeca (Wrist Curl)', 'forearms', 'dumbbell', 'Aislamiento de antebrazo')
ON CONFLICT DO NOTHING;

-- ── Performance index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id
  ON public.workout_exercises(exercise_id);

-- ─── Ranks System Setup ──────────────────────────────────────────────────────
-- 1. Add new muscle groups to exercises catalog
-- 2. Create RPC function to get user max weights per exercise

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

-- ── RPC: Get user max weights per exercise ───────────────────────────────────
-- Returns the maximum weight lifted for each exercise by a given user.
-- Used client-side to compute muscle group ranks.

CREATE OR REPLACE FUNCTION public.get_user_max_weights(p_user_id UUID)
RETURNS TABLE(exercise_name TEXT, muscle_group TEXT, max_weight NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.name::TEXT       AS exercise_name,
    e.muscle_group::TEXT AS muscle_group,
    MAX((s->>'weight')::numeric) AS max_weight
  FROM workout_exercises we
  JOIN workout_logs wl ON wl.id = we.workout_log_id
  JOIN exercises e ON e.id = we.exercise_id
  CROSS JOIN LATERAL jsonb_array_elements(we.sets_completed) AS s
  WHERE wl.user_id = p_user_id
    AND (s->>'weight')::numeric > 0
  GROUP BY e.name, e.muscle_group;
$$;

-- ── Performance index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id
  ON public.workout_exercises(exercise_id);

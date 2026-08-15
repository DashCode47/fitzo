-- ─── user_personal_records: cached PR snapshot ──────────────────────────────
--
-- This table and function exist in production but were never captured in
-- version control until now (discovered Aug 2026 while debugging PRs in the
-- Stats screen that didn't update after editing a workout set).
--
-- WHY THIS TABLE EXISTS
-- get_user_max_weights (used by the "Peso Máximo por Ejercicio" list in
-- app/(tabs)/stats.tsx) does NOT compute MAX(weight) live from
-- workout_exercises, despite what ranks_setup.sql's version of the function
-- suggests. The version actually deployed to production reads from this
-- cached snapshot table instead. Nothing in Postgres keeps this table in
-- sync automatically — no trigger, no view.
--
-- WHO KEEPS IT IN SYNC
-- api/workouts.ts's `syncPersonalRecord` (private helper) recomputes the
-- real MAX(weight) for one exercise and upserts/deletes the row here. It is
-- called from:
--   - WorkoutsAPI.updateSet      — after a set is edited or deleted
--   - WorkoutsAPI.saveWorkoutSession — after a new session is saved
-- If a future write path touches workout_exercises.sets_completed without
-- going through one of those two functions (or without calling
-- syncPersonalRecord itself), the PR list will silently go stale again,
-- exactly like it did before this was fixed.
--
-- Run this file to (re)create the table and the REAL production function.
-- Do NOT run ranks_setup.sql's get_user_max_weights after this — see the
-- warning at the top of that file.

CREATE TABLE IF NOT EXISTS public.user_personal_records (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  max_weight NUMERIC,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, exercise_name)
);

ALTER TABLE public.user_personal_records ENABLE ROW LEVEL SECURITY;

-- get_user_max_weights has no SECURITY DEFINER, so it runs as the calling
-- user and needs this SELECT policy to read rows at all.
DROP POLICY IF EXISTS "Users see their own personal records" ON public.user_personal_records;
CREATE POLICY "Users see their own personal records" ON public.user_personal_records
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- sync_personal_record is SECURITY DEFINER, so its INSERT/UPDATE/DELETE
-- bypass RLS already — this policy exists only so direct client writes
-- (if any) stay scoped to the caller's own rows, same as the RPC's WHERE.
DROP POLICY IF EXISTS "Users manage their own personal records" ON public.user_personal_records;
CREATE POLICY "Users manage their own personal records" ON public.user_personal_records
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_user_max_weights(p_user_id uuid)
RETURNS TABLE(name text, muscle_group text, max_weight numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT pr.exercise_name as name, e.muscle_group, pr.max_weight
    FROM public.user_personal_records pr
    JOIN public.exercises e ON e.name = pr.exercise_name
    WHERE pr.user_id = p_user_id;
END;
$function$;

-- ── RPC: sync_personal_record ────────────────────────────────────────────────
-- Recomputes MAX(weight) for one user+exercise directly in SQL (instead of the
-- client fetching every historical set and reducing in JS — see
-- api/workouts.ts's syncPersonalRecord, which calls this RPC and then applies
-- the returned max_weight the same way it always upserted/deleted before).
-- Upserts the row if a max > 0 exists, deletes it otherwise (e.g. the user
-- removed their only weighted set for that exercise). Returns the resulting
-- max_weight, or NULL if the row was deleted.
CREATE OR REPLACE FUNCTION public.sync_personal_record(p_user_id UUID, p_exercise_id BIGINT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_exercise_name TEXT;
  v_max_weight NUMERIC;
BEGIN
  SELECT name INTO v_exercise_name FROM public.exercises WHERE id = p_exercise_id;
  IF v_exercise_name IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT MAX((s->>'weight')::numeric) INTO v_max_weight
  FROM public.workout_exercises we
  JOIN public.workout_logs wl ON wl.id = we.workout_log_id
  CROSS JOIN LATERAL jsonb_array_elements(we.sets_completed) AS s
  WHERE wl.user_id = p_user_id
    AND we.exercise_id = p_exercise_id
    AND (s->>'weight')::numeric > 0;

  IF v_max_weight IS NOT NULL AND v_max_weight > 0 THEN
    INSERT INTO public.user_personal_records (user_id, exercise_name, max_weight, updated_at)
    VALUES (p_user_id, v_exercise_name, v_max_weight, NOW())
    ON CONFLICT (user_id, exercise_name)
    DO UPDATE SET max_weight = EXCLUDED.max_weight, updated_at = EXCLUDED.updated_at;
  ELSE
    DELETE FROM public.user_personal_records
    WHERE user_id = p_user_id AND exercise_name = v_exercise_name;
  END IF;

  RETURN v_max_weight;
END;
$function$;

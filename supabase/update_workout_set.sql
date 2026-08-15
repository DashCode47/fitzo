-- ─── RPC: update_workout_set ─────────────────────────────────────────────────
--
-- Collapses what api/workouts.ts's WorkoutsAPI.updateSet used to do as 4
-- sequential client round-trips (select the row, update it, select every
-- exercise in the session to recompute total_volume, update the log) plus a
-- separate sync_personal_record RPC call, into one round-trip. All of the
-- reads/writes now happen server-side in a single transaction.
--
-- p_new_set = { weight, reps } to edit the set at p_set_index, or NULL to
-- delete that set (same contract the client used to express via `update`
-- being an object vs null).
--
-- RLS note: this function is SECURITY DEFINER so it can update workout_logs/
-- workout_exercises in one go, but it re-validates ownership itself (the
-- WHERE wl.user_id = p_user_id checks below) rather than relying on the
-- caller's row-level policies — the same trust boundary sync_personal_record
-- already uses.
CREATE OR REPLACE FUNCTION public.update_workout_set(
  p_user_id UUID,
  p_workout_exercise_id BIGINT,
  p_workout_log_id BIGINT,
  p_set_index INT,
  p_new_set JSONB -- {"weight": number, "reps": number} or NULL to delete
)
RETURNS TABLE(total_volume NUMERIC, max_weight NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_exercise_id BIGINT;
  v_sets JSONB;
  v_total_volume NUMERIC;
  v_max_weight NUMERIC;
BEGIN
  -- Ownership check: workout_exercises has no user_id of its own, it's reached
  -- through workout_logs — same join RLS policies use elsewhere in this app.
  SELECT we.exercise_id, we.sets_completed INTO v_exercise_id, v_sets
  FROM public.workout_exercises we
  JOIN public.workout_logs wl ON wl.id = we.workout_log_id
  WHERE we.id = p_workout_exercise_id
    AND we.workout_log_id = p_workout_log_id
    AND wl.user_id = p_user_id
  FOR UPDATE OF we;

  IF v_exercise_id IS NULL THEN
    RAISE EXCEPTION 'workout_exercises row % not found for user % / log %',
      p_workout_exercise_id, p_user_id, p_workout_log_id;
  END IF;

  IF p_new_set IS NOT NULL THEN
    -- Merge onto the existing element (not replace) so fields the client
    -- doesn't send, like "set" (the set number), survive the edit — matches
    -- the old client-side `{...sets[setIndex], weight, reps}` spread.
    v_sets := jsonb_set(
      v_sets,
      ARRAY[p_set_index::text],
      (v_sets->p_set_index) || p_new_set,
      false
    );
  ELSE
    v_sets := v_sets - p_set_index;
  END IF;

  UPDATE public.workout_exercises
  SET sets_completed = v_sets
  WHERE id = p_workout_exercise_id;

  -- Recompute total_volume from every exercise in the session (not just the
  -- one just edited) — mirrors the JS reduce() the client used to run itself.
  SELECT COALESCE(SUM((s->>'weight')::numeric * (s->>'reps')::numeric), 0)
  INTO v_total_volume
  FROM public.workout_exercises we2
  CROSS JOIN LATERAL jsonb_array_elements(we2.sets_completed) AS s
  WHERE we2.workout_log_id = p_workout_log_id;

  UPDATE public.workout_logs
  SET total_volume = v_total_volume
  WHERE id = p_workout_log_id AND user_id = p_user_id;

  v_max_weight := public.sync_personal_record(p_user_id, v_exercise_id);

  RETURN QUERY SELECT v_total_volume, v_max_weight;
END;
$function$;

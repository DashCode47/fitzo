-- Lets a signed-in user permanently delete their own account (App Store Guideline 5.1.1(v)).
-- Avatar files are removed by the client through the Storage API first:
-- storage.objects rows can't be deleted from SQL (protect_objects_delete trigger).

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Personal routines go away; gym templates the user authored stay, unowned.
  UPDATE public.workout_logs SET routine_id = NULL
    WHERE routine_id IN (SELECT id FROM public.routines WHERE created_by = uid AND NOT coalesce(is_template, false));
  DELETE FROM public.routines WHERE created_by = uid AND NOT coalesce(is_template, false);
  UPDATE public.routines      SET created_by = NULL WHERE created_by = uid;
  UPDATE public.diet_plans    SET created_by = NULL WHERE created_by = uid;
  UPDATE public.generated_qrs SET created_by = NULL WHERE created_by = uid;

  -- FKs without ON DELETE CASCADE, or no FK at all.
  DELETE FROM public.user_stats  WHERE user_id = uid;
  DELETE FROM public.user_diets  WHERE user_id = uid;
  DELETE FROM public.gym_visits  WHERE user_id = uid::text;
  DELETE FROM public.access_logs WHERE "userId" = uid::text;

  -- Cascades to profiles (-> leaderboard_entries, attendance_logs), workout_logs,
  -- user_routine_schedule, weight_logs, user_personal_records, gamification_logs.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- workout_logs_update_policies.sql
-- Allows users to correct their own past workout data (e.g. a mistyped set weight).
-- Without these, RLS silently drops UPDATE statements (0 rows affected, no error).

CREATE POLICY "Users update their own logs" ON public.workout_logs
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own workout exercise details" ON public.workout_exercises
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);

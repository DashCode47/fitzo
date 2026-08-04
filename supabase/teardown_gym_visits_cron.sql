-- =============================================
-- TEARDOWN: cron jobs + functions from gym_visits_setup.sql
-- Run in Supabase SQL Editor. Review before running DROP TABLE lines.
-- =============================================

-- 0. Check what's actually registered first (names/schedules may differ
--    from gym_visits_setup.sql if renamed or created another way)
SELECT jobid, jobname, schedule, active, command FROM cron.job;

-- 1. Unschedule cron jobs
-- Only 'nightly-gym-reset' (jobid 2) actually exists; 'close-expired-visits'
-- was never created (or already removed) — unscheduling it by name errors.
SELECT cron.unschedule('nightly-gym-reset');

-- 2. Drop the functions the crons called
DROP FUNCTION IF EXISTS close_expired_visits();
DROP FUNCTION IF EXISTS nightly_gym_reset();

-- 3. (Optional) Drop the tables themselves, if nothing else reads them.
--    Uncomment only after confirming gym_visits / gym_occupancy are unused.
-- DROP TABLE IF EXISTS gym_visits;
-- DROP TABLE IF EXISTS gym_occupancy;

-- Verify:
-- SELECT jobname FROM cron.job WHERE jobname IN ('close-expired-visits', 'nightly-gym-reset');  -- should return 0 rows

-- =============================================
-- GYM VISITS: tabla de visitas + cron jobs
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- 1. Crear tabla gym_visits
CREATE TABLE IF NOT EXISTS gym_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  geofence_id TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_exit_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '80 minutes'),
  exited_at TIMESTAMPTZ,
  exit_method TEXT, -- 'radar', 'auto_expire', 'nightly_reset'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para las queries del cron
CREATE INDEX IF NOT EXISTS idx_gym_visits_open
  ON gym_visits (geofence_id, exited_at)
  WHERE exited_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_visits_expected_exit
  ON gym_visits (expected_exit_at)
  WHERE exited_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gym_visits_user_open
  ON gym_visits (user_id, geofence_id, exited_at)
  WHERE exited_at IS NULL;

-- 2. Función: cerrar visitas expiradas (cron cada 5 min)
CREATE OR REPLACE FUNCTION close_expired_visits()
RETURNS void AS $$
DECLARE
  expired_count INTEGER;
  geo_id TEXT;
BEGIN
  -- Cerrar visitas donde expected_exit_at ya pasó
  UPDATE gym_visits
  SET exited_at = NOW(),
      exit_method = 'auto_expire'
  WHERE exited_at IS NULL
    AND expected_exit_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  IF expired_count > 0 THEN
    RAISE LOG '[gym_visits] Cerradas % visitas expiradas', expired_count;

    -- Recalcular el count de cada geofence basado en visitas abiertas
    FOR geo_id IN
      SELECT DISTINCT geofence_id FROM gym_occupancy
    LOOP
      UPDATE gym_occupancy
      SET current_count = (
        SELECT COUNT(*) FROM gym_visits
        WHERE geofence_id = geo_id AND exited_at IS NULL
      ),
      updated_at = NOW()
      WHERE geofence_id = geo_id;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Función: reset nocturno (9 PM hora del gym)
CREATE OR REPLACE FUNCTION nightly_gym_reset()
RETURNS void AS $$
BEGIN
  -- Cerrar todas las visitas abiertas
  UPDATE gym_visits
  SET exited_at = NOW(),
      exit_method = 'nightly_reset'
  WHERE exited_at IS NULL;

  -- Resetear todos los contadores a 0
  UPDATE gym_occupancy
  SET current_count = 0,
      updated_at = NOW();

  RAISE LOG '[gym_visits] Reset nocturno ejecutado';
END;
$$ LANGUAGE plpgsql;

-- 4. Habilitar pg_cron (si no está habilitado)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5. Cron cada hora en horario del gym: 7 AM - 9 PM CST (= 13:00 - 03:00 UTC)
SELECT cron.schedule(
  'close-expired-visits',
  '0 13-23,0-3 * * *',
  $$SELECT close_expired_visits()$$
);

-- 6. Cron nocturno: 9 PM CST = 3 AM UTC del día siguiente
SELECT cron.schedule(
  'nightly-gym-reset',
  '0 3 * * *',
  $$SELECT nightly_gym_reset()$$
);

-- =============================================
-- Para verificar que los crons se crearon:
-- SELECT * FROM cron.job;
--
-- Para ver ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- =============================================

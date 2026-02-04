-- setup_gym_occupancy.sql
-- Propietario: postgres

-- 1. Crear la tabla de ocupacion
CREATE TABLE IF NOT EXISTS public.gym_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_id TEXT UNIQUE NOT NULL,
    current_count INT DEFAULT 0,
    max_capacity INT DEFAULT 80,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar el dueno como postgres
ALTER TABLE public.gym_occupancy OWNER TO postgres;

-- 3. Habilitar RLS para lectura publica (usuarios autenticados)
ALTER TABLE public.gym_occupancy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de ocupacion" ON public.gym_occupancy;
CREATE POLICY "Lectura publica de ocupacion" ON public.gym_occupancy
    FOR SELECT TO authenticated USING (true);

-- 4. Insertar el registro de tu Geofence especifico
INSERT INTO public.gym_occupancy (geofence_id, current_count, max_capacity)
VALUES ('69726786d7349b0a1f4d1afc', 0, 80)
ON CONFLICT (geofence_id) DO UPDATE SET updated_at = NOW();

-- 5. Crear funcion RPC para actualizar el conteo de forma atomica
DROP FUNCTION IF EXISTS public.update_gym_occupancy(TEXT, INT);
CREATE OR REPLACE FUNCTION public.update_gym_occupancy(
    p_geofence_id TEXT,
    p_delta INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gym_occupancy
    SET
        current_count = GREATEST(0, current_count + p_delta),
        updated_at = NOW()
    WHERE geofence_id = p_geofence_id;

    -- Si no existe el registro, crearlo
    IF NOT FOUND THEN
        INSERT INTO public.gym_occupancy (geofence_id, current_count, max_capacity)
        VALUES (p_geofence_id, GREATEST(0, p_delta), 80);
    END IF;
END;
$$;

-- 6. Habilitar Supabase Realtime para la tabla
-- IMPORTANTE: Ejecutar esto en el SQL Editor de Supabase Dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_occupancy;

-- 7. Crear indice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_gym_occupancy_geofence_id
ON public.gym_occupancy(geofence_id);

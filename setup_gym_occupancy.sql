
-- setup_gym_occupancy.sql
-- Propietario: postgres

-- 1. Crear la tabla de ocupación
CREATE TABLE IF NOT EXISTS public.gym_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_id TEXT UNIQUE NOT NULL,
    current_count INT DEFAULT 0,
    max_capacity INT DEFAULT 80,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar el dueño como postgres
ALTER TABLE public.gym_occupancy OWNER TO postgres;

-- 3. Habilitar RLS para lectura pública (usuarios autenticados)
ALTER TABLE public.gym_occupancy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de ocupación" ON public.gym_occupancy;
CREATE POLICY "Lectura pública de ocupación" ON public.gym_occupancy
    FOR SELECT TO authenticated USING (true);

-- 4. Insertar el registro de tu Geofence específico
INSERT INTO public.gym_occupancy (geofence_id, current_count, max_capacity)
VALUES ('69726786d7349b0a1f4d1afc', 0, 80)
ON CONFLICT (geofence_id) DO UPDATE SET updated_at = NOW();

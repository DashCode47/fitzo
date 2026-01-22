
-- gamification_v6_fix.sql
-- Este script corrige el error de registro asegurando que ambas tablas (users y profiles) 
-- se actualicen correctamente y tengan las columnas necesarias.

-- 1. Asegurar que la tabla profiles tenga todas las columnas necesarias para gamificación
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENT';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Asegurar la restricción UNIQUE en email para el trigger ON CONFLICT (si no se aplicó antes)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- 3. Actualizar la función handle_new_user para que inserte en AMBAS tablas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_profile_id uuid := gen_random_uuid();
BEGIN
  -- A. Insertar en public.users (Requerido para la lógica actual de la app)
  -- Usamos los nombres de columna originales de setup_triggers_dashboard.sql
  INSERT INTO public.users (
    id,
    "supabaseId",
    email,
    "nationalId",
    phone,
    role,
    status,
    "updatedAt"
  )
  VALUES (
    new.id,
    new.id,
    new.email,
    new.raw_user_meta_data->>'national_id',
    new.raw_user_meta_data->>'phone',
    'CLIENT'::public."Role",          -- Enums originales
    'ACTIVE'::public."UserStatus",    -- Enums originales
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- B. Insertar en public.profiles (Estructura extendida para gamificación)
  INSERT INTO public.profiles (
    id,
    "userId",
    "firstName",
    "lastName",
    email,
    username,
    phone,
    total_points,
    role,
    status,
    "updatedAt",
    created_at,
    updated_at
  )
  VALUES (
    new_profile_id,
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', new.email), -- Username inicial
    new.raw_user_meta_data->>'phone',
    0,
    'CLIENT',
    'ACTIVE',
    now(),
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    username = EXCLUDED.username,
    phone = EXCLUDED.phone,
    "updatedAt" = now(),
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-asociar el trigger (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

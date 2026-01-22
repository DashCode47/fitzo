
-- gamification_v7_rls_fix.sql
-- 1. Arreglar RLS para la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT 
USING (auth.email() = email);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.email() = email);

DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden insertar su propio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.email() = email);

-- 2. Versión Ultra-Defensiva del Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  new_profile_id uuid := gen_random_uuid();
BEGIN
  -- Insertamos en users con bloques TRY/CATCH implícitos via ON CONFLICT
  BEGIN
    INSERT INTO public.users (id, "supabaseId", email, "nationalId", phone, role, status, "updatedAt")
    VALUES (new.id, new.id, new.email, new.raw_user_meta_data->>'national_id', 
            new.raw_user_meta_data->>'phone', 'CLIENT', 'ACTIVE', now())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error insertando en users: %', SQLERRM;
  END;

  -- Insertamos en profiles
  BEGIN
    INSERT INTO public.profiles (id, "userId", "firstName", "lastName", email, username, phone, total_points, role, status, "updatedAt", created_at, updated_at)
    VALUES (new_profile_id, new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 
            new.email, COALESCE(new.raw_user_meta_data->>'first_name', new.email), new.raw_user_meta_data->>'phone', 0, 'CLIENT', 'ACTIVE', now(), now(), now())
    ON CONFLICT (email) DO UPDATE SET
      "firstName" = EXCLUDED."firstName", 
      "lastName" = EXCLUDED."lastName", 
      username = EXCLUDED.username, 
      phone = EXCLUDED.phone, 
      "updatedAt" = now(), 
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error insertando en profiles: %', SQLERRM;
  END;

  RETURN new;
END; $$ LANGUAGE plpgsql;

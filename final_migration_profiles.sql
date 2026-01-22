
-- final_migration_profiles.sql
-- 1. Asegurar que 'profiles' tenga todas las columnas necesarias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
-- Asegurar que las columnas previas existan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENT';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Asegurar que el email sea único
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- 3. Redefinir handle_new_user para usar SOLO la tabla profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    display_name,
    national_id,
    phone,
    role,
    status,
    total_points,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', new.email),
    COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'national_id',
    new.raw_user_meta_data->>'phone',
    'CLIENT',
    'ACTIVE',
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    national_id = EXCLUDED.national_id,
    phone = EXCLUDED.phone,
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-asociar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Actualizar la función de canje de QR para usar la estructura simplificada
CREATE OR REPLACE FUNCTION process_qr_scan(qr_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_to_add int;
  qr_record record;
BEGIN
  -- QRs ESTÁTICOS
  IF qr_code = 'GYM_STATIC_ATTENDANCE_KEY' THEN
    IF EXISTS (SELECT 1 FROM gamification_logs WHERE user_id = auth.uid()::text AND action_type = 'ATTENDANCE' AND created_at > current_date) THEN
      RETURN '{"success": false, "message": "Ya marcaste asistencia hoy"}'::json;
    END IF;
    INSERT INTO gamification_logs (user_id, action_type, points) VALUES (auth.uid()::text, 'ATTENDANCE', 50);
    UPDATE profiles SET total_points = COALESCE(total_points, 0) + 50 WHERE id = auth.uid();
    RETURN '{"success": true, "message": "Asistencia registrada (+50 pts)"}'::json;
  END IF;

  IF qr_code = 'GYM_STATIC_WORKOUT_KEY' THEN
    IF EXISTS (SELECT 1 FROM gamification_logs WHERE user_id = auth.uid()::text AND action_type = 'WORKOUT' AND created_at > current_date) THEN
      RETURN '{"success": false, "message": "Ya registraste tu rutina hoy"}'::json;
    END IF;
    INSERT INTO gamification_logs (user_id, action_type, points) VALUES (auth.uid()::text, 'WORKOUT', 30);
    UPDATE profiles SET total_points = COALESCE(total_points, 0) + 30 WHERE id = auth.uid();
    RETURN '{"success": true, "message": "Entrenamiento completado (+30 pts)"}'::json;
  END IF;

  -- QRs DINÁMICOS
  BEGIN
    SELECT * INTO qr_record FROM public.generated_qrs WHERE id = qr_code::uuid;
    IF NOT FOUND THEN RETURN '{"success": false, "message": "Código QR no válido"}'::json; END IF;
    IF qr_record.is_used THEN RETURN '{"success": false, "message": "Este código ya fue utilizado"}'::json; END IF;
    
    points_to_add := qr_record.points_value;
    UPDATE public.generated_qrs SET is_used = true WHERE id = qr_record.id;
    INSERT INTO gamification_logs (user_id, action_type, points) VALUES (auth.uid()::text, qr_record.action_type, points_to_add);
    UPDATE profiles SET total_points = COALESCE(total_points, 0) + points_to_add WHERE id = auth.uid();
    
    RETURN json_build_object('success', true, 'message', 'Puntos canjeados: ' || points_to_add);
  EXCEPTION WHEN OTHERS THEN
    RETURN '{"success": false, "message": "Error procesando QR o ID inválido"}'::json;
  END;
END;
$$;

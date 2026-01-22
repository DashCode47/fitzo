
-- fix_login_lookup_and_upsert.sql
-- 1. Crear función RPC para búsqueda de email por cédula (Segura, se salta RLS para esta acción)
CREATE OR REPLACE FUNCTION public.lookup_email_by_national_id(p_national_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Permite ejecutar con privilegios elevados
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM profiles
  WHERE national_id = p_national_id
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- 2. Asegurar permisos para que usuarios anónimos puedan llamar a la función
GRANT EXECUTE ON FUNCTION public.lookup_email_by_national_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_national_id(text) TO authenticated;

-- 3. (OPCIONAL) Si 'id' en profiles no es el auth.uid(), este script asegura que coincida o sea opcional.
-- Según el error 23502, la columna 'id' no puede ser nula. 
-- Verifica si tu tabla profiles tiene 'id' como UUID y es la clave primaria.
-- Si vas a usar upsert desde el frontend, el id debe venir del objeto user de Supabase.

-- 4. Arreglar RLS para permitir el registro inicial (cuando el usuario aún no tiene todos los metadatos sincronizados)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir upsert a mi propio perfil" ON public.profiles;
CREATE POLICY "Permitir upsert a mi propio perfil" 
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Lectura pública de perfiles básicos" ON public.profiles;
CREATE POLICY "Lectura pública de perfiles básicos" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

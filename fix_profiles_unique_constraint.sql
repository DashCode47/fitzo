
-- fix_profiles_unique_constraint.sql
-- Este script corrige el error 42P10 al asegurar que la columna email sea única.

-- 1. Agregar la restricción UNIQUE a la columna email
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 2. (Opcional) Asegurar que total_points tenga un valor por defecto si no existe
ALTER TABLE public.profiles ALTER COLUMN total_points SET DEFAULT 0;

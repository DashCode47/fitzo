
-- sync_leaderboard.sql
-- 1. Crear la tabla leaderboard_entries si no existe
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REQUISITO: El dueño debe ser postgres
ALTER TABLE public.leaderboard_entries OWNER TO postgres;

-- 2. Habilitar RLS
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de ranking" ON public.leaderboard_entries;
CREATE POLICY "Lectura pública de ranking" 
ON public.leaderboard_entries FOR SELECT 
USING (true);

-- 3. Función para sincronizar perfiles con el ranking
CREATE OR REPLACE FUNCTION public.sync_profile_to_leaderboard()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.leaderboard_entries (id, score, updated_at)
    VALUES (NEW.id, NEW.total_points, NOW())
    ON CONFLICT (id) DO UPDATE SET
        score = EXCLUDED.score,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- REQUISITO: El dueño debe ser postgres
ALTER FUNCTION public.sync_profile_to_leaderboard() OWNER TO postgres;

-- 4. Trigger para actualizar el ranking automáticamente al ganar puntos
DROP TRIGGER IF EXISTS tr_sync_leaderboard ON public.profiles;
CREATE TRIGGER tr_sync_leaderboard
    AFTER INSERT OR UPDATE OF total_points ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_to_leaderboard();

-- 5. Carga inicial de datos desde profiles a leaderboard_entries
INSERT INTO public.leaderboard_entries (id, score, updated_at)
SELECT id, total_points, updated_at 
FROM public.profiles
WHERE total_points > 0
ON CONFLICT (id) DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = NOW();

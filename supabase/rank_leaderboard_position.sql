-- ─── RPC: get_rank_position ──────────────────────────────────────────────────
--
-- LeaderboardAPI.getRankLeaderboard() only fetches the top 10 profiles by
-- rank_index (see api/leaderboard.ts). Any user outside that top 10 was
-- silently missing from the "Mi posición" card in app/(tabs)/rankings.tsx —
-- not even an explanatory message, the card just didn't render.
--
-- This RPC computes a user's real rank position and the total number of
-- ranked users, over the FULL profiles table (not just the top 10), using
-- RANK() so it stays correct however many users exist. The client calls this
-- only when the user isn't found in the top-50 list already fetched.
CREATE OR REPLACE FUNCTION public.get_rank_position(p_user_id UUID)
RETURNS TABLE(rank_position BIGINT, total BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY rank_index DESC) AS rank_position
    FROM public.profiles
  )
  SELECT r.rank_position, (SELECT COUNT(*) FROM public.profiles) AS total
  FROM ranked r
  WHERE r.id = p_user_id;
$$;

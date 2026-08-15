
import { supabase } from '@/lib/supabase';

export interface LeaderboardItem {
    id: string;
    name: string;
    avatar: string;
    position: number;
    rankTier: string;
    rankIndex: number;
}

export interface RankPosition {
    position: number;
    total: number;
}

export const LeaderboardAPI = {
    getRankLeaderboard: async (): Promise<LeaderboardItem[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, photo_url, rank_tier, rank_index')
            .order('rank_index', { ascending: false })
            .limit(10);

        if (error) {
            console.error('[LeaderboardAPI] Rank error:', error);
            throw error;
        }

        return data.map((entry: any, index: number) => ({
            id: entry.id,
            name: entry.display_name || entry.username || 'Atleta',
            avatar: entry.photo_url || '',
            position: index + 1,
            rankTier: entry.rank_tier || 'Chulla',
            rankIndex: entry.rank_index ?? 0,
        }));
    },

    // Computed over the full profiles table (not just the top 50) via the
    // get_rank_position RPC — used as a fallback so users outside the top 50
    // still see their real position instead of the card silently disappearing.
    getRankPosition: async (userId: string): Promise<RankPosition | null> => {
        const { data, error } = await supabase.rpc('get_rank_position', {
            p_user_id: userId,
        });

        if (error) {
            console.error('[LeaderboardAPI] getRankPosition error:', error);
            throw error;
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return null;
        return { position: row.rank_position, total: row.total };
    },
};

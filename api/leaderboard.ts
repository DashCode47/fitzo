
import { supabase } from '@/lib/supabase';

export interface LeaderboardItem {
    id: string;
    name: string;
    avatar: string;
    position: number;
    rankTier: string;
    rankIndex: number;
}

export const LeaderboardAPI = {
    getRankLeaderboard: async (): Promise<LeaderboardItem[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, photo_url, rank_tier, rank_index')
            .order('rank_index', { ascending: false })
            .limit(50);

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
};


import { supabase } from '@/lib/supabase';

export interface LeaderboardItem {
    id: string;
    name: string;
    score: number;
    avatar: string;
    rank: number;
    streak?: number;
    badges?: string[];
}

export const LeaderboardAPI = {
    getRankLeaderboard: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, photo_url, rank_tier, rank_index')
            .order('rank_index', { ascending: false })
            .limit(3);

        if (error) {
            console.error('[LeaderboardAPI] Rank error:', error);
            throw error;
        }

        return data.map((entry: any, index: number) => ({
            id: entry.id,
            name: entry.display_name || entry.username || 'Desconocido',
            score: entry.rank_index, // Store index for the visual
            avatar: entry.photo_url || 'https://via.placeholder.com/150',
            rank: index + 1,
            tier: entry.rank_tier
        }));
    },
};

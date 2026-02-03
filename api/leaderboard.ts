
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
    getLeaderboard: async () => {
        const { data, error } = await supabase
            .from('top_rankings')
            .select('*')
            .order('score', { ascending: false });

        if (error) {
            console.error('[LeaderboardAPI] Supabase error:', error);
            throw error;
        }

        return data.map((entry: any, index: number) => {
            return {
                id: entry.id,
                name: entry.name || entry.username || 'Unknown',
                score: entry.score,
                avatar: entry.avatar || 'https://via.placeholder.com/150',
                rank: index + 1
            };
        });
    },
};

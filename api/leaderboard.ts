
import { supabase } from '@/lib/supabase';

export const LeaderboardAPI = {
  getLeaderboard: async () => {
    const { data, error } = await supabase
        .from('leaderboard_entries')
        .select(`
            *,
            user:users (
                profile:profiles (
                    firstName,
                    lastName,
                    photoUrl
                )
            )
        `)
        .order('score', { ascending: false })
        .limit(10);

    if (error) throw error;
    
    return data.map((entry: any, index: number) => {
        // Handle array or object relation for profile
        const userProfile = Array.isArray(entry.user?.profile) 
            ? entry.user.profile[0] 
            : entry.user?.profile;

        return {
            id: entry.id,
            name: userProfile?.firstName || 'Unknown',
            score: entry.score,
            avatar: userProfile?.photoUrl || 'https://via.placeholder.com/150',
            rank: index + 1
        };
    });
  },
};

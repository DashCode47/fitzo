
import { supabase } from '@/lib/supabase';

/*
  Requires Supabase table:

  CREATE TABLE attendance_logs (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    checked_in_at timestamptz DEFAULT now() NOT NULL,
    date          date NOT NULL
  );
  CREATE INDEX idx_attendance_user_date ON attendance_logs(user_id, date);
*/

export interface StreakData {
  streak: number;
  weekDays: number;   // distinct days checked-in Mon–Sun this week
  todayCount: number; // 0 or 1
}

const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const localToday = (): string => toDateStr(new Date());

const startOfCurrentWeek = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return toDateStr(monday);
};

export const AttendanceAPI = {
  checkIn: async (userId: string): Promise<{ success: boolean; alreadyMax: boolean; error?: string }> => {
    const today = localToday();

    const { count, error: countErr } = await supabase
      .from('attendance_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date', today);

    if (countErr) return { success: false, alreadyMax: false, error: countErr.message };
    if ((count ?? 0) >= 1) return { success: false, alreadyMax: true };

    const { error } = await supabase.from('attendance_logs').insert({
      user_id: userId,
      checked_in_at: new Date().toISOString(),
      date: today,
    });

    if (error) return { success: false, alreadyMax: false, error: error.message };
    return { success: true, alreadyMax: false };
  },

  getStreakData: async (userId: string): Promise<StreakData> => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('date')
      .eq('user_id', userId)
      .gte('date', toDateStr(ninetyDaysAgo))
      .order('date', { ascending: false });

    if (error || !data) return { streak: 0, weekDays: 0, todayCount: 0 };

    const today = localToday();
    const todayCount = data.filter(r => r.date === today).length;
    const uniqueDates = [...new Set(data.map(r => r.date as string))].sort().reverse();

    // Helper: Monday of the week for a given date string
    const getMondayStr = (dateStr: string): string => {
      const d = new Date(dateStr + 'T12:00:00'); // Use noon to avoid TZ shifts
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.getFullYear(), d.getMonth(), diff);
      return toDateStr(monday);
    };

    const currentWeekStart = startOfCurrentWeek();
    
    // Group unique dates by week
    const weeksMap: Record<string, number> = {};
    uniqueDates.forEach(d => {
      const m = getMondayStr(d);
      weeksMap[m] = (weeksMap[m] || 0) + 1;
    });

    const currentWeekDays = weeksMap[currentWeekStart] || 0;
    
    // Calculate streak: Sum of current days + days from all consecutive previous successful weeks
    let totalStreakDays = currentWeekDays;
    let checkDate = new Date(currentWeekStart + 'T12:00:00');
    
    // Walk backwards through previous weeks
    while (true) {
      // Move to previous Monday
      checkDate.setDate(checkDate.getDate() - 7);
      const prevMondayStr = toDateStr(checkDate);
      const daysInWeek = weeksMap[prevMondayStr] || 0;

      if (daysInWeek >= 4) {
        totalStreakDays += daysInWeek;
      } else {
        // We found a week that didn't meet the goal, so the streak stops here
        break;
      }

      // Safety break to avoid infinite loop
      if (checkDate < ninetyDaysAgo) break;
    }

    return { 
      streak: totalStreakDays, 
      weekDays: currentWeekDays, 
      todayCount 
    };
  },
};

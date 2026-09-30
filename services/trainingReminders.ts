import { StreakData } from '@/api/attendance';
import { UserSchedule } from '@/api/routines';
import { useAppStore } from '@/store/useAppStore';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

// ponytail: fixed hours; add a per-user setting if people ask for it.
const ROUTINE_HOUR = 8;
const STREAK_HOUR = 19;
const PREFIX = 'training-reminder-';

/**
 * Streak-risk reminder times for the next 7 days: only on scheduled weekdays
 * (0 = Sunday, like Date.getDay), skipping past times and today if already checked in.
 */
export function streakReminderDates(days: number[], now: Date, checkedInToday: boolean): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, STREAK_HOUR);
    if (!days.includes(d.getDay()) || d <= now || (i === 0 && checkedInToday)) continue;
    out.push(d);
  }
  return out;
}

async function reschedule(schedule: UserSchedule[] | null, streak: StreakData | null, enabled: boolean) {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (!enabled) return;

  const active = (schedule ?? []).filter((s) => s.active && s.routine);

  // 1. Weekly "today's routine" reminder for each scheduled day.
  for (const s of active) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}routine-${s.day_of_week}`,
      content: {
        title: `Hoy toca ${s.routine!.name} 💪`,
        body: 'Tu rutina de hoy te está esperando.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: s.day_of_week + 1, // expo: 1 = Sunday
        hour: ROUTINE_HOUR,
        minute: 0,
        channelId: 'default',
      },
    });
  }

  // 2. Streak at risk: evening reminder on scheduled days without a check-in.
  // Rescheduled whenever streakData changes, so checking in cancels today's.
  if (!streak || streak.streak <= 0) return;
  const dates = streakReminderDates(active.map((s) => s.day_of_week), new Date(), streak.todayCount >= 1);
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}streak-${date.getTime()}`,
      content: {
        title: 'Tu racha está en riesgo 🔥',
        body: `Llevas ${streak.streak} días de racha. Entrena hoy para no perderla.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'default' },
    });
  }
}

// Serialize runs so a cancel-all from one run can't wipe what a later run scheduled.
let queue: Promise<void> = Promise.resolve();

/** Mount once at the app root. */
export function useTrainingReminders() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const userSchedule = useAppStore((s) => s.userSchedule);
  const streakData = useAppStore((s) => s.streakData);
  const enabled = useAppStore((s) => s.remindersEnabled);

  useEffect(() => {
    if (!isHydrated) return;
    queue = queue
      .then(() => reschedule(userSchedule, streakData, enabled))
      .catch((e) => console.error('[TrainingReminders] Failed to schedule:', e));
  }, [isHydrated, userSchedule, streakData, enabled]);
}

import { AttendanceAPI } from '@/api/attendance';
import { RanksAPI } from '@/api/ranks';
import { WorkoutsAPI } from '@/api/workouts';
import { ActiveWorkout, useAppStore } from '@/store/useAppStore';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export const AUTO_FINISH_MS = 30 * 60 * 1000;
const NOTIFICATION_ID = 'workout-auto-finish';

// Guards against saving the same session twice (manual finish keeps activeWorkout
// alive for the success modal, and the auto check could fire meanwhile).
let savingStartTime: string | null = null;

/** If the user went idle for AUTO_FINISH_MS after their last set, the session ends at that set. */
export function workoutEndTime(workout: ActiveWorkout, now = Date.now()): number {
  const last = workout.lastSetAt ? new Date(workout.lastSetAt).getTime() : null;
  return last != null && now - last >= AUTO_FINISH_MS ? last : now;
}

export async function saveActiveWorkout(workout: ActiveWorkout): Promise<void> {
  const { profile, userStats } = useAppStore.getState();
  if (!profile?.id || savingStartTime === workout.startTime) return;
  savingStartTime = workout.startTime;

  try {
    const end = workoutEndTime(workout);
    const totalVol = workout.exercises.reduce(
      (acc, ex) => acc + ex.sets.reduce((sx, s) => sx + s.weight * s.reps, 0),
      0,
    );

    await WorkoutsAPI.saveWorkoutSession(
      {
        user_id: profile.id,
        routine_id: workout.routineId,
        started_at: workout.startTime,
        finished_at: new Date(end).toISOString(),
        duration_seconds: Math.max(0, Math.floor((end - new Date(workout.startTime).getTime()) / 1000)),
        total_volume: totalVol,
      },
      workout.exercises.map((ex, idx) => ({
        exercise_id: ex.exerciseId,
        sets_completed: ex.sets.filter((s) => s.completed),
        order_index: idx,
      })),
    );
  } catch (e) {
    savingStartTime = null; // allow a retry
    throw e;
  }

  Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});

  // Keep the leaderboard fresh right after a session. Fire-and-forget:
  // the workout is already saved, this shouldn't block finishing the flow.
  if (userStats?.weight) {
    RanksAPI.syncUserRank(profile.id, userStats.weight, (userStats.gender as any) || 'M');
  }
  // checkIn is idempotent, so finishing a session always counts as attendance.
  // Refreshing the streak also cancels today's "streak at risk" reminder.
  AttendanceAPI.checkIn(profile.id)
    .then(() => AttendanceAPI.getStreakData(profile.id!))
    .then((s) => useAppStore.getState().setStreakData(s))
    .catch((e) => console.error('[WorkoutAutoFinish] Failed to mark attendance:', e));
}

async function autoFinishIfIdle() {
  const workout = useAppStore.getState().activeWorkout;
  if (!workout?.lastSetAt) return;
  if (Date.now() - new Date(workout.lastSetAt).getTime() < AUTO_FINISH_MS) return;
  try {
    await saveActiveWorkout(workout);
    useAppStore.getState().setActiveWorkout(null);
  } catch (e) {
    console.error('[WorkoutAutoFinish] Auto-finish failed, will retry:', e);
  }
}

/** Mount once at the app root. */
export function useWorkoutAutoFinish() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hasWorkout = useAppStore((s) => !!s.activeWorkout);
  const lastSetAt = useAppStore((s) => s.activeWorkout?.lastSetAt);
  const routineName = useAppStore((s) => s.activeWorkout?.routineName);

  // Check on launch, on every return to foreground, and every 30s while open.
  // ponytail: JS can't run while the app is killed; the save happens on next open,
  // with finished_at = last set, so the recorded time is still correct.
  useEffect(() => {
    if (!isHydrated || !hasWorkout) return;
    autoFinishIfIdle();
    const id = setInterval(autoFinishIfIdle, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') autoFinishIfIdle();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [isHydrated, hasWorkout]);

  // (Re)schedule the local notification for 30 min after the latest completed set.
  useEffect(() => {
    if (!isHydrated) return;
    if (!hasWorkout || !lastSetAt) {
      Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
      return;
    }
    const date = new Date(new Date(lastSetAt).getTime() + AUTO_FINISH_MS);
    if (date.getTime() <= Date.now()) return;
    Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID, // same id replaces the previous schedule
      content: {
        title: 'Entrenamiento finalizado',
        body: `Pasaron 30 min sin series nuevas. Guardamos "${routineName ?? 'tu rutina'}" hasta tu última serie.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'default' },
    }).catch((e) => console.error('[WorkoutAutoFinish] Failed to schedule notification:', e));
  }, [isHydrated, hasWorkout, lastSetAt, routineName]);
}

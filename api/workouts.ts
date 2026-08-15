import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/utils/async";

export interface WorkoutLog {
  id: number;
  user_id: string;
  routine_id: number;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  total_volume: number;
  notes?: string;
  routine?: {
    name: string;
    difficulty: string;
  };
}

export interface WorkoutExerciseLog {
  id: number;
  workout_log_id: number;
  exercise_id: number;
  sets_completed: Array<{
    set: number;
    reps: number;
    weight: number;
  }>;
  order_index: number;
}

// user_personal_records is a cached snapshot the get_user_max_weights RPC reads from —
// it doesn't recompute live, so callers that touch a user's sets must resync it here.
// The MAX() and upsert/delete both happen server-side in sync_personal_record (SQL),
// so this never pulls a user's full set history over the network just to fold it in JS.
async function syncPersonalRecord(userId: string, exerciseId: number) {
  const { error } = (await withTimeout(
    supabase.rpc("sync_personal_record", {
      p_user_id: userId,
      p_exercise_id: exerciseId,
    }) as any,
  )) as any;
  if (error) throw error;
}

export const WorkoutsAPI = {
  getWorkoutLogs: async (
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<any[]> => {
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from("workout_logs")
          .select(
            `
            *,
            routine:routines(name, difficulty)
          `,
          )
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .range(offset, offset + limit - 1) as any,
      )) as any;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[WorkoutsAPI] getWorkoutLogs failed:", e);
      throw e;
    }
  },

  getWorkoutDetails: async (
    workoutLogId: number,
  ): Promise<WorkoutExerciseLog[]> => {
    try {
      const { data, error } = (await withTimeout(
        supabase
          .from("workout_exercises")
          .select(
            `
            *,
            exercise:exercises (*)
          `,
          )
          .eq("workout_log_id", workoutLogId)
          .order("order_index", { ascending: true }) as any,
      )) as any;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[WorkoutsAPI] getWorkoutDetails failed:", e);
      throw e;
    }
  },

  // Updates one set's weight/reps within a workout_exercises row, or removes it,
  // then recomputes the parent workout_log's cached total_volume from all its
  // exercises. All of this (edit/delete the set, recompute volume, update both
  // tables, resync the PR) happens server-side in one round-trip via the
  // update_workout_set RPC — see supabase/update_workout_set.sql.
  updateSet: async (
    workoutExerciseId: number,
    workoutLogId: number,
    setIndex: number,
    update: { weight: number; reps: number } | null,
    userId: string,
  ): Promise<void> => {
    try {
      const { error } = (await withTimeout(
        supabase.rpc("update_workout_set", {
          p_user_id: userId,
          p_workout_exercise_id: workoutExerciseId,
          p_workout_log_id: workoutLogId,
          p_set_index: setIndex,
          p_new_set: update,
        }) as any,
      )) as any;
      if (error) throw error;
    } catch (e) {
      console.error("[WorkoutsAPI] updateSet failed:", e);
      throw e;
    }
  },

  getExerciseProgress: async (
    userId: string,
    exerciseId: number,
    limit = 50,
  ): Promise<any[]> => {
    try {
      // Fetch historical performance for a specific exercise to build PR graphs.
      // Ordered newest-first so `.limit()` keeps the most recent sessions, then
      // reversed back to ascending for the chart, which reads left-to-right in time.
      const { data, error } = (await withTimeout(
        supabase
          .from("workout_exercises")
          .select(
            `
            id,
            workout_log_id,
            sets_completed,
            workout_log:workout_logs!inner (
              created_at,
              user_id
            )
          `,
          )
          .eq("exercise_id", exerciseId)
          .eq("workout_log.user_id", userId)
          .order("workout_log_id", { ascending: false })
          .limit(limit) as any,
      )) as any;

      if (error) throw error;

      // Extract max weight or volume per session
      return (
        [...data].reverse().map((log: any) => {
          const sets = log.sets_completed || [];
          const weights = sets.map((s: any) => s.weight || 0);
          const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
          const totalVol = sets.reduce(
            (acc: number, s: any) => acc + (s.weight || 0) * (s.reps || 0),
            0,
          );

          return {
            date: log.workout_log?.created_at,
            maxWeight,
            totalVol,
          };
        }) || []
      );
    } catch (e) {
      console.error("[WorkoutsAPI] getExerciseProgress failed:", e);
      throw e;
    }
  },

  saveWorkoutSession: async (
    log: Partial<WorkoutLog>,
    exercises: Partial<WorkoutExerciseLog>[],
  ) => {
    try {
      // 1. Save main log
      const { data: logData, error: logError } = (await withTimeout(
        supabase.from("workout_logs").insert(log).select().single() as any,
      )) as any;
      if (logError) throw logError;

      // 2. Save exercise performance
      if (exercises && exercises.length > 0) {
        const exerciseData = exercises.map((ex) => ({
          ...ex,
          workout_log_id: logData.id,
        }));
        const { error: exError } = (await withTimeout(
          supabase.from("workout_exercises").insert(exerciseData) as any,
        )) as any;
        if (exError) throw exError;

        // PR sync failure shouldn't fail the whole save — the workout is already recorded.
        try {
          const exerciseIds = [...new Set(exercises.map((ex) => ex.exercise_id).filter(Boolean))] as number[];
          await Promise.all(
            exerciseIds.map((id) => syncPersonalRecord(log.user_id!, id)),
          );
        } catch (prSyncErr) {
          console.warn("[WorkoutsAPI] Failed to sync personal records:", prSyncErr);
        }
      }

      // 3. Register points in gamification (WORKOUT_COMPLETED = 30 pts)
      try {
        await supabase.from("gamification_logs").insert({
          user_id: log.user_id,
          action_type: "WORKOUT_COMPLETED",
          points: 30,
          metadata: JSON.stringify({ workout_id: logData.id }),
        });

        // Update total profile points
        await supabase.rpc("increment_user_points", {
          p_user_id: log.user_id,
          p_points: 30,
        });
      } catch (gameErr) {
        console.warn("[WorkoutsAPI] Failed to update gamification:", gameErr);
        // Don't fail the entire save if gamification fails
      }

      return logData;
    } catch (e) {
      console.error("[WorkoutsAPI] saveWorkoutSession failed:", e);
      throw e;
    }
  },
};

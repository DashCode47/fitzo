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

  getExerciseProgress: async (
    userId: string,
    exerciseId: number,
  ): Promise<any[]> => {
    try {
      // Fetch historical performance for a specific exercise to build PR graphs
      const { data, error } = (await withTimeout(
        supabase
          .from("workout_exercises")
          .select(
            `
            id,
            workout_log_id,
            sets_completed,
            workout_log:workout_logs (
              created_at
            )
          `,
          )
          .eq("exercise_id", exerciseId)
          .order("workout_log_id", { ascending: true }) as any,
      )) as any;

      if (error) throw error;

      // Extract max weight or volume per session
      return (
        data.map((log: any) => {
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

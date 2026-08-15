import { queueSupabaseFromResponses, queueSupabaseRpcResponses } from "../test-utils/supabaseMock";

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

import { supabase } from "@/lib/supabase";
import { WorkoutsAPI } from "./workouts";

const mockSupabase = supabase as unknown as { from: jest.Mock; rpc: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateSet", () => {
  it("edits a set via a single update_workout_set RPC call", async () => {
    queueSupabaseRpcResponses(mockSupabase, [{ data: [{ total_volume: 1600, max_weight: 120 }] }]);

    await WorkoutsAPI.updateSet(7, 55, 1, { weight: 120, reps: 5 }, "user-1");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("update_workout_set", {
      p_user_id: "user-1",
      p_workout_exercise_id: 7,
      p_workout_log_id: 55,
      p_set_index: 1,
      p_new_set: { weight: 120, reps: 5 },
    });
  });

  it("deletes a set by passing p_new_set: null", async () => {
    queueSupabaseRpcResponses(mockSupabase, [{ data: [{ total_volume: 0, max_weight: null }] }]);

    await WorkoutsAPI.updateSet(3, 20, 0, null, "user-2");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("update_workout_set", {
      p_user_id: "user-2",
      p_workout_exercise_id: 3,
      p_workout_log_id: 20,
      p_set_index: 0,
      p_new_set: null,
    });
  });

  it("propagates the RPC error instead of failing silently (e.g. RLS/ownership check inside the function)", async () => {
    queueSupabaseRpcResponses(mockSupabase, [
      { reject: new Error("workout_exercises row 1 not found for user user-x / log 1") },
    ]);

    await expect(
      WorkoutsAPI.updateSet(1, 1, 0, { weight: 60, reps: 5 }, "user-x"),
    ).rejects.toThrow(/not found/i);
  });
});

describe("saveWorkoutSession", () => {
  const log = { user_id: "user-3", routine_id: 1, started_at: "2026-08-08T00:00:00.000Z" };
  const exercises = [
    { exercise_id: 5, sets_completed: [{ set: 1, reps: 5, weight: 200 }], order_index: 0 },
  ];
  const savedLog = { id: 99, user_id: "user-3", started_at: "2026-08-08T00:00:00.000Z" };

  it("syncs the PR via RPC for each unique exercise after saving a session", async () => {
    queueSupabaseFromResponses(mockSupabase, [
      { data: savedLog }, // 1. insert workout_logs, .select().single()
      { data: null }, // 2. insert workout_exercises
      { error: null }, // 3. gamification_logs insert
    ]);
    queueSupabaseRpcResponses(mockSupabase, [
      { data: 200 }, // sync_personal_record for exercise 5
      { data: null }, // increment_user_points
    ]);

    const result = await WorkoutsAPI.saveWorkoutSession(log, exercises);

    expect(result).toEqual(savedLog);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("sync_personal_record", {
      p_user_id: "user-3",
      p_exercise_id: 5,
    });
  });

  it("still resolves with the saved log when the gamification step fails", async () => {
    queueSupabaseFromResponses(mockSupabase, [
      { data: savedLog },
      { data: null },
      { reject: new Error("network down") }, // gamification_logs insert fails
    ]);
    queueSupabaseRpcResponses(mockSupabase, [{ data: 200 }]);

    await expect(WorkoutsAPI.saveWorkoutSession(log, exercises)).resolves.toEqual(savedLog);
  });

  it("still resolves with the saved log when PR sync fails", async () => {
    queueSupabaseFromResponses(mockSupabase, [
      { data: savedLog },
      { data: null },
      { error: null }, // gamification_logs insert
    ]);
    queueSupabaseRpcResponses(mockSupabase, [
      { reject: new Error("sync_personal_record RPC failed") },
      { data: null }, // increment_user_points
    ]);

    await expect(WorkoutsAPI.saveWorkoutSession(log, exercises)).resolves.toEqual(savedLog);
  });
});

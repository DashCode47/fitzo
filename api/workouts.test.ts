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

describe("getWorkoutLogs", () => {
  it("orders by started_at so it matches the date shown per session", async () => {
    const builders = queueSupabaseFromResponses(mockSupabase, [
      { data: [{ id: 1, started_at: "2026-09-04T23:50:00.000Z" }] },
    ]);

    const result = await WorkoutsAPI.getWorkoutLogs("user-1", 10, 0);

    expect(builders[0].order).toHaveBeenCalledWith("started_at", { ascending: false });
    expect(result).toEqual([{ id: 1, started_at: "2026-09-04T23:50:00.000Z" }]);
  });

  it("propagates the error instead of silently returning an empty list", async () => {
    queueSupabaseFromResponses(mockSupabase, [{ reject: new Error("network down") }]);

    await expect(WorkoutsAPI.getWorkoutLogs("user-1", 10, 0)).rejects.toThrow(/network down/);
  });
});

describe("getWorkoutDetails", () => {
  it("propagates the error instead of returning an empty list", async () => {
    queueSupabaseFromResponses(mockSupabase, [{ reject: new Error("network down") }]);

    await expect(WorkoutsAPI.getWorkoutDetails(55)).rejects.toThrow(/network down/);
  });
});

describe("getExerciseProgress", () => {
  it("uses workout_logs.started_at, not created_at, so dates match the history list", async () => {
    const builders = queueSupabaseFromResponses(mockSupabase, [
      {
        data: [
          {
            id: 1,
            workout_log_id: 10,
            sets_completed: [{ set: 1, reps: 5, weight: 100 }],
            workout_log: { started_at: "2026-09-04T23:50:00.000Z" },
          },
        ],
      },
    ]);

    const result = await WorkoutsAPI.getExerciseProgress("user-1", 5);

    expect(builders[0].select).toHaveBeenCalledWith(
      expect.stringContaining("started_at"),
    );
    expect(builders[0].select).not.toHaveBeenCalledWith(
      expect.stringContaining("created_at"),
    );
    expect(result).toEqual({
      items: [
        { date: "2026-09-04T23:50:00.000Z", maxWeight: 100, totalVol: 500, hasData: true },
      ],
      truncated: false,
    });
  });

  it("flags sessions with no logged sets via hasData instead of a bare 0", async () => {
    queueSupabaseFromResponses(mockSupabase, [
      {
        data: [
          {
            id: 1,
            workout_log_id: 10,
            sets_completed: [],
            workout_log: { started_at: "2026-09-04T10:00:00.000Z" },
          },
        ],
      },
    ]);

    const result = await WorkoutsAPI.getExerciseProgress("user-1", 5);

    expect(result).toEqual({
      items: [
        { date: "2026-09-04T10:00:00.000Z", maxWeight: 0, totalVol: 0, hasData: false },
      ],
      truncated: false,
    });
  });

  it("requests one row beyond the limit to detect truncation, and trims it off the result", async () => {
    const builders = queueSupabaseFromResponses(mockSupabase, [
      {
        data: [
          { id: 2, workout_log_id: 11, sets_completed: [{ set: 1, reps: 5, weight: 90 }], workout_log: { started_at: "2026-09-05T00:00:00.000Z" } },
          { id: 1, workout_log_id: 10, sets_completed: [{ set: 1, reps: 5, weight: 80 }], workout_log: { started_at: "2026-09-04T00:00:00.000Z" } },
        ],
      },
    ]);

    const result = await WorkoutsAPI.getExerciseProgress("user-1", 5, 1);

    expect(builders[0].limit).toHaveBeenCalledWith(2);
    expect(result.truncated).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].date).toBe("2026-09-05T00:00:00.000Z");
  });

  it("propagates the error instead of silently returning an empty list", async () => {
    queueSupabaseFromResponses(mockSupabase, [{ reject: new Error("network down") }]);

    await expect(WorkoutsAPI.getExerciseProgress("user-1", 5)).rejects.toThrow(/network down/);
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

  it("rolls back the parent workout_log if saving its exercises fails, instead of leaving a ghost session", async () => {
    const builders = queueSupabaseFromResponses(mockSupabase, [
      { data: savedLog }, // 1. insert workout_logs
      { reject: new Error("network down") }, // 2. insert workout_exercises fails
      { data: null }, // 3. delete workout_logs (rollback)
    ]);

    await expect(WorkoutsAPI.saveWorkoutSession(log, exercises)).rejects.toThrow(/network down/);

    expect(builders[2].delete).toHaveBeenCalled();
    expect(builders[2].eq).toHaveBeenCalledWith("id", savedLog.id);
  });
});

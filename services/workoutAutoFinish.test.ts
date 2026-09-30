jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("expo-notifications", () => ({}));

import { AUTO_FINISH_MS, workoutEndTime } from "./workoutAutoFinish";

const base = { routineId: 1, routineName: "R", startTime: "2026-01-01T10:00:00Z", exercises: [] };
const lastSet = new Date("2026-01-01T10:40:00Z").getTime();

describe("workoutEndTime", () => {
  it("uses now while the user is still active", () => {
    const now = lastSet + AUTO_FINISH_MS - 1;
    expect(workoutEndTime({ ...base, lastSetAt: new Date(lastSet).toISOString() }, now)).toBe(now);
  });

  it("ends at the last completed set after 30 idle minutes", () => {
    const now = lastSet + 5 * 60 * 60 * 1000;
    expect(workoutEndTime({ ...base, lastSetAt: new Date(lastSet).toISOString() }, now)).toBe(lastSet);
  });

  it("uses now when no set was ever completed", () => {
    expect(workoutEndTime(base, 123)).toBe(123);
  });
});

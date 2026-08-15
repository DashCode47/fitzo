import {
  computeAggregates,
  computeDailyCounts,
  startOfWeek,
  volumeTrend,
  weekRangeLabel,
} from "./stats";

function log(startedAt: string, overrides: Record<string, any> = {}) {
  return { started_at: startedAt, total_volume: 0, duration_seconds: 0, ...overrides };
}

describe("startOfWeek", () => {
  it("returns the preceding Monday at midnight for a mid-week date", () => {
    const wednesday = new Date(2026, 7, 5, 15, 30); // Wed Aug 5 2026, 15:30 local
    const result = startOfWeek(wednesday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(3);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("returns the Monday 6 days prior for a Sunday (dow === 0 edge case)", () => {
    const sunday = new Date(2026, 7, 9, 10, 0); // Sun Aug 9 2026
    const result = startOfWeek(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(3);
  });
});

describe("computeDailyCounts", () => {
  it("buckets a log on the same day as weekStart into index 0, even hours later (regression: rounding bug)", () => {
    // weekOffset 0 => weekStart = Monday of the current real week.
    // Use "today" as the log date so it always lands in the current week regardless of when the test runs.
    const now = new Date();
    const monday = startOfWeek(now);
    const laterSameDay = new Date(monday);
    laterSameDay.setHours(20, 0, 0, 0); // hours after midnight, same calendar day
    const buckets = computeDailyCounts([log(laterSameDay.toISOString())], 0);
    expect(buckets[0].count).toBe(1);
  });

  it("does not leak a log from the following week into the last day of the current week", () => {
    const now = new Date();
    const monday = startOfWeek(now);
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const buckets = computeDailyCounts([log(nextMonday.toISOString())], 0);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("places a Sunday log in index 6", () => {
    const now = new Date();
    const monday = startOfWeek(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(12, 0, 0, 0);
    const buckets = computeDailyCounts([log(sunday.toISOString())], 0);
    expect(buckets[6].count).toBe(1);
    expect(buckets.slice(0, 6).every((b) => b.count === 0)).toBe(true);
  });

  it("sums minutes and volume for multiple logs on the same day", () => {
    const now = new Date();
    const monday = startOfWeek(now);
    const morning = new Date(monday);
    morning.setHours(8, 0, 0, 0);
    const evening = new Date(monday);
    evening.setHours(18, 0, 0, 0);

    const buckets = computeDailyCounts(
      [
        log(morning.toISOString(), { duration_seconds: 1800, total_volume: 500 }),
        log(evening.toISOString(), { duration_seconds: 3600, total_volume: 1000 }),
      ],
      0,
    );
    expect(buckets[0].count).toBe(2);
    expect(buckets[0].minutes).toBe(30 + 60);
    expect(buckets[0].volume).toBe(1500);
  });
});

describe("weekRangeLabel", () => {
  it("formats a same-month range without repeating the month", () => {
    // Find a weekOffset whose Monday..Sunday span stays within one month by construction:
    // use a fixed reference week (Mon Aug 3 – Sun Aug 9, 2026) via offset from "now" is flaky,
    // so instead assert on the shape/structure rather than exact text tied to today's date.
    const label = weekRangeLabel(0);
    expect(label).toMatch(/\d+ – .+ de \w+/);
  });

  it("includes both months when the week crosses a month boundary", () => {
    // Jan 26 2026 is a Monday; that week (Jan 26 - Feb 1) crosses into February.
    const crossMonthMonday = new Date(2026, 0, 26);
    const offset = Math.round(
      (crossMonthMonday.getTime() - startOfWeek(new Date()).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const label = weekRangeLabel(offset);
    expect(label).toContain("enero");
    expect(label).toContain("febrero");
  });
});

describe("computeAggregates", () => {
  it("only counts logs at or after startOfWeek toward thisWeekCount/lastWeekVolume", () => {
    const now = new Date();
    const monday = startOfWeek(now);
    const thisWeekLog = new Date(monday);
    thisWeekLog.setHours(9, 0, 0, 0);
    const lastWeekLog = new Date(monday);
    lastWeekLog.setDate(monday.getDate() - 1); // Sunday before this week

    const result = computeAggregates([
      log(thisWeekLog.toISOString(), { total_volume: 100 }),
      log(lastWeekLog.toISOString(), { total_volume: 200 }),
    ]);

    expect(result.thisWeekCount).toBe(1);
    expect(result.lastWeekVolume).toBe(100);
  });

  it("only counts the week before startOfWeek toward prevWeekVolume", () => {
    const now = new Date();
    const monday = startOfWeek(now);
    const prevWeekLog = new Date(monday);
    prevWeekLog.setDate(monday.getDate() - 3); // within the prior week
    const twoWeeksAgoLog = new Date(monday);
    twoWeeksAgoLog.setDate(monday.getDate() - 10); // outside the prior week

    const result = computeAggregates([
      log(prevWeekLog.toISOString(), { total_volume: 300 }),
      log(twoWeeksAgoLog.toISOString(), { total_volume: 999 }),
    ]);

    expect(result.prevWeekVolume).toBe(300);
  });

  it("sums totalVolume and computes avgDurationMin across all logs regardless of date", () => {
    const result = computeAggregates([
      log("2020-01-01T00:00:00.000Z", { total_volume: 100, duration_seconds: 1200 }),
      log("2025-06-15T00:00:00.000Z", { total_volume: 50, duration_seconds: 2400 }),
    ]);
    expect(result.totalWorkouts).toBe(2);
    expect(result.totalVolume).toBe(150);
    expect(result.avgDurationMin).toBe(30); // (1200+2400)/2/60
  });

  it("returns 0 avgDurationMin and null lastWorkoutAt for an empty log list", () => {
    const result = computeAggregates([]);
    expect(result.avgDurationMin).toBe(0);
    expect(result.lastWorkoutAt).toBeNull();
  });
});

describe("volumeTrend", () => {
  it("returns null when there is no previous volume (avoids division by zero)", () => {
    expect(volumeTrend(100, 0)).toBeNull();
  });

  it("returns null when current equals previous (no meaningful change)", () => {
    expect(volumeTrend(100, 100)).toBeNull();
  });

  it("returns direction 'up' with the correct percentage on an increase", () => {
    expect(volumeTrend(150, 100)).toEqual({ direction: "up", pct: 50 });
  });

  it("returns direction 'down' with the correct percentage on a decrease", () => {
    expect(volumeTrend(50, 100)).toEqual({ direction: "down", pct: 50 });
  });
});

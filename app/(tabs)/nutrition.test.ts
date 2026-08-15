import { suggestActivityLevel } from "./nutrition";

function log(startedAt: Date) {
  return { started_at: startedAt.toISOString() };
}

// Mirrors suggestActivityLevel's own week-start math, so test fixtures are
// anchored to the lookback window regardless of which day of the week the
// suite runs on (Monday..Sunday all behave the same way).
function startOfThisWeek(): Date {
  const now = new Date();
  const dow = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

// Returns a date `daysBeforeWindowStart` days before the start of the 2-week
// lookback window's earliest boundary — i.e. safely inside the window when
// daysBeforeWindowStart is between 0 (exclusive, that's the window edge) and 14.
function dayInWindow(daysAfterWindowStart: number): Date {
  const windowStart = new Date(startOfThisWeek());
  windowStart.setDate(windowStart.getDate() - 14);
  const d = new Date(windowStart);
  d.setDate(windowStart.getDate() + daysAfterWindowStart);
  d.setHours(12, 0, 0, 0);
  return d;
}

describe("suggestActivityLevel", () => {
  it("returns null when there are no recent logs", () => {
    expect(suggestActivityLevel([], "sedentary")).toBeNull();
  });

  it("returns null when the observed weekly average matches the declared level", () => {
    // "moderate" expects 1-4/week; 6 logs spread evenly across the 14-day window = 3/week.
    const logs = [0, 2, 4, 7, 9, 11].map((d) => log(dayInWindow(d)));
    expect(suggestActivityLevel(logs, "moderate")).toBeNull();
  });

  it("suggests 'active' when declared 'sedentary' but training far more than expected", () => {
    // One log per day for all 14 days in the window = 7/week average,
    // well above sedentary's 0-1 range.
    const logs = Array.from({ length: 14 }, (_, i) => log(dayInWindow(i)));
    expect(suggestActivityLevel(logs, "sedentary")).toBe("active");
  });

  it("suggests 'sedentary' when declared 'active' but barely training", () => {
    // A single log across the whole 14-day window = 0.5/week, below active's 4+ range.
    const logs = [log(dayInWindow(5))];
    expect(suggestActivityLevel(logs, "active")).toBe("sedentary");
  });

  it("ignores logs from the current, possibly-partial week", () => {
    // Only a log from today (this week) — the lookback window excludes it entirely,
    // so with zero logs in the window, "sedentary" (0-1 expected) is not flagged.
    const logs = [log(new Date())];
    expect(suggestActivityLevel(logs, "sedentary")).toBeNull();
  });

  it("ignores logs older than the lookback window", () => {
    const old = new Date(startOfThisWeek());
    old.setDate(old.getDate() - 90);
    const logs = [log(old)];
    expect(suggestActivityLevel(logs, "sedentary")).toBeNull();
  });
});

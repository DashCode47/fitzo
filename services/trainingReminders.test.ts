jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("expo-notifications", () => ({}));

import { streakReminderDates } from "./trainingReminders";

// Wednesday 2026-09-30, 10:00 local time
const wed10am = new Date(2026, 8, 30, 10);

describe("streakReminderDates", () => {
  it("returns 19:00 on scheduled weekdays within the next 7 days", () => {
    const dates = streakReminderDates([1, 3], wed10am, false); // Mon, Wed
    expect(dates.map((d) => [d.getDate(), d.getHours()])).toEqual([
      [30, 19], // today (Wed)
      [5, 19], // next Mon (Oct 5)
    ]);
  });

  it("skips today once the user checked in", () => {
    const dates = streakReminderDates([3], wed10am, true);
    expect(dates).toEqual([]);
  });

  it("skips today when 19:00 already passed", () => {
    const dates = streakReminderDates([3], new Date(2026, 8, 30, 20), false);
    expect(dates).toEqual([]);
  });
});

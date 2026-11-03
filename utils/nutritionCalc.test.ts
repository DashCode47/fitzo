import { calculateCalories } from "./nutritionCalc";

describe("calculateCalories macros", () => {
  it("splits target calories into protein/fat/carbs grams", () => {
    // M, 78kg, 178cm, 30y, moderate, cut → BMR 1747.5, TDEE 2708.625, target 2209
    const { calories, macros } = calculateCalories(78, 178, 30, "M", "moderate", "cut");
    expect(calories).toBe(2209);
    expect(macros).toEqual({ protein: 156, fat: 61, carbs: 259 });
    // Macro kcal stay within rounding of the target
    expect(Math.abs(macros.protein * 4 + macros.fat * 9 + macros.carbs * 4 - calories)).toBeLessThanOrEqual(10);
  });

  it("never returns negative carbs", () => {
    const { macros } = calculateCalories(150, 150, 80, "F", "sedentary", "cut");
    expect(macros.carbs).toBeGreaterThanOrEqual(0);
  });
});

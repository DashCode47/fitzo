/**
 * Calculates daily target calories based on the Mifflin-St Jeor formula
 * and applies safety overrides for users with high BMI (Obesity).
 * 
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'M' or 'F'
 * @param activityLevel - 'sedentary', 'moderate', 'active'
 * @param userSelectedGoal - 'cut' (lose weight), 'bulk' (gain muscle), 'maintain' (maintenance)
 * @returns Object containing estimated daily calories and the final adjusted goal
 */
export const calculateCalories = (
  weight: number,
  height: number,
  age: number,
  gender: 'M' | 'F',
  activityLevel: 'sedentary' | 'moderate' | 'active',
  userSelectedGoal: 'cut' | 'bulk' | 'maintain'
): { calories: number; finalGoal: 'cut' | 'bulk' | 'maintain'; isOverridden: boolean } => {
  
  // 1. Calculate BMI
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  // 2. Safety Override
  let finalGoal = userSelectedGoal;
  let isOverridden = false;

  // If obese (BMI >= 30), force cut/maintain for health safety
  if (bmi >= 30) {
    if (userSelectedGoal === 'bulk') {
      finalGoal = 'cut';
      isOverridden = true;
    }
  }

  // 3. Mifflin-St Jeor Formula (More accurate for overweight/obese populations)
  let bmr = 0;
  if (gender === 'M') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 4. Activity Factor
  const activityMultipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  // 5. Apply Final Goal
  let calories = 0;
  if (finalGoal === 'cut') {
    calories = Math.round(tdee - 500); 
  } else if (finalGoal === 'bulk') {
    calories = Math.round(tdee + 300);
  } else {
    calories = Math.round(tdee);
  }

  return { calories, finalGoal, isOverridden };
};

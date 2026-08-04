export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/',
  HOME: '/(tabs)/home',
  STATS: '/(tabs)/stats',
  NUTRITION: '/(tabs)/nutrition',
  PROFILE: '/profile',
  SCANNER: '/scanner',
  RANKINGS: '/rankings',
  ROUTINES: '/(tabs)/routines',
  ROUTINE_DETAIL: '/routine-detail',
  ROUTINE_CREATE: '/routine-create',
  WORKOUT_SESSION: '/workout-session',
  SCHEDULE_EDIT: '/schedule-edit',
  EXERCISE_PROGRESS: '/exercise-progress',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

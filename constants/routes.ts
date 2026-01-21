export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/',
  HOME: '/(tabs)/home',
  STORE: '/(tabs)/store',
  NUTRITION: '/(tabs)/nutrition',
  PROFILE: '/profile',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

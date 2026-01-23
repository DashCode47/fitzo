export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/',
  HOME: '/(tabs)/home',
  STORE: '/(tabs)/store',
  NUTRITION: '/(tabs)/nutrition',
  PROFILE: '/profile',
  SCANNER: '/scanner',
  RANKINGS: '/rankings',
  LOCATION_PERMISSION: '/location-permission',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

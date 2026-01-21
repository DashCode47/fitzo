import { ROUTES } from '@/constants/routes';
import { useRouter } from 'expo-router';

export const useAppNavigation = () => {
  const router = useRouter();

  const goToOnboarding = () => router.replace(ROUTES.ONBOARDING);
  const goToLogin = () => router.replace(ROUTES.LOGIN);
  const goToRegister = () => router.push(ROUTES.REGISTER);
  const goToHome = () => router.replace(ROUTES.HOME);
  const goToStore = () => router.replace(ROUTES.STORE);
  const goToNutrition = () => router.replace(ROUTES.NUTRITION);
  const goToProfile = () => router.push(ROUTES.PROFILE);
  const goBack = () => router.back();

  return {
    router,
    goToOnboarding,
    goToLogin,
    goToRegister,
    goToHome,
    goToStore,
    goToNutrition,
    goToProfile,
    goBack,
  };
};

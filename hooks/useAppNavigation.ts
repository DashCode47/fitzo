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
  const goToRankings = () => router.push(ROUTES.RANKINGS);
  const goToScanner = () => router.push(ROUTES.SCANNER);
  const goToLocationPermission = () => router.push(ROUTES.LOCATION_PERMISSION);
  const goToRoutines = () => router.replace(ROUTES.ROUTINES);
  const goToRoutineDetail = (id: number) => router.push({ pathname: ROUTES.ROUTINE_DETAIL, params: { id } });
  const goToRoutineCreate = () => router.push(ROUTES.ROUTINE_CREATE);
  const goToWorkoutSession = () => router.push(ROUTES.WORKOUT_SESSION);
  const goToScheduleEdit = (day: number) => router.push({ pathname: ROUTES.SCHEDULE_EDIT, params: { day } });
  const goToExerciseProgress = (id: number) => router.push({ pathname: ROUTES.EXERCISE_PROGRESS, params: { id } });

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
    goToRankings,
    goToScanner,
    goToLocationPermission,
    goToRoutines,
    goToRoutineDetail,
    goToRoutineCreate,
    goToWorkoutSession,
    goToScheduleEdit,
    goToExerciseProgress,
  };
};

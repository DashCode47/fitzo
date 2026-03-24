import { useAppStore } from '@/store/useAppStore';
import { getTheme, ThemeMode, AppTheme } from '@/constants/theme';

/**
 * Hook to access the current theme reactive to the store.
 */
export function useAppTheme(): AppTheme {
  const mode = useAppStore(state => state.themeMode);
  return getTheme(mode);
}

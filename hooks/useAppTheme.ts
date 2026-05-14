import { useThemeStore } from '../store/themeStore';
import { colors, darkColors } from '../constants/theme';

export function useAppTheme() {
  const { isDark, toggleTheme, setDark } = useThemeStore();
  return {
    colors: isDark ? darkColors : colors,
    isDark,
    toggleTheme,
    setDark,
  };
}

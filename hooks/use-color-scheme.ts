// src/hooks/use-color-scheme.ts
import { useThemeContext } from '@/context/ThemeContext';

export function useColorScheme() {
  const { theme } = useThemeContext();
  return theme;
}

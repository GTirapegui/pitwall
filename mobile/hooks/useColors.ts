import { Dark, Light } from '@/constants/colors';
import { useTheme } from './useTheme';

// Return the token set for the active theme.
// Use `typeof Dark` so both themes share the same structural type.
export function useColors(): typeof Dark {
  const { theme } = useTheme();
  return (theme === 'dark' ? Dark : Light) as typeof Dark;
}

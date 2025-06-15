import { useTheme } from "@/components/ThemeContext";
export function useColorScheme() {
  const { theme } = useTheme();
  return theme;
}

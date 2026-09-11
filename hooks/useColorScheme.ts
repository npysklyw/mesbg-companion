import { useTheme } from "@/components/ThemeContext";
export function useColorScheme() {
  const { mode } = useTheme();
  return mode;
}

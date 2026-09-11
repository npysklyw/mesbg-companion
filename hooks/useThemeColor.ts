/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { ThemeColors, useTheme } from "@/components/ThemeContext";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors,
) {
  const { themeColors, mode } = useTheme();

  if (mode === "light" && props.light) return props.light;
  if (mode === "dark" && props.dark) return props.dark;

  return themeColors[colorName] ?? "#fff";
}

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsProvider } from "@/components/SettingsContext";
import { ThemeProvider as CustomThemeProvider } from "@/components/ThemeContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loaded] = useFonts({
    brioso: require("../assets/fonts/EBGaramond-Regular.ttf"),
    briosoBold: require("../assets/fonts/EBGaramond-Bold.ttf"),
    briosoUberBold: require("../assets/fonts/EBGaramond-ExtraBold.ttf"),
  });
  // const [loaded] = useFonts({
  //   brioso: require("../assets/fonts/BriosoPro-Semibold.ttf"),
  //   // add other fonts here if needed
  // });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SettingsProvider>
      <CustomThemeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}

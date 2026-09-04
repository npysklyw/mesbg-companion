import { ColorPalettes } from "@/constants/ColorPalettes";
import * as FileSystem from "expo-file-system/legacy";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Palette = keyof typeof ColorPalettes;
export type Mode = "light" | "dark";
export type ThemeColors = (typeof ColorPalettes)[Palette][Mode];

type ThemeContextType = {
  palette: Palette;
  mode: Mode;
  setPalette: (palette: Palette) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  palettes: Palette[];
  themeColors: ThemeColors;
};

const palettes = Object.keys(ColorPalettes) as Palette[];

// Helper to always get a valid themeColors object
function getThemeColors(palette: Palette, mode: Mode) {
  return (
    (ColorPalettes[palette] && ColorPalettes[palette][mode]) ||
    ColorPalettes["blue"].light // fallback
  );
}

const ThemeContext = createContext<ThemeContextType>({
  palette: "blue",
  mode: "light",
  setPalette: () => {},
  setMode: () => {},
  toggleMode: () => {},
  palettes,
  themeColors: getThemeColors("blue", "light"),
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const defaultPalette: Palette = "blue";
  const defaultMode: Mode = "light";
  const [palette, setPalette] = useState<Palette>(defaultPalette);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const fileUri = FileSystem.documentDirectory + "app-theme.json";
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          const parsed = JSON.parse(content) as {
            palette?: string;
            mode?: string;
          };

          const parsedPalette = parsed.palette as Palette | undefined;
          const parsedMode = parsed.mode as Mode | undefined;

          if (parsedPalette && ColorPalettes[parsedPalette]) {
            setPalette(parsedPalette);
          }
          if (parsedMode === "light" || parsedMode === "dark") {
            setMode(parsedMode);
          }
        }
      } catch (e) {
        console.error("Failed to load theme:", e);
      } finally {
        setLoaded(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const saveTheme = async () => {
      try {
        const fileUri = FileSystem.documentDirectory + "app-theme.json";
        await FileSystem.writeAsStringAsync(
          fileUri,
          JSON.stringify({ palette, mode }, null, 2),
        );
      } catch (e) {
        console.error("Failed to save theme:", e);
      }
    };

    saveTheme();
  }, [palette, mode, loaded]);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));

  const themeColors = getThemeColors(palette, mode);

  return (
    <ThemeContext.Provider
      value={{
        palette,
        mode,
        setPalette,
        setMode,
        toggleMode,
        palettes,
        themeColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

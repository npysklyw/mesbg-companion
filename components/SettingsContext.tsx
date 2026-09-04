import * as FileSystem from "expo-file-system/legacy";
import React, { createContext, useContext, useEffect, useState } from "react";

type AppSettings = {
  legacyProfilesEnabled: boolean;
  compactModeEnabled: boolean;
  largeTextEnabled: boolean;
};

type SettingsContextType = {
  settings: AppSettings;
  toggleLegacyProfiles: () => void;
  toggleCompactMode: () => void;
  toggleLargeText: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const defaultSettings: AppSettings = {
    legacyProfilesEnabled: false,
    compactModeEnabled: false,
    largeTextEnabled: false,
  };
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fileUri = FileSystem.documentDirectory + "app-settings.json";
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          const loadedSettings = JSON.parse(content);
          setSettings({ ...defaultSettings, ...loadedSettings });
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, []);

  // Save settings whenever they change
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const fileUri = FileSystem.documentDirectory + "app-settings.json";
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(newSettings, null, 2),
      );
      setSettings(newSettings);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const toggleLegacyProfiles = () => {
    const newSettings = {
      ...settings,
      legacyProfilesEnabled: !settings.legacyProfilesEnabled,
    };
    saveSettings(newSettings);
  };

  const toggleCompactMode = () => {
    const newSettings = {
      ...settings,
      compactModeEnabled: !settings.compactModeEnabled,
    };
    saveSettings(newSettings);
  };

  const toggleLargeText = () => {
    const newSettings = {
      ...settings,
      largeTextEnabled: !settings.largeTextEnabled,
    };
    saveSettings(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        toggleLegacyProfiles,
        toggleCompactMode,
        toggleLargeText,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

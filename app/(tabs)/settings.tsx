import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useSettings } from "@/components/SettingsContext";
import { useTheme } from "@/components/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import SettingsButton from "@/components/ui/Settings/SettingsButton";
import DropdownTheme from "@/components/ui/Settings/ThemeDropdown";
import { Button, Switch } from "@rneui/themed";
import { StyleSheet, View } from "react-native";

export default function Settings() {
  const { mode, toggleMode, themeColors } = useTheme();
  const { settings, toggleLegacyProfiles, toggleLargeText } = useSettings();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <View style={{ gap: 8, marginBottom: 16 }}>
        <ThemedText type="subtitle" style={{ color: themeColors.text }}>
          Theme Settings
        </ThemedText>

        <DropdownTheme />
      </View>

      <Button
        onPress={toggleMode}
        buttonStyle={{ backgroundColor: themeColors.button }}
        titleStyle={{ color: themeColors.buttonText, fontFamily: "brioso" }}
        style={{ marginBottom: 12 }}
      >
        Toggle Mode (Current: {mode})
      </Button>
      <ThemedText type="subtitle" style={{ color: themeColors.text }}>
        Game Settings
      </ThemedText>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <ThemedText
          style={{
            color: themeColors.text,
            fontSize: 16,
            fontFamily: "brioso",
          }}
        >
          Enable Legacy Profiles
        </ThemedText>
        <Switch
          value={settings.legacyProfilesEnabled}
          onValueChange={toggleLegacyProfiles}
          color={themeColors.button}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <ThemedText
          style={{
            color: themeColors.text,
            fontSize: 16,
            fontFamily: "brioso",
          }}
        >
          Enable Larger Text
        </ThemedText>
        <Switch
          value={settings.largeTextEnabled}
          onValueChange={toggleLargeText}
          color={themeColors.button}
        />
      </View>

      <SettingsButton
        name="Support the Dev"
        onPress={() => console.log("DEV")}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});

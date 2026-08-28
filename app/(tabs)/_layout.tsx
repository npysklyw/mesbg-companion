import { HapticTab } from "@/components/HapticTab";
import { useTheme } from "@/components/ThemeContext";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        // tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: themeColors.background, // <-- use tabBarBackground here
          },
          android: {
            backgroundColor: themeColors.background, // <-- use tabBarBackground here
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom, // Adjust height for bottom padding
          },
        }),
        tabBarLabelStyle: {
          color: themeColors.text,
          fontFamily: "brioso",
          fontSize: 14,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="book.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="newArmy"
        options={{
          title: "Army Workshop",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hammer.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gameTrack"
        options={{
          title: "Game Tracker",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="die.face.1.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="armyBuilder"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="armyList"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="heroTrack"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

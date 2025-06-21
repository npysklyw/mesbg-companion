import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: themeColors.tabBarBackground,
            borderTopColor: themeColors.border,
          },
          default: {
            backgroundColor: themeColors.tabBarBackground,
            borderTopColor: themeColors.border,
          },
        }),
        tabBarLabelStyle: {
          color: themeColors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="book.pages.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: "Army Workshop",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hammer.fill" color={color} />
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
    </Tabs>
  );
}

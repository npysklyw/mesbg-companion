import { StyleSheet, Text, type TextProps } from "react-native";

import { useSettings } from "@/components/SettingsContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const { settings } = useSettings();
  const scale = settings.largeTextEnabled ? 1.15 : 1;

  const scaleStyle = (input?: { fontSize?: number; lineHeight?: number }) => {
    if (!input) return input;
    return {
      ...input,
      fontSize: input.fontSize ? input.fontSize * scale : input.fontSize,
      lineHeight: input.lineHeight
        ? input.lineHeight * scale
        : input.lineHeight,
    };
  };

  return (
    <Text
      style={[
        { color },
        type === "default" ? scaleStyle(styles.default) : undefined,
        type === "title" ? scaleStyle(styles.title) : undefined,
        type === "defaultSemiBold"
          ? scaleStyle(styles.defaultSemiBold)
          : undefined,
        type === "subtitle" ? scaleStyle(styles.subtitle) : undefined,
        type === "link" ? scaleStyle(styles.link) : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "brioso",
  },
  title: {
    fontSize: 32,
    fontFamily: "briosoUberBold",
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "brioso",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});

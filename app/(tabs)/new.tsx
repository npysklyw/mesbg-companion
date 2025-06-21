import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@rneui/themed";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";

export default function TabTwoScreen() {
  const primaryColor = useThemeColor({}, "button");
  const textColor = useThemeColor({}, "buttonText");
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
        <ThemedText type="title">Create New Army</ThemedText>
      </ThemedView>

      <Link
        href={{ pathname: "/armyList", params: { armyType: "good" } }}
        asChild
      >
        <Button
          buttonStyle={{ backgroundColor: primaryColor }} // for "Reset" or destructive actions
          titleStyle={{ color: textColor }}
        >
          Good Army
        </Button>
      </Link>

      <Link
        href={{ pathname: "/armyList", params: { armyType: "evil" } }}
        asChild
      >
        <Button
          buttonStyle={{ backgroundColor: primaryColor }} // for "Reset" or destructive actions
          titleStyle={{ color: textColor }}
        >
          Evil Army
        </Button>
      </Link>
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

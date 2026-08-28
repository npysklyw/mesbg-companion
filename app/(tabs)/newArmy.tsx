import FantasyChoiceButton from "@/components/ui/ArmyBuilder/ButtonChoice";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet } from "react-native";

export default function NewArmy() {
  const textColor = useThemeColor({}, "buttonText");
  const goodButtonColor = useThemeColor({}, "buttonGood");
  const evilButtonColor = useThemeColor({}, "buttonEvil");

  return (
    // <ParallaxScrollView
    //   headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
    //   headerImage={
    //     <IconSymbol
    //       size={310}
    //       color="#808080"
    //       name="chevron.left.forwardslash.chevron.right"
    //       style={styles.headerImage}
    //     />
    //   }
    // >
    //   <ThemedView style={styles.titleContainer}>
    //     <ThemedText type="title">Create New Army</ThemedText>
    //   </ThemedView>

    //   {/* <Link
    //     href={{ pathname: "/armyList", params: { armyType: "good" } }}
    //     asChild
    //   >
    //     <Button
    //       buttonStyle={{ backgroundColor: goodButtonColor }} // for "Reset" or destructive actions
    //       titleStyle={{
    //         color: textColor,
    //         fontFamily: "brioso",
    //         fontSize: 20,
    //       }}
    //     >
    //       Good Army
    //     </Button>
    //   </Link> */}

    //   {/* <Link
    //     href={{ pathname: "/armyList", params: { armyType: "evil" } }}
    //     asChild
    //   >
    //     <Button
    //       buttonStyle={{ backgroundColor: evilButtonColor }} // for "Reset" or destructive actions
    //       titleStyle={{ color: textColor, fontFamily: "brioso", fontSize: 20 }}
    //     >
    //       Evil Army
    //     </Button>
    //   </Link> */}
    //   <FantasyChoiceButton />
    // </ParallaxScrollView>

    <FantasyChoiceButton />
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

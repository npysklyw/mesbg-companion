import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ListItem } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import TouchableScale from "react-native-touchable-scale";

import { useThemeColor } from "@/hooks/useThemeColor";

import evilArmies from "../data/evilArmies.json";
import goodArmies from "../data/goodArmies.json";

type Wargear = {
  name?: string;
  cost?: number;
};

// const goodArmiesa = [
//   {
//     name: "Walls of Minas Tirith",
//     faction: "Gondor",
//     heroes: [
//       {
//         name: "Aragorn",
//         points: 200,
//         tier: "legend",
//         wargear: [
//           { name: "horse", cost: 20 },
//           { name: "lance", cost: 20 } as Wargear,
//         ],
//       },

//       {
//         name: "Ingold",
//         points: 65,
//         tier: "fortitude",
//         wargear: [{} as Wargear],
//       },
//       {
//         name: "Boromir",
//         points: 165,
//         tier: "valour",
//         wargear: [{ name: "shield", cost: 5 } as Wargear],
//       },
//       {
//         name: "Faramir",
//         tier: "valour",
//         points: 80,
//         wargear: [{ name: "bow", cost: 10 } as Wargear],
//       },
//       {
//         name: "Damrod",
//         points: 50,
//         wargear: [{} as Wargear],
//       },
//       {
//         name: "Madril",
//         points: 60,
//         wargear: [{} as Wargear],
//       },
//       {
//         name: "Madril (Armored)",
//         points: 70,
//         wargear: [{} as Wargear],
//       },
//       // ...other heroes
//     ],
//     warbandOptions: [
//       {
//         name: "Minas Tirith Warrior",
//         baseCost: 8,
//         availableWargear: [
//           { name: "Shield", cost: 1 } as Wargear,
//           { name: "Spear and Shield", cost: 2 } as Wargear,
//           { name: "Bow", cost: 1 } as Wargear,
//         ],
//       },
//       {
//         name: "Ithilien Ranger",
//         baseCost: 8,
//         availableWargear: [{ name: "Spear", cost: 1 } as Wargear],
//       },
//       {
//         name: "Gondor Knight",
//         baseCost: 14,
//         availableWargear: [{} as Wargear],
//       },
//       {
//         name: "Fountain Guard",
//         baseCost: 10,
//         availableWargear: [{} as Wargear],
//       },
//       {
//         name: "Citadel Guard",
//         baseCost: 9,
//         availableWargear: [
//           { name: "Bow", cost: 1 },
//           { name: "Spear", cost: 1 } as Wargear,
//         ],
//       },
//       // ...other warriors
//     ],
//   },
//   {
//     name: "Mirkwood Host",
//     faction: "Mirkwood",
//     heroes: [
//       {
//         name: "Thranduil, King of the Woodland Realm",
//         points: 140,
//         tier: "legend",
//         wargear: [
//           { name: "Heavy Armour", cost: 10 },
//           { name: "Elven Cloak", cost: 5 },
//           { name: "Circlet of Kings", cost: 25 },
//           { name: "Horse", cost: 10 },
//           { name: "Elk", cost: 20 },
//           { name: "Sword", cost: 0 },
//           { name: "Bow", cost: 5 },
//         ],
//       },
//       {
//         name: "Legolas Greenleaf",
//         points: 100,
//         tier: "valour",
//         wargear: [
//           { name: "Elven Cloak", cost: 10 },
//           { name: "Armoured Horse", cost: 15 },
//           { name: "Knife", cost: 0 },
//         ],
//       },
//       {
//         name: "Tauriel",
//         points: 85,
//         tier: "valour",
//         wargear: [
//           { name: "Elven Cloak", cost: 5 },
//           { name: "Bow", cost: 5 },
//           { name: "Knife", cost: 0 },
//         ],
//       },
//       {
//         name: "Palace Guard Captain",
//         points: 60,
//         tier: "fortitude",
//         wargear: [
//           { name: "Shield", cost: 5 },
//           { name: "Spear", cost: 1 },
//           { name: "Elven Cloak", cost: 5 },
//         ],
//       },
//       {
//         name: "Mirkwood Captain",
//         points: 70,
//         tier: "fortitude",
//         wargear: [
//           { name: "Bow", cost: 5 },
//           { name: "Elven Cloak", cost: 5 },
//           { name: "Sword", cost: 0 },
//         ],
//       },
//     ],
//     warbandOptions: [
//       {
//         name: "Palace Guard",
//         baseCost: 11,
//         availableWargear: [
//           { name: "Shield", cost: 1 },
//           { name: "Spear", cost: 1 },
//           { name: "Elven Cloak", cost: 2 },
//         ],
//       },
//       {
//         name: "Mirkwood Elf Warrior",
//         baseCost: 9,
//         availableWargear: [
//           { name: "Bow", cost: 1 },
//           { name: "Spear", cost: 1 },
//           { name: "Elven Cloak", cost: 2 },
//         ],
//       },
//       {
//         name: "Mirkwood Cavalry",
//         baseCost: 18,
//         availableWargear: [
//           { name: "Shield", cost: 1 },
//           { name: "Elven Cloak", cost: 2 },
//         ],
//       },
//       {
//         name: "Mirkwood Ranger",
//         baseCost: 8,
//         availableWargear: [
//           { name: "Bow", cost: 1 },
//           { name: "Elven Cloak", cost: 2 },
//         ],
//       },
//     ],
//   },
// ];

export default function HomeScreen() {
  const { armyType } = useLocalSearchParams();
  const router = useRouter();

  const armiesToRender = armyType === "good" ? goodArmies : evilArmies;

  // Get themed colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

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
      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {armyType === "good" ? "Armies of Good" : "Armies of Evil"}
          </ThemedText>
        </ThemedView>
        {armiesToRender.map((army, idx) => (
          <ListItem
            key={`${army.name}-${idx}`}
            Component={TouchableScale}
            friction={90}
            tension={100}
            activeScale={0.95}
            onPress={() =>
              router.push({
                pathname: "/armyBuilder",
                params: { armyName: army.name, armyType },
              })
            }
            containerStyle={{ backgroundColor }} // <-- Themed background
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: textColor }}>
                {army.name}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 150,
    width: 400,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});

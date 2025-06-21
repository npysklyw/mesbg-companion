import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Hero } from "@/components/ui/Hero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/base";
import React, { useState } from "react";
import evilArmies from "../data/evilArmies.json";
import goodArmies from "../data/goodArmies.json";

type Wargear = {
  name?: string;
  cost?: number;
};

type SelectedWargear = { name: string; cost: number };

type HeroTier = "legend" | "valour" | "fortitude";

type ActiveWarriorOption = {
  name: string;
  baseCost: number;
  availableWargear: { name: string; cost: number }[];
  wargearCounts: { [option: string]: number };
};

type ActiveHero = {
  name: string;
  points: number;
  tier: "legend" | "valour" | "fortitude";
  wargear: { name: string; cost: number }[];
  wargearChecks: { [option: string]: boolean };
  selected: boolean;
  warband: ActiveWarriorOption[]; // <-- Each hero gets their own warband
};

type ActiveArmy = {
  name: string;
  faction: string;
  heroes: ActiveHero[];
  warbandOptions: ActiveWarriorOption[];
};

const armyTemplate = {
  name: "Mordor Horde",
  faction: "Mordor",
  heroes: [
    {
      name: "The Witch-king of Angmar",
      points: 150,
      tier: "legend",
      wargear: [
        { name: "Crown of Morgul", cost: 25 },
        { name: "Fell Beast", cost: 50 },
      ],
    },
    {
      name: "Gothmog",
      points: 120,
      tier: "valour",
      wargear: [
        { name: "Warg", cost: 10 },
        { name: "Shield", cost: 5 },
      ],
    },
    {
      name: "Orc Captain",
      points: 45,
      tier: "fortitude",
      wargear: [
        { name: "Shield", cost: 5 },
        { name: "Warg", cost: 10 },
      ],
    },
    {
      name: "Shagrat",
      points: 90,
      tier: "valour",
      wargear: [{ name: "Shield", cost: 5 }],
    },
    {
      name: "Gorbag",
      points: 60,
      tier: "fortitude",
      wargear: [{ name: "Shield", cost: 5 }],
    },
    // ...other heroes
  ],
  warbandOptions: [
    {
      name: "Mordor Orc Warrior",
      baseCost: 5,
      availableWargear: [
        { name: "Shield", cost: 1 },
        { name: "Spear", cost: 1 },
        { name: "Bow", cost: 1 },
      ],
    },
    {
      name: "Morannon Orc",
      baseCost: 6,
      availableWargear: [
        { name: "Shield", cost: 1 },
        { name: "Spear", cost: 1 },
      ],
    },
    {
      name: "Black Númenórean",
      baseCost: 9,
      availableWargear: [],
    },
    {
      name: "Warg Rider",
      baseCost: 11,
      availableWargear: [
        { name: "Throwing Spear", cost: 1 },
        { name: "Shield", cost: 1 },
      ],
    },
    {
      name: "Morgul Stalker",
      baseCost: 8,
      availableWargear: [],
    },
    // ...other warriors
  ],
};

// const armyTemplate = {
//   name: "Walls of Minas Tirith",
//   faction: "Gondor",
//   heroes: [
//     {
//       name: "Aragorn",
//       points: 200,
//       tier: "legend",
//       wargear: [
//         { name: "horse", cost: 20 },
//         { name: "lance", cost: 20 } as Wargear,
//       ],
//     },

//     {
//       name: "Ingold",
//       points: 65,
//       tier: "fortitude",
//       wargear: [{} as Wargear],
//     },
//     {
//       name: "Boromir",
//       points: 165,
//       tier: "valour",
//       wargear: [{ name: "shield", cost: 5 } as Wargear],
//     },
//     {
//       name: "Faramir",
//       tier: "valour",
//       points: 80,
//       wargear: [{ name: "bow", cost: 10 } as Wargear],
//     },
//     {
//       name: "Damrod",
//       points: 50,
//       wargear: [{} as Wargear],
//     },
//     {
//       name: "Madril",
//       points: 60,
//       wargear: [{} as Wargear],
//     },
//     {
//       name: "Madril (Armored)",
//       points: 70,
//       wargear: [{} as Wargear],
//     },
//     // ...other heroes
//   ],
//   warbandOptions: [
//     {
//       name: "Minas Tirith Warrior",
//       baseCost: 8,
//       availableWargear: [
//         { name: "Shield", cost: 1 } as Wargear,
//         { name: "Spear and Shield", cost: 2 } as Wargear,
//         { name: "Bow", cost: 1 } as Wargear,
//       ],
//     },
//     {
//       name: "Ithilien Ranger",
//       baseCost: 8,
//       availableWargear: [{ name: "Spear", cost: 1 } as Wargear],
//     },
//     {
//       name: "Gondor Knight",
//       baseCost: 14,
//       availableWargear: [{} as Wargear],
//     },
//     {
//       name: "Fountain Guard",
//       baseCost: 10,
//       availableWargear: [{} as Wargear],
//     },
//     {
//       name: "Citadel Guard",
//       baseCost: 9,
//       availableWargear: [
//         { name: "Bow", cost: 1 },
//         { name: "Spear", cost: 1 } as Wargear,
//       ],
//     },
//     // ...other warriors
//   ],
// };

export default function HomeScreen() {
  const { armyName, armyType } = useLocalSearchParams();

  // Find the correct army template
  const armyList = armyType === "good" ? goodArmies : evilArmies;
  const selectedArmy = armyList.find((a) => a.name === armyName);
  const templateArmy = selectedArmy || armyList[0] || goodArmies[0];

  // If no army is available, show a message instead of rendering the builder
  if (!templateArmy) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText type="title">No army data available.</ThemedText>
      </ThemedView>
    );
  }

  const [army, setArmy] = React.useState(templateArmy);
  const [point, setPoints] = React.useState(0);
  const [activeArmy, setActiveArmy] = useState<ActiveArmy>(
    createActiveArmyFromTemplate(templateArmy)
  );

  function createActiveArmyFromTemplate(template: typeof armyTemplate) {
    return {
      name: template.name,
      faction: template.faction,
      heroes: template.heroes.map((hero) => ({
        ...hero,
        selected: false,
        wargear: hero.wargear.map((wg) => ({
          name: wg.name ?? "",
          cost: wg.cost ?? 0,
        })),
        wargearChecks: hero.wargear.reduce((acc, wg) => {
          if (wg.name) acc[wg.name] = false;
          return acc;
        }, {} as { [key: string]: boolean }),
        warband: template.warbandOptions.map((option) => ({
          name: option.name,
          baseCost: option.baseCost,
          availableWargear: option.availableWargear
            .filter(
              (wg) =>
                wg && typeof wg.name === "string" && typeof wg.cost === "number"
            )
            .map((wg) => ({
              name: wg.name as string,
              cost: wg.cost as number,
            })),
          wargearCounts: {
            Base: 0,
            ...option.availableWargear.reduce((acc, wg) => {
              if (wg.name) acc[wg.name] = 0;
              return acc;
            }, {} as { [key: string]: number }),
          },
        })),
      })),
    };
  }

  const incrementPoints = (value: number) => {
    setPoints((prevPoints) => prevPoints + value);
  };
  const decrementPoints = (value: number) => {
    setPoints((prevPoints) => Math.max(prevPoints - value, 0));
  };

  // Add state for editable army name
  const [editableArmyName, setEditableArmyName] = useState(templateArmy.name);

  // When resetting, also reset the editable name
  const handleReset = () => {
    setPoints(0);
    setActiveArmy(createActiveArmyFromTemplate(templateArmy));
    setEditableArmyName(templateArmy.name);
  };

  // Save active army as JSON locally on device
  const handleSaveArmy = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + "saved-army.json";
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify({ ...activeArmy, name: editableArmyName }, null, 2)
      );
      alert("Army saved to device!");
    } catch (e) {
      alert("Failed to save army: " + e);
    }
  };

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
          <TextInput
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#333",
              backgroundColor: "#eee",
              borderRadius: 6,
              paddingHorizontal: 8,
              marginRight: 8,
              minWidth: 120,
              flex: 1,
            }}
            value={editableArmyName}
            onChangeText={setEditableArmyName}
            placeholder="Army Name"
            maxLength={40}
          />
          <ThemedText type="title">- {point} pts</ThemedText>
        </ThemedView>
        <Button
          color="error"
          style={{ marginVertical: 12 }}
          onPress={handleReset}
        >
          Reset
        </Button>
        {activeArmy.heroes.map((hero, idx) => {
          // Find the warband number for this hero among selected heroes
          const selectedHeroes = activeArmy.heroes.filter((h) => h.selected);
          const warbandNumber = hero.selected
            ? selectedHeroes.findIndex((h) => h.name === hero.name) + 1
            : null;

          return (
            <Hero
              key={hero.name}
              name={hero.name}
              points={hero.points}
              checked={hero.selected}
              wargear={hero.wargear.map((wg) => [wg.name, wg.cost])}
              wargearChecks={hero.wargearChecks}
              armyUpdate={setActiveArmy}
              setPoints={setPoints}
              warbandNumber={warbandNumber}
              tier={hero.tier}
              warband={hero.warband} // <-- pass the hero's own warband
            />
          );
        })}
      </ThemedView>
      <Button onPress={handleSaveArmy}>Save</Button>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});

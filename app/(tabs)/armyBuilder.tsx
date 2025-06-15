import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Hero } from "@/components/ui/Hero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/base";
import React from "react";

type WargearChecks = {
  [key: string]: boolean;
};

const armyTemplate = {
  name: "Walls of Minas Tirith",
  points: 800,
  faction: "Gondor",
  heroes: [
    {
      name: "Aragorn",
      points: 200,
      wargear: [{ name: "horse", cost: 20 }],
      wargearChecks: { horse: false } as WargearChecks,
      warband: [
        {
          name: "Minas Tirith Warrior",
          baseCost: 8,
          availableWargear: [
            { name: "shield", cost: 1 },
            { name: "spear", cost: 1 },
          ],
          selectedWargear: {
            shield: 5, // user selected 5 shields
            spear: 3, // user selected 3 spears
          },
          count: 8,
        },
        // ...other warriors
      ],
    },
    {
      name: "Ingold",
      points: 200,
      wargear: [{ name: "horse", cost: 20 }],
      wargearChecks: { horse: false } as WargearChecks,
      warband: [
        {
          name: "Minas Tirith Warrior",
          baseCost: 8,
          availableWargear: [
            { name: "shield", cost: 1 },
            { name: "spear", cost: 1 },
          ],
          selectedWargear: {
            shield: 5, // user selected 5 shields
            spear: 3, // user selected 3 spears
          },
          count: 8,
        },
        // ...other warriors
      ],
    },
    // ...other heroes
  ],
};

export default function HomeScreen() {
  const [army, setArmy] = React.useState(armyTemplate);
  const [point, setPoints] = React.useState(0);

  const incrementPoints = (value: number) => {
    setPoints((prevPoints) => prevPoints + value);
  };
  const decrementPoints = (value: number) => {
    setPoints((prevPoints) => Math.max(prevPoints - value, 0));
  };

  const handleToggleHero = (idx: number) => {
    setArmy((prev) => ({
      ...prev,
      heroes: prev.heroes.map((hero, i) =>
        i === idx ? { ...hero, checked: !hero.checked } : hero
      ),
    }));
  };

  const handleToggleHeroWargear = (heroIdx: number, option: string) => {
    setArmy((prev) => ({
      ...prev,
      heroes: prev.heroes.map((hero, i) =>
        i === heroIdx
          ? {
              ...hero,
              wargearChecks: {
                ...hero.wargearChecks,
                [option]: !hero.wargearChecks[option],
              },
            }
          : hero
      ),
    }));
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
      {/* Reset Button at the top */}

      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Minas Tirith Army - {point} pts</ThemedText>
        </ThemedView>
        <Button
          color="error"
          style={{ marginVertical: 12 }}
          onPress={() => setPoints(0)}
        >
          Reset
        </Button>
        {army.heroes.map((hero, idx) => (
          <Hero
            key={hero.name}
            name={hero.name}
            points={hero.points}
            wargear={hero.wargear?.map((w) => [w.name, w.cost])}
            checked={hero.checked}
            wargearChecks={hero.wargearChecks}
            onToggleChecked={() => handleToggleHero(idx)}
            onToggleWargear={(option) => handleToggleHeroWargear(idx, option)}
            incrementPoints={incrementPoints}
            decrementPoints={decrementPoints}
          />
        ))}
      </ThemedView>
      <Button>Save</Button>
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

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Hero } from "@/components/ui/Hero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button } from "@rneui/base";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import evilArmies from "../data/evilArmies.json";
import goodArmies from "../data/goodArmies.json";

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
  warband: ActiveWarriorOption[];
};

type ActiveArmy = {
  name: string;
  faction: string;
  heroes: ActiveHero[];
  warbandOptions: ActiveWarriorOption[];
};

export default function HomeScreen() {
  const { savedArmyIdx, armyName, armyType } = useLocalSearchParams();
  const [activeArmy, setActiveArmy] = useState<ActiveArmy | null>(null);
  const [loading, setLoading] = useState(true);
  const [point, setPoints] = useState(0);
  const [editableArmyName, setEditableArmyName] = useState("");

  // Find the correct army template
  const armyList = armyType === "good" ? goodArmies : evilArmies;
  const selectedArmy = armyList.find((a) => a.name === armyName);
  const templateArmy = selectedArmy || armyList[0] || goodArmies[0];

  useEffect(() => {
    const loadArmy = async () => {
      if (savedArmyIdx !== undefined) {
        // Load from saved armies
        const fileUri = FileSystem.documentDirectory + "saved-army.json";
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          const armies = JSON.parse(content);
          const idx = parseInt(savedArmyIdx as string, 10);
          if (!isNaN(idx) && armies[idx]) {
            setActiveArmy(armies[idx]);
            setEditableArmyName(armies[idx].name);
            setPoints(
              armies[idx].heroes.reduce(
                (sum: number, hero: ActiveHero) => sum + hero.points,
                0
              )
            );
          } else {
            setActiveArmy(null);
          }
        }
      } else {
        // Fallback to template logic
        setActiveArmy(createActiveArmyFromTemplate(templateArmy));
        setEditableArmyName(templateArmy.name);
      }
      setLoading(false);
    };
    loadArmy();
  }, [savedArmyIdx, armyName, armyType]);

  function createActiveArmyFromTemplate(template: typeof templateArmy) {
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

  const handleReset = () => {
    setPoints(0);
    // Reset to a fresh template of the current army type (not Isengard or any default)
    setActiveArmy(createActiveArmyFromTemplate(templateArmy));
    setEditableArmyName(templateArmy.name);
  };

  const handleSaveArmy = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + "saved-army.json";
      let armies = [];
      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          armies = JSON.parse(content);
          if (!Array.isArray(armies)) armies = [armies];
        }
      } catch {}
      // Calculate totals before saving
      const { totalPoints, totalModels } = getArmyTotals(activeArmy);
      armies.push({
        ...activeArmy,
        name: editableArmyName,
        points: totalPoints,
        modelCount: totalModels,
      });
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(armies, null, 2)
      );
      alert("Army saved to device!");
    } catch (e) {
      alert("Failed to save army: " + e);
    }
  };

  // Helper to calculate total points and model count
  function getArmyTotals(army: ActiveArmy | null) {
    if (!army) return { totalPoints: 0, totalModels: 0 };
    let totalPoints = 0;
    let totalModels = 0;
    for (const hero of army.heroes) {
      if (hero.selected) {
        totalPoints += hero.points;
        // Add hero's wargear points if any
        if (hero.wargear && hero.wargearChecks) {
          for (const wg of hero.wargear) {
            if (wg.name && hero.wargearChecks[wg.name]) {
              totalPoints += wg.cost || 0;
            }
          }
        }
        // Count hero
        totalModels += 1;
        // Count warriors in warband
        for (const w of hero.warband) {
          if (w.wargearCounts) {
            totalModels += Object.values(w.wargearCounts).reduce(
              (a, b) => a + b,
              0
            );
            // Add warrior points
            for (const [wgName, count] of Object.entries(w.wargearCounts)) {
              if (wgName === "Base") {
                totalPoints += (w.baseCost || 0) * count;
              } else {
                const wg = w.availableWargear.find((g) => g.name === wgName);
                if (wg) {
                  totalPoints += ((w.baseCost || 0) + (wg.cost || 0)) * count;
                }
              }
            }
          }
        }
      }
    }
    return { totalPoints, totalModels };
  }

  const { totalPoints, totalModels } = getArmyTotals(activeArmy);

  if (loading) return <ThemedText>Loading...</ThemedText>;
  if (!activeArmy) return <ThemedText>No army found.</ThemedText>;

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
        </ThemedView>
        {/* Model count and points just below the title */}
        <ThemedView
          style={{
            flexDirection: "row",
            gap: 16,
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          <ThemedText type="subtitle">{totalModels} models</ThemedText>
          <ThemedText type="subtitle">{totalPoints} pts</ThemedText>
        </ThemedView>
        <Button
          color="error"
          style={{ marginVertical: 12 }}
          onPress={handleReset}
        >
          Reset
        </Button>
        {activeArmy.heroes.map((hero, idx) => {
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
              warband={hero.warband}
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
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});

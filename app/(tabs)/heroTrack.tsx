import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ArmyCount from "@/components/ui/GameTrack/ArmyCounter";
import Cards from "@/components/ui/GameTrack/Card";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PersistedArmy, PersistedHero } from "@/storage/ArmyRepository";
import { localArmyRepository } from "@/storage/LocalArmyRepository";
import { localActiveGameRepository } from "@/storage/LocalActiveGameRepository";
import { Button } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import organizedHeroArmies from "../data/organized_hero_armies.json";

const globalHeroLookup = new Map<string, any>();
(organizedHeroArmies as any[]).forEach((army) => {
  if (army?.heroes && Array.isArray(army.heroes)) {
    army.heroes.forEach((hero: any) => {
      if (hero?.name && !globalHeroLookup.has(hero.name)) {
        globalHeroLookup.set(hero.name, hero);
      }
    });
  }
});

type TrackerHero = PersistedHero & {
  might: number;
  will: number;
  fate: number;
  wounds: number;
  maxMight?: number;
  maxWill?: number;
  maxFate?: number;
  maxWounds?: number;
};

type TrackerArmy = Omit<PersistedArmy, "heroes"> & {
  points: number;
  modelCount: number;
  heroes: TrackerHero[];
};

export default function TabTwoScreen() {
  const { savedArmyIdx: savedArmyIdxParam } = useLocalSearchParams<{
    savedArmyIdx?: string | string[];
  }>();
  const savedArmyIdx = Array.isArray(savedArmyIdxParam)
    ? savedArmyIdxParam[0]
    : savedArmyIdxParam;
  const router = useRouter();
  const [activeArmy, setActiveArmy] = useState<TrackerArmy | null>(null);
  const [loading, setLoading] = useState(true);
  const endGameColor = useThemeColor({}, "buttonEvil");
  const endGameTextColor = useThemeColor({}, "buttonEvilText");

  useEffect(() => {
    const loadArmy = async () => {
      try {
        const idx = parseInt(savedArmyIdx as string, 10);
        const orderedArmies = await localArmyRepository.listSavedArmies();
        const savedArmyId = orderedArmies[idx]?.id;
        const savedArmy = savedArmyId
          ? await localArmyRepository.getSavedArmy(savedArmyId)
          : null;
        if (!isNaN(idx) && savedArmy) {
          let needsSave = false;
          let shouldResetToMax = false;

          const factionName = savedArmy.faction;
          const baseArmy = (organizedHeroArmies as any[]).find(
            (army) => army.name === factionName || army.faction === factionName,
          );
          const baseHeroLookup = new Map<string, any>();
          if (baseArmy?.heroes) {
            for (const hero of baseArmy.heroes) {
              if (hero?.name) baseHeroLookup.set(hero.name, hero);
            }
          }

          try {
            const activeMatch = await localActiveGameRepository.load();
            if (activeMatch) {
              const activeIdx = activeMatch.savedArmyIdx;
              shouldResetToMax =
                !isNaN(activeIdx) &&
                activeIdx === idx &&
                activeMatch?.resetToMax === true;
            }
          } catch (e) {
            // If active match fails to load, skip reset logic
          }

          // Ensure all heroes have `.selected` and starting max values
          const selectedArmy = {
            ...savedArmy,
            points: savedArmy.points ?? 0,
            modelCount: savedArmy.modelCount ?? 0,
            heroes: savedArmy.heroes.map((h) => {
              const baseHero =
                baseHeroLookup.get(h.name) ?? globalHeroLookup.get(h.name);
              const baseWounds =
                typeof baseHero?.wounds === "number"
                  ? baseHero.wounds
                  : typeof h.wounds === "number"
                    ? h.wounds
                    : 0;
              const baseMight =
                typeof baseHero?.might === "number"
                  ? baseHero.might
                  : typeof h.might === "number"
                    ? h.might
                    : 0;
              const baseWill =
                typeof baseHero?.will === "number"
                  ? baseHero.will
                  : typeof h.will === "number"
                    ? h.will
                    : 0;
              const baseFate =
                typeof baseHero?.fate === "number"
                  ? baseHero.fate
                  : typeof h.fate === "number"
                    ? h.fate
                    : 0;

              const maxWounds =
                typeof h.maxWounds === "number" ? h.maxWounds : baseWounds;
              const maxMight =
                typeof h.maxMight === "number" ? h.maxMight : baseMight;
              const maxWill =
                typeof h.maxWill === "number" ? h.maxWill : baseWill;
              const maxFate =
                typeof h.maxFate === "number" ? h.maxFate : baseFate;

              const currentWounds =
                typeof h.wounds === "number" ? h.wounds : maxWounds;
              const currentMight =
                typeof h.might === "number" ? h.might : maxMight;
              const currentWill = typeof h.will === "number" ? h.will : maxWill;
              const currentFate = typeof h.fate === "number" ? h.fate : maxFate;

              const finalWounds = shouldResetToMax ? maxWounds : currentWounds;
              const finalMight = shouldResetToMax ? maxMight : currentMight;
              const finalWill = shouldResetToMax ? maxWill : currentWill;
              const finalFate = shouldResetToMax ? maxFate : currentFate;

              if (
                h.maxWounds === undefined ||
                h.maxMight === undefined ||
                h.maxWill === undefined ||
                h.maxFate === undefined
              ) {
                needsSave = true;
              }

              if (
                h.wounds !== finalWounds ||
                h.might !== finalMight ||
                h.will !== finalWill ||
                h.fate !== finalFate
              ) {
                needsSave = true;
              }

              return {
                ...h,
                selected: h.selected ?? false,
                maxWounds,
                maxMight,
                maxWill,
                maxFate,
                wounds: finalWounds,
                might: finalMight,
                will: finalWill,
                fate: finalFate,
              };
            }),
          } as TrackerArmy;
          setActiveArmy(selectedArmy);

          if (needsSave) {
            try {
              await localArmyRepository.createOrUpdateArmy(selectedArmy);

              if (shouldResetToMax) {
                await localActiveGameRepository.save({
                  savedArmyIdx: idx,
                  resetToMax: false,
                });
              }
            } catch (e) {
              console.error("Failed to save hero max stats:", e);
            }
          }
        } else {
          setActiveArmy(null);
        }
      } catch (e) {
        console.error("Error loading army:", e);
        setActiveArmy(null);
      } finally {
        setLoading(false);
      }
    };

    loadArmy();
  }, [savedArmyIdx]);

  // Function to update hero stats
  const handleHeroStatsChange = async (
    heroName: string,
    newValues: [number, number, number, number],
  ) => {
    if (!activeArmy) return;

    const updatedArmy = {
      ...activeArmy,
      heroes: activeArmy.heroes.map((hero) => {
        if (hero.name === heroName) {
          return {
            ...hero,
            wounds: newValues[0],
            might: newValues[1],
            will: newValues[2],
            fate: newValues[3],
          };
        }
        return hero;
      }),
    };

    setActiveArmy(updatedArmy);

    // Save to file
    try {
      const idx = parseInt(savedArmyIdx as string, 10);
      if (!isNaN(idx)) {
        await localArmyRepository.createOrUpdateArmy(updatedArmy);
      }
    } catch (e) {
      console.error("Failed to save hero stats:", e);
    }
  };

  const handleEndGame = () => {
    Alert.alert(
      "End game",
      "End this game and reset all active match counters? Your saved army will not be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End game",
          style: "destructive",
          onPress: async () => {
            try {
              await localActiveGameRepository.clear();
              setActiveArmy(null);
              router.replace({ pathname: "/gameTrack" });
            } catch {
              Alert.alert("End game", "Unable to clear the active game.");
            }
          },
        },
      ],
    );
  };

  if (loading) return <ThemedText>Loading...</ThemedText>;

  // Sort heroes by tier
  const tierOrder = { legend: 0, valour: 1, fortitude: 2, independent: 3 };
  const selectedHeroes = activeArmy?.heroes
    .filter((hero) => hero.selected)
    .sort((a, b) => {
      const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 999;
      const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 999;
      return aTier - bTier;
    });

  // Calculate quarter and half breakpoints
  const modelCount = activeArmy?.modelCount || 0;
  const quarterBreak = Math.floor(modelCount / 4) + 1;
  const halfBreak = Math.floor(modelCount / 2) + 1;

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
        <ThemedText type="title">{activeArmy?.name}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <Button
          onPress={handleEndGame}
          buttonStyle={{ backgroundColor: endGameColor, minHeight: 44 }}
          titleStyle={{ color: endGameTextColor, fontFamily: "brioso" }}
        >
          End game
        </Button>
      </ThemedView>
      <ThemedView style={{ marginBottom: 8 }}>
        <ThemedText type="subtitle">
          {modelCount} models • Quarter: {quarterBreak} • Break: {halfBreak}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ArmyCount
          key={savedArmyIdx}
          modelCount={activeArmy?.modelCount ?? 0}
        ></ArmyCount>
      </ThemedView>

      {selectedHeroes?.length === 0 ? (
        <ThemedText>No heroes purchased in this army.</ThemedText>
      ) : (
        selectedHeroes?.map((hero, idx) => (
          <Cards
            key={idx}
            name={hero.name}
            values={[hero.wounds, hero.might, hero.will, hero.fate]}
            maxValues={[
              hero.maxWounds ?? hero.wounds,
              hero.maxMight ?? hero.might,
              hero.maxWill ?? hero.will,
              hero.maxFate ?? hero.fate,
            ]}
            onValuesChange={(newValues) =>
              handleHeroStatsChange(hero.name, newValues)
            }
          ></Cards>
        ))
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  heroCard: {
    padding: 5,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});

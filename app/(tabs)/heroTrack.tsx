import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ArmyCount from "@/components/ui/GameTrack/ArmyCounter";
import Cards from "@/components/ui/GameTrack/Card";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { calculateModelCount } from "@/domain/army";
import { getArmyCondition } from "@/domain/gameStatus";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PersistedArmy, PersistedHero } from "@/storage/ArmyRepository";
import { localArmyRepository } from "@/storage/LocalArmyRepository";
import { localActiveGameRepository } from "@/storage/LocalActiveGameRepository";
import type { ActiveGame } from "@/storage/ActiveGameRepository";
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
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [remainingModels, setRemainingModels] = useState(0);
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
          let shouldResetToMax = false;
          let storedGame: ActiveGame | null = null;

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
            storedGame = await localActiveGameRepository.load();
            if (storedGame) {
              const activeIdx = storedGame.savedArmyIdx;
              shouldResetToMax =
                !isNaN(activeIdx) &&
                activeIdx === idx &&
                storedGame.resetToMax === true;
            }
          } catch (e) {
            // If active match fails to load, skip reset logic
          }

          // Ensure all heroes have `.selected` and starting max values
          const selectedArmy = {
            ...savedArmy,
            points: savedArmy.points ?? 0,
            modelCount: calculateModelCount(savedArmy),
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

              const storedStats = storedGame?.heroStats?.[h.name];
              const finalWounds = shouldResetToMax
                ? maxWounds
                : storedStats?.[0] ?? currentWounds;
              const finalMight = shouldResetToMax
                ? maxMight
                : storedStats?.[1] ?? currentMight;
              const finalWill = shouldResetToMax
                ? maxWill
                : storedStats?.[2] ?? currentWill;
              const finalFate = shouldResetToMax
                ? maxFate
                : storedStats?.[3] ?? currentFate;

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
          const modelCount = selectedArmy.modelCount;
          const nextGame: ActiveGame = {
            savedArmyIdx: idx,
            resetToMax: false,
            armyId: savedArmy.id,
            modelCount,
            remainingModels: shouldResetToMax
              ? modelCount
              : Math.min(
                  modelCount,
                  Math.max(0, storedGame?.remainingModels ?? modelCount),
                ),
            heroStats: Object.fromEntries(
              selectedArmy.heroes.map((hero) => [
                hero.name,
                [hero.wounds, hero.might, hero.will, hero.fate],
              ]),
            ),
          };
          setActiveGame(nextGame);
          setRemainingModels(nextGame.remainingModels ?? modelCount);
          await localActiveGameRepository.save(nextGame);
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

    try {
      if (activeGame) {
        const nextGame: ActiveGame = {
          ...activeGame,
          heroStats: Object.fromEntries(
            updatedArmy.heroes.map((hero) => [
              hero.name,
              [hero.wounds, hero.might, hero.will, hero.fate],
            ]),
          ),
        };
        setActiveGame(nextGame);
        await localActiveGameRepository.save(nextGame);
      }
    } catch (e) {
      console.error("Failed to save active game stats:", e);
    }
  };

  const handleRemainingModelsChange = async (value: number) => {
    setRemainingModels(value);
    if (!activeGame) return;
    const nextGame = { ...activeGame, remainingModels: value };
    setActiveGame(nextGame);
    try {
      await localActiveGameRepository.save(nextGame);
    } catch (error) {
      console.error("Failed to save active army count:", error);
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
              setActiveGame(null);
              setRemainingModels(0);
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
  const modelCount = activeArmy?.modelCount ?? 0;
  const quarterBreak = Math.floor(modelCount / 4) + 1;
  const halfBreak = Math.floor(modelCount / 2) + 1;
  const armyCondition = getArmyCondition(modelCount, remainingModels);

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
      {armyCondition ? (
        <ThemedView
          style={[
            styles.conditionBanner,
            { backgroundColor: endGameColor },
          ]}
        >
          <ThemedText
            style={[styles.conditionText, { color: endGameTextColor }]}
          >
            {armyCondition === "quartered" ? "Quartered" : "Broken"}
          </ThemedText>
        </ThemedView>
      ) : null}
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
          modelCount={modelCount}
          remainingModels={remainingModels}
          onRemainingModelsChange={handleRemainingModelsChange}
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
  conditionBanner: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  conditionText: {
    fontFamily: "briosoUberBold",
    fontSize: 24,
    textTransform: "uppercase",
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useSettings } from "@/components/SettingsContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Hero } from "@/components/ui/ArmyBuilder/Hero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@rneui/base";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput } from "react-native";
import angmar from "../data/evil/angmar_and_northern_evil.json";
import dolGuldurAndMirkwoodEvil from "../data/evil/dol_guldur_and_mirkwood_evil.json";
import gundabadMoriaGoblinsAndOrcs from "../data/evil/gundabad,_moria,_goblins,_and_orcs.json";
import haradUmbarKhandEast from "../data/evil/harad,_umbar,_khand,_east.json";
import isenguard from "../data/evil/isengard_and_allies.json";
import mordorAndSauronAligned from "../data/evil/mordor_and_sauron-aligned.json";
import shireInvaders from "../data/evil/shire_invaders.json";
import dwarfArmy from "../data/good/dwarves.json";
import elfArmy from "../data/good/elves.json";
import hobbitArmy from "../data/good/hobbits_and_the_shire.json";
import menArmy from "../data/good/men_of_the_west.json";
import otherGoodArmy from "../data/good/other_good.json";
import rohanArmy from "../data/good/rohan.json";

type ActiveWarriorOption = {
  name: string;
  baseCost: number;
  availableWargear: { name: string; cost: number }[];
  wargearCounts: { [option: string]: number };
};

type ActiveHero = {
  name: string;
  points: number;
  tier: "legend" | "valour" | "fortitude" | "independent";
  legacy?: boolean;
  mustBeLeader?: boolean;
  wargear: { name: string; cost: number }[];
  wargearChecks: { [option: string]: boolean };
  selected: boolean;
  warband: ActiveWarriorOption[];
};

type ActiveArmy = {
  name: string;
  faction: string;
  heroes: ActiveHero[];
  warbandOptions?: ActiveWarriorOption[];
};

type CatalogueWargear = { name: string; cost: number };
type CatalogueWarrior = {
  name: string;
  baseCost: number;
  legacy?: boolean;
  availableWargear: CatalogueWargear[];
};
type CatalogueHero = {
  name: string;
  points: number;
  tier: ActiveHero["tier"];
  legacy?: boolean;
  mustBeLeader?: boolean;
  wargear: CatalogueWargear[];
};
type CatalogueArmy = {
  name: string;
  faction: string;
  heroes: CatalogueHero[];
  warbandOptions: CatalogueWarrior[];
};

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const catalogue = (value: unknown) => value as CatalogueArmy[];

export default function HomeScreen() {
  const params = useLocalSearchParams<{
    savedArmyIdx?: string | string[];
    armyName?: string | string[];
    armyType?: string | string[];
  }>();
  const savedArmyIdx = firstParam(params.savedArmyIdx);
  const armyName = firstParam(params.armyName);
  const armyType = firstParam(params.armyType);
  const { settings } = useSettings();
  const [activeArmy, setActiveArmy] = useState<ActiveArmy | null>(null);
  const [loading, setLoading] = useState(true);
  const [point, setPoints] = useState(0);
  const [editableArmyName, setEditableArmyName] = useState("");
  const armyCatalogues: Record<string, CatalogueArmy[]> = {
    dwarves: catalogue(dwarfArmy),
    elves: catalogue(elfArmy),
    hobbits_and_the_shire: catalogue(hobbitArmy),
    "Men of the West": catalogue(menArmy),
    rohan: catalogue(rohanArmy),
    other_good: catalogue(otherGoodArmy),
    "Mordor & Sauron-Aligned": catalogue(mordorAndSauronAligned),
    "Dol Guldur & Mirkwood Evil": catalogue(dolGuldurAndMirkwoodEvil),
    isenguard: catalogue(isenguard),
    "Angmar & Northern Evil": catalogue(angmar),
    "Harad, Umbar, Khand, East": catalogue(haradUmbarKhandEast),
    "Gundabad, Moria, Goblins, and Orcs": catalogue(gundabadMoriaGoblinsAndOrcs),
    "Shire Invaders": catalogue(shireInvaders),
  };

  const primaryColor = useThemeColor({}, "button");
  const textColor = useThemeColor({}, "buttonText");
  const errorColor = useThemeColor({}, "buttonEvil"); // or use a themed error color if you have one

  const armyCategoryMap = {
    elves: [
      "Rivendell",
      "Lothlorien",
      "Lindon",
      "Road to Rivendell",
      "Fields of Celebrant",
      "The White Council",
      "Vanquishers of the Necromancer",
    ],
    dwarves: [
      "The Iron Hills",
      "Kingdom of Khazad-dûm",
      "Reclamation of Moria",
      "Army of Erebor",
      "Defenders of Erebor",
      "The Battle of Five Armies",
      "Erebor Reclaimed",
      "Army of Thror",
    ],
    "Men of the West": [
      "Minas Tirith",
      "Garrison of Ithilien",
      "Atop the Wall",
      "Defenders of the Pelennor",
      "Reclamation of Osgiliath",
      "Garrison of Minas Tirith",
      "The Fiefdoms",
      "The Grey Company",
      "Realms of Men",
      "Men of the West",
      "Return of the King",
      "The Last Alliance",
      "Numenor",
    ],
    rohan: [
      "Kingdom of Rohan",
      "Riders of Eomer",
      "Riders of Theoden",
      "Army of Edoras",
      "Defenders of Helm's Deep",
      "Fords of Isen",
      "Theodred's Guard",
      "Helm's Guard",
      "Ride Out",
      "Road to Helm's Deep",
      "Usurpers of Edoras",
      "Besiegers of the Hornburg",
      "Defenders of the Hornburg",
      "The Grief of Eomer",
    ],
    hobbits_and_the_shire: [
      "The Shire",
      "Defenders of the Shire",
      "Battle of Bywater",
      "Battle of Greenfields",
      "The Three Trolls",
      "Radagast's Alliance",
    ],
    other_good: [
      "Fangorn",
      "The Beornings",
      "The Eagles",
      "The Dead of Dunharrow",
      "The Fellowship",
      "Breaking of the Fellowship",
      "Arnor",
      "Battle of Fornost",
      "Arathorn's Stand",
      "Paths of the Druadan",
      "Survivors of Lake-town",
      "Army of Lake-town",
      "Rangers of Mirkwood",
      "Thorin's Company",
      "Erebor & Dale",
      "The Army of Dale",
      "Garrison of Dale",
    ],
    "Mordor & Sauron-Aligned": [
      "Mordor",
      "Legions of Mordor",
      "Army of the Great Eye",
      "Army of Gothmog",
      "Barad-Dur",
      "Minas Morgul",
      "Cirith Ungol",
      "The Black Gate",
      "The Black Riders",
      "Wraiths on Wings",
      "Rise of the Necromancer",
    ],
    "Dol Guldur & Mirkwood Evil": [
      "Dark Powers of Dol Guldur",
      "Pits of Dol Guldur",
      "Fell Beings of Mirkwood",
      "The Spider Queen's Brood",
      "Assault on Lothlorien",
    ],
    isenguard: [
      "Isengard",
      "Army of the White Hand",
      "Muster of Isengard",
      "Lurtz's Scouts",
      "Ugluk's Scouts",
      "Wolves of Isengard",
      "Assault Upon Helm's Deep",
      "Sharkey's Rogues",
    ],
    "Angmar & Northern Evil": [
      "Host of the Witch-King",
      "Wolf Pack of Angmar",
      "Shadows of Angmar",
      "Buhrdur's Horde",
      "Army of Carn Dum",
    ],
    "Harad, Umbar, Khand, East": [
      "Harad",
      "Far Harad",
      "The Serpent Horde",
      "Umbar",
      "Corsair Fleets",
      "Variags of Khand",
      "Grand Army of the South",
      "The Easterlings",
      "Host of the Dragon Emperor",
      "Expedition to the East",
    ],
    "Gundabad, Moria, Goblins, and Orcs": [
      "Moria",
      "Depths of Moria",
      "Goblin-Town",
      "Azog's Hunters",
      "Army of Gundabad",
      "Desolator of the North",
      "Assault on Ravenhill",
    ],
    "Shire Invaders": ["Ravagers of the Shire", "Sharkey's Rogues"],
  };

  function getArmyCategory(armyName: string) {
    for (const [category, armies] of Object.entries(armyCategoryMap)) {
      if (armies.includes(armyName)) return category;
    }
    return "Uncategorized";
  }

  // Find the correct army template
  const armyList = armyName
    ? armyCatalogues[getArmyCategory(armyName)] || []
    : [];

  const selectedArmy = armyList.find((a) => a.name === armyName);
  const templateArmy =
    selectedArmy || armyList[0] || catalogue(dwarfArmy)[0];

  // Load army on mount
  useEffect(() => {
    const loadArmy = async () => {
      if (savedArmyIdx !== undefined) {
        // Load from saved armies
        const fileUri = FileSystem.documentDirectory + "saved-army.json";
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          const armies = JSON.parse(content);
          const idx = parseInt(savedArmyIdx, 10);
          if (!isNaN(idx) && armies[idx]) {
            setActiveArmy(armies[idx]);
            setEditableArmyName(armies[idx].name);
            setPoints(
              armies[idx].heroes.reduce(
                (sum: number, hero: ActiveHero) => sum + hero.points,
                0,
              ),
            );
          } else {
            setActiveArmy(null);
          }
        }
      } else {
        // Try to load work-in-progress army first
        try {
          const wipUri = FileSystem.documentDirectory + "wip-army.json";
          const wipInfo = await FileSystem.getInfoAsync(wipUri);
          if (wipInfo.exists) {
            const wipContent = await FileSystem.readAsStringAsync(wipUri);
            const wipArmy = JSON.parse(wipContent);
            // If WIP exists and we're not specifying a specific army, always load WIP
            if (wipArmy && !armyName) {
              setActiveArmy(wipArmy);
              setEditableArmyName(wipArmy.name);
              setPoints(
                wipArmy.heroes.reduce(
                  (sum: number, hero: ActiveHero) =>
                    sum + (hero.selected ? hero.points : 0),
                  0,
                ),
              );
            } else if (
              wipArmy &&
              armyName &&
              (wipArmy.name === armyName || wipArmy.faction === armyName)
            ) {
              // WIP matches the requested army
              setActiveArmy(wipArmy);
              setEditableArmyName(wipArmy.name);
              setPoints(
                wipArmy.heroes.reduce(
                  (sum: number, hero: ActiveHero) =>
                    sum + (hero.selected ? hero.points : 0),
                  0,
                ),
              );
            } else {
              // Different army or first time, start fresh
              setActiveArmy(createActiveArmyFromTemplate(templateArmy));
              setEditableArmyName(templateArmy.name);
            }
          } else {
            // No WIP, start fresh
            setActiveArmy(createActiveArmyFromTemplate(templateArmy));
            setEditableArmyName(templateArmy.name);
          }
        } catch {
          // Fallback to template logic
          setActiveArmy(createActiveArmyFromTemplate(templateArmy));
          setEditableArmyName(templateArmy.name);
        }
      }
      setLoading(false);
    };
    loadArmy();
  }, [savedArmyIdx, armyName, armyType]);

  // Save work-in-progress when army changes (debounced)
  useEffect(() => {
    if (!activeArmy) return;

    // Only save WIP for new armies (not editing existing ones)
    if (savedArmyIdx !== undefined) return;

    const timeoutId = setTimeout(async () => {
      try {
        const wipUri = FileSystem.documentDirectory + "wip-army.json";
        await FileSystem.writeAsStringAsync(
          wipUri,
          JSON.stringify(activeArmy, null, 2),
        );
      } catch (e) {
        console.error("Failed to save WIP:", e);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [activeArmy, savedArmyIdx]);

  useEffect(() => {
    if (!activeArmy) return;
    if (settings.legacyProfilesEnabled) return;
    setActiveArmy((prev) =>
      prev && prev.heroes.some((hero) => hero.legacy)
        ? {
            ...prev,
            heroes: prev.heroes.filter((hero) => !hero.legacy),
          }
        : prev,
    );
  }, [settings.legacyProfilesEnabled, activeArmy]);

  function createActiveArmyFromTemplate(template: CatalogueArmy): ActiveArmy {
    const filteredHeroes = settings.legacyProfilesEnabled
      ? template.heroes
      : template.heroes.filter((hero) => !hero.legacy);

    // Sort heroes by tier: legend > valour > fortitude > independent
    const tierOrder = { legend: 0, valour: 1, fortitude: 2, independent: 3 };
    const sortedHeroes = [...filteredHeroes].sort((a, b) => {
      const aTier = tierOrder[a.tier] ?? 999;
      const bTier = tierOrder[b.tier] ?? 999;
      return aTier - bTier;
    });

    return {
      name: template.name,
      faction: template.faction,
      heroes: sortedHeroes.map((hero) => ({
        ...hero,
        legacy: hero.legacy ?? false,
        mustBeLeader: hero.mustBeLeader ?? false,
        selected: false,
        wargear: hero.wargear.map((wg) => ({
          name: wg.name ?? "",
          cost: wg.cost ?? 0,
        })),
        wargearChecks: hero.wargear.reduce(
          (acc, wg) => {
            if (wg.name) acc[wg.name] = false;
            return acc;
          },
          {} as { [key: string]: boolean },
        ),
        warband: [...template.warbandOptions]
          .filter(
            (option) =>
              (option.baseCost || 0) > 0 &&
              (settings.legacyProfilesEnabled || !option.legacy),
          )
          .sort((a, b) => (a.baseCost || 0) - (b.baseCost || 0))
          .map((option) => ({
            name: option.name,
            baseCost: option.baseCost,
            availableWargear: option.availableWargear
              .filter(
                (wg) =>
                  wg &&
                  typeof wg.name === "string" &&
                  typeof wg.cost === "number",
              )
              .map((wg) => ({
                name: wg.name as string,
                cost: wg.cost as number,
              })),
            wargearCounts: {
              Base: 0,
              ...option.availableWargear.reduce(
                (acc, wg) => {
                  if (wg.name) acc[wg.name] = 0;
                  return acc;
                },
                {} as { [key: string]: number },
              ),
            },
          })),
      })),
    };
  }

  const handleReset = async () => {
    setPoints(0);
    // Reset to a fresh template of the current army type (not Isengard or any default)
    setActiveArmy(createActiveArmyFromTemplate(templateArmy));
    setEditableArmyName(templateArmy.name);
    // Clear WIP
    try {
      const wipUri = FileSystem.documentDirectory + "wip-army.json";
      await FileSystem.deleteAsync(wipUri, { idempotent: true });
    } catch {}
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

      // Check if we're editing an existing army
      if (savedArmyIdx !== undefined) {
        const idx = parseInt(savedArmyIdx, 10);
        if (!isNaN(idx) && armies[idx]) {
          // Update existing army
          armies[idx] = {
            ...activeArmy,
            name: editableArmyName,
            points: totalPoints,
            modelCount: totalModels,
          };
          await FileSystem.writeAsStringAsync(
            fileUri,
            JSON.stringify(armies, null, 2),
          );
          Alert.alert("Army Workshop", "Army updated successfully!", [
            {
              text: "Ok",
            },
          ]);
          return;
        }
      }

      // Check for duplicate names (only for new armies)
      if (armies.some((army: ActiveArmy) => army.name === editableArmyName)) {
        Alert.alert(
          "Army Workshop",
          "This army name already exists! Please change name, or edit existing army. ",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            { text: "Ok" },
          ],
        );
      } else if (totalPoints == 0) {
        Alert.alert(
          "Army Workshop",
          "This army is empty, are you sure you want to save it?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Ok",
              onPress: async () => {
                armies.push({
                  ...activeArmy,
                  name: editableArmyName,
                  points: totalPoints,
                  modelCount: totalModels,
                });
                await FileSystem.writeAsStringAsync(
                  fileUri,
                  JSON.stringify(armies, null, 2),
                );
              },
            },
          ],
        );
      } else {
        armies.push({
          ...activeArmy,
          name: editableArmyName,
          points: totalPoints,
          modelCount: totalModels,
        });
        await FileSystem.writeAsStringAsync(
          fileUri,
          JSON.stringify(armies, null, 2),
        );
        // alert("Army saved to device!");
        Alert.alert("Army Workshop", "Army Saved to Device!", [
          {
            text: "Cancel",
            style: "cancel",
          },
          { text: "Ok" },
        ]);
      }
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
      if (!settings.legacyProfilesEnabled && hero.legacy) continue;
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
              0,
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
              fontSize: 30,
              fontFamily: "brioso",
              color: textColor,
              backgroundColor: primaryColor,
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
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          <ThemedText
            type="subtitle"
            style={{ fontFamily: "brioso", fontSize: 22 }}
          >
            {totalModels} models
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={{ fontFamily: "brioso", fontSize: 22 }}
          >
            {totalModels === 0 ? 0 : Math.floor(totalModels / 2) + 1} break
          </ThemedText>

          <ThemedText
            type="subtitle"
            style={{ fontFamily: "brioso", fontSize: 22 }}
          >
            {totalModels === 0 ? 0 : Math.floor(totalModels / 3)} bows
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={{ fontFamily: "brioso", fontSize: 22 }}
          >
            {totalPoints} pts
          </ThemedText>
        </ThemedView>
        <Button
          buttonStyle={{ backgroundColor: primaryColor }} // for "Reset" or destructive actions
          titleStyle={{ color: textColor, fontFamily: "brioso", fontSize: 22 }}
          style={{ marginVertical: 12 }}
          onPress={handleReset}
        >
          Reset
        </Button>

        {(settings.legacyProfilesEnabled
          ? activeArmy.heroes
          : activeArmy.heroes.filter((hero) => !hero.legacy)
        ).map((hero, idx) => {
          const selectedHeroes = (
            settings.legacyProfilesEnabled
              ? activeArmy.heroes
              : activeArmy.heroes.filter((h) => !h.legacy)
          ).filter((h) => h.selected);
          const warbandNumber = hero.selected
            ? selectedHeroes.findIndex((h) => h.name === hero.name) + 1
            : null;

          // Check if this independent hero is already selected
          const isIndependentAlreadySelected =
            hero.tier === "independent" &&
            selectedHeroes.some((h) => h.name === hero.name && h !== hero);

          // Sort wargear by cost (least to greatest), banners always last
          const sortedWargear: [string, number][] = [...hero.wargear]
            .filter((wg) => wg.cost !== 0)
            .sort((a, b) => {
              const aIsBanner = a.name.toLowerCase().includes("banner");
              const bIsBanner = b.name.toLowerCase().includes("banner");

              // Banners always go last
              if (aIsBanner && !bIsBanner) return 1;
              if (!aIsBanner && bIsBanner) return -1;

              // Otherwise sort by cost (cheapest first)
              return a.cost - b.cost;
            })
            .map((wg): [string, number] => [wg.name, wg.cost]);

          return (
            <Hero
              key={hero.name}
              name={hero.name}
              points={hero.points}
              checked={hero.selected}
              wargear={sortedWargear}
              wargearChecks={hero.wargearChecks}
              armyUpdate={(updater) =>
                setActiveArmy((previous) =>
                  previous ? (updater(previous) as ActiveArmy) : previous,
                )
              }
              setPoints={setPoints}
              warbandNumber={warbandNumber}
              tier={hero.tier}
              mustBeLeader={hero.mustBeLeader}
              warband={hero.warband}
              isAlreadySelected={isIndependentAlreadySelected}
              army={activeArmy}
            />
          );
        })}
      </ThemedView>
      <Button
        buttonStyle={{ backgroundColor: primaryColor }}
        titleStyle={{ color: textColor, fontFamily: "brioso" }}
        onPress={handleSaveArmy}
      >
        Save
      </Button>
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

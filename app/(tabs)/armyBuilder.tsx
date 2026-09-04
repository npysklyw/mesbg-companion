import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useSettings } from "@/components/SettingsContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Hero } from "@/components/ui/ArmyBuilder/Hero";
import { IconSymbol } from "@/components/ui/IconSymbol";
import type { Army, Hero as ArmyHero } from "@/domain/army";
import { calculateArmyTotals } from "@/domain/army";
import {
  getSelectableCatalogueHeroes,
  getSelectableCatalogueWarriors,
  getInitialCatalogueHeroRequirements,
  resolveCatalogueArmy,
  type CatalogueArmy,
} from "@/domain/catalogue";
import { useThemeColor } from "@/hooks/useThemeColor";
import { registerArmyEditGuard } from "@/navigation/armyEditGuard";
import {
  createArmyEditSnapshot,
  discardArmyEdit,
  isArmyEditDirty,
  prepareArmyEditSave,
  type ArmyEditSnapshot,
} from "@/storage/ArmyEditSession";
import type { PersistedArmy } from "@/storage/ArmyRepository";
import { localArmyRepository } from "@/storage/LocalArmyRepository";
import { Button } from "@rneui/base";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

type ActiveArmy = Army & { id?: string };
type ActiveHero = ArmyHero;

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const catalogue = (value: unknown) => value as CatalogueArmy[];

const activeArmyCatalogues: CatalogueArmy[][] = [
  catalogue(dwarfArmy),
  catalogue(elfArmy),
  catalogue(hobbitArmy),
  catalogue(menArmy),
  catalogue(rohanArmy),
  catalogue(otherGoodArmy),
  catalogue(mordorAndSauronAligned),
  catalogue(dolGuldurAndMirkwoodEvil),
  catalogue(isenguard),
  catalogue(angmar),
  catalogue(haradUmbarKhandEast),
  catalogue(gundabadMoriaGoblinsAndOrcs),
  catalogue(shireInvaders),
];

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
  const navigation = useNavigation();
  const [activeArmy, setActiveArmy] = useState<ActiveArmy | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setPoints] = useState(0);
  const [editableArmyName, setEditableArmyName] = useState("");
  const [savedSnapshot, setSavedSnapshot] =
    useState<ArmyEditSnapshot | null>(null);
  const bypassExitGuard = useRef(false);
  const primaryColor = useThemeColor({}, "button");
  const textColor = useThemeColor({}, "buttonText");
  const borderColor = useThemeColor({}, "tint");
  const saveColor = useThemeColor({}, "buttonGood");
  const saveTextColor = useThemeColor({}, "buttonGoodText");

  const templateArmy = armyName
    ? resolveCatalogueArmy(activeArmyCatalogues, armyName)
    : undefined;

  // Load army on mount
  useEffect(() => {
    const loadArmy = async () => {
      if (savedArmyIdx !== undefined) {
        // Load from saved armies
        const idx = parseInt(savedArmyIdx, 10);
        const orderedArmies = await localArmyRepository.listSavedArmies();
        const savedArmyId = orderedArmies[idx]?.id;
        const savedArmy = savedArmyId
          ? await localArmyRepository.getSavedArmy(savedArmyId)
          : null;
        if (savedArmy) {
          const savedTemplate = resolveCatalogueArmy(
            activeArmyCatalogues,
            savedArmy.faction,
          );
          const hydratedArmy = savedTemplate
            ? applyCatalogueRequirements(savedArmy, savedTemplate)
            : savedArmy;
          setActiveArmy(hydratedArmy);
          setEditableArmyName(hydratedArmy.name);
          setSavedSnapshot(createArmyEditSnapshot(hydratedArmy));
          setPoints(
            hydratedArmy.heroes.reduce(
              (sum: number, hero: ActiveHero) => sum + hero.points,
              0,
            ),
          );
        } else {
          setActiveArmy(null);
          setSavedSnapshot(null);
        }
      } else {
        setSavedSnapshot(null);
        if (!templateArmy) {
          console.error(`Unable to resolve army catalogue entry: ${armyName}`);
          setActiveArmy(null);
          setLoading(false);
          return;
        }
        // Try to load work-in-progress army first
        try {
          const wipArmy = await localArmyRepository.loadWorkInProgress();
          if (wipArmy) {
            // If WIP exists and we're not specifying a specific army, always load WIP
            if (wipArmy && !armyName) {
              const wipTemplate = resolveCatalogueArmy(
                activeArmyCatalogues,
                wipArmy.faction,
              );
              const hydratedArmy = wipTemplate
                ? applyCatalogueRequirements(wipArmy, wipTemplate)
                : wipArmy;
              setActiveArmy(hydratedArmy);
              setEditableArmyName(hydratedArmy.name);
              setPoints(
                hydratedArmy.heroes.reduce(
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
              const hydratedArmy = applyCatalogueRequirements(
                wipArmy,
                templateArmy,
              );
              setActiveArmy(hydratedArmy);
              setEditableArmyName(hydratedArmy.name);
              setPoints(
                hydratedArmy.heroes.reduce(
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
        await localArmyRepository.saveWorkInProgress(activeArmy);
      } catch (e) {
        console.error("Failed to save WIP:", e);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [activeArmy, savedArmyIdx]);

  useEffect(() => {
    if (!activeArmy) return;
    if (settings.legacyProfilesEnabled) return;
    // This effect intentionally reconciles persisted state when the setting changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const filteredHeroes = getSelectableCatalogueHeroes(
      template,
      settings.legacyProfilesEnabled,
    );

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
        ...getInitialCatalogueHeroRequirements(hero),
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
        warband: getSelectableCatalogueWarriors(
          template,
          settings.legacyProfilesEnabled,
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

  function applyCatalogueRequirements<TArmy extends ActiveArmy>(
    army: TArmy,
    template: CatalogueArmy,
  ): TArmy {
    const templateArmy = createActiveArmyFromTemplate(template);
    const requirements = new Map(
      templateArmy.heroes.map((hero) => [hero.name, hero]),
    );
    const retainedHeroes = army.heroes.filter((hero) => requirements.has(hero.name));
    const existingNames = new Set(retainedHeroes.map((hero) => hero.name));
    const heroes = retainedHeroes.map((hero) => {
      const catalogueHero = requirements.get(hero.name);
      if (!catalogueHero) return hero;
      const warband = catalogueHero.warband.map((warrior) => {
        const existingWarrior = hero.warband.find(
          (candidate) => candidate.name === warrior.name,
        );
        return existingWarrior
          ? { ...warrior, wargearCounts: existingWarrior.wargearCounts }
          : warrior;
      });
      return {
        ...hero,
        mandatory: catalogueHero.mandatory,
        mustBeGeneral: catalogueHero.mustBeGeneral,
        isGeneral: catalogueHero.mustBeGeneral ? true : hero.isGeneral,
        mustBeLeader: catalogueHero.mustBeLeader,
        selected: catalogueHero.mandatory ? true : hero.selected,
        warband,
      };
    });

    for (const hero of templateArmy.heroes) {
      if (hero.mandatory && !existingNames.has(hero.name)) heroes.push(hero);
    }
    return { ...army, heroes } as TArmy;
  }

  const handleReset = async () => {
    const resetTemplate =
      templateArmy ??
      (activeArmy
        ? resolveCatalogueArmy(activeArmyCatalogues, activeArmy.faction)
        : undefined);
    if (!resetTemplate) return;
    setPoints(0);
    // Reset to the exact catalogue faction, including when editing a renamed army.
    setActiveArmy(createActiveArmyFromTemplate(resetTemplate));
    setEditableArmyName(resetTemplate.name);
    // Clear WIP
    try {
      await localArmyRepository.clearWorkInProgress();
    } catch {}
  };

  const saveExistingEdit = useCallback(async (): Promise<boolean> => {
    if (!activeArmy?.id || !savedSnapshot) return false;
    try {
      const { points: totalPoints, modelCount: totalModels } =
        calculateArmyTotals(activeArmy, settings.legacyProfilesEnabled);
      const prepared = prepareArmyEditSave(
        {
          ...activeArmy,
          points: totalPoints,
          modelCount: totalModels,
        } as PersistedArmy,
        editableArmyName,
        savedSnapshot,
      );
      const saved = await localArmyRepository.createOrUpdateArmy(prepared);
      setActiveArmy(saved);
      setSavedSnapshot(createArmyEditSnapshot(saved, saved.name));
      return true;
    } catch {
      Alert.alert("Army Workshop", "Failed to save army.");
      return false;
    }
  }, [activeArmy, editableArmyName, savedSnapshot, settings.legacyProfilesEnabled]);

  const handleSaveArmy = async () => {
    if (!activeArmy) return;
    try {
      let armies: Awaited<
        ReturnType<typeof localArmyRepository.listSavedArmies>
      > = [];
      try {
        armies = await localArmyRepository.listSavedArmies();
      } catch {}
      // Calculate totals before saving
      const { points: totalPoints, modelCount: totalModels } =
        calculateArmyTotals(activeArmy, settings.legacyProfilesEnabled);

      // Check if we're editing an existing army
      if (savedArmyIdx !== undefined) {
        if (await saveExistingEdit()) {
          Alert.alert("Army Workshop", "Army updated successfully!", [
            {
              text: "Ok",
            },
          ]);
        }
        return;
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
      } else if (totalPoints === 0) {
        Alert.alert(
          "Army Workshop",
          "This army is empty, are you sure you want to save it?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Ok",
              onPress: async () => {
                await localArmyRepository.createOrUpdateArmy({
                  ...activeArmy,
                  name: editableArmyName,
                  points: totalPoints,
                  modelCount: totalModels,
                });
              },
            },
          ],
        );
      } else {
        await localArmyRepository.createOrUpdateArmy({
          ...activeArmy,
          name: editableArmyName,
          points: totalPoints,
          modelCount: totalModels,
        });
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

  const editIsDirty = Boolean(
    activeArmy?.id &&
      savedSnapshot &&
      isArmyEditDirty(
        activeArmy as PersistedArmy,
        editableArmyName,
        savedSnapshot,
      ),
  );

  const confirmEditExit = useCallback(
    (proceed: () => void) => {
      if (!activeArmy?.id || !savedSnapshot || !editIsDirty) {
        proceed();
        return;
      }
      Alert.alert("Unsaved changes", "Save your changes before leaving?", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard changes",
          style: "destructive",
          onPress: () => {
            setActiveArmy(discardArmyEdit(savedSnapshot));
            setEditableArmyName(savedSnapshot.editableName);
            bypassExitGuard.current = true;
            proceed();
          },
        },
        {
          text: "Save changes",
          onPress: async () => {
            if (await saveExistingEdit()) {
              bypassExitGuard.current = true;
              proceed();
            }
          },
        },
      ]);
    }, [activeArmy?.id, editIsDirty, saveExistingEdit, savedSnapshot],
  );

  useEffect(() => {
    if (!editIsDirty) return;
    return registerArmyEditGuard(confirmEditExit);
  }, [confirmEditExit, editIsDirty]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (bypassExitGuard.current) {
          bypassExitGuard.current = false;
          return;
        }
        if (!editIsDirty) return;
        event.preventDefault();
        confirmEditExit(() => {
          bypassExitGuard.current = true;
          navigation.dispatch(event.data.action);
        });
      }),
    [confirmEditExit, editIsDirty, navigation],
  );

  const {
    points: totalPoints,
    modelCount: totalModels,
    breakValue,
    bowAllowance,
  } = calculateArmyTotals(activeArmy, settings.legacyProfilesEnabled);
  const pluralize = (value: number, singular: string) =>
    `${value} ${singular}${value === 1 ? "" : "s"}`;

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
        <ThemedView style={styles.summaryRow}>
          {[
            pluralize(totalModels, "model"),
            `Break at ${breakValue}`,
            pluralize(bowAllowance, "bow"),
            pluralize(totalPoints, "point"),
          ].map((label) => (
            <ThemedView
              key={label}
              style={[styles.summaryItem, { borderColor }]}
            >
              <ThemedText type="subtitle" style={styles.summaryText}>
                {label}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
        <Button
          type="outline"
          buttonStyle={[styles.secondaryButton, { borderColor }]}
          titleStyle={{ color: borderColor, fontFamily: "brioso", fontSize: 20 }}
          containerStyle={styles.actionSpacing}
          onPress={handleReset}
        >
          Reset army
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
              army={activeArmy}
            />
          );
        })}
      </ThemedView>
      <Button
        buttonStyle={[styles.primaryButton, { backgroundColor: saveColor }]}
        titleStyle={{
          color: saveTextColor,
          fontFamily: "briosoBold",
          fontSize: 20,
        }}
        containerStyle={styles.actionSpacing}
        onPress={handleSaveArmy}
      >
        Save army
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
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  summaryItem: {
    borderWidth: 1,
    borderRadius: 8,
    minWidth: "47%",
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryText: {
    fontFamily: "briosoBold",
    fontSize: 18,
  },
  actionSpacing: {
    marginVertical: 8,
  },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 2,
  },
  primaryButton: {
    minHeight: 48,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});

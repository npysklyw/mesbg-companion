import { useThemeColor } from "@/hooks/useThemeColor";
import {
  Army,
  Hero as ArmyHero,
  HeroTier,
  Warrior as ArmyWarrior,
  calculateBowCount,
  calculateHeroWargearPoints,
  calculateModelCount,
  calculateTierCapacity,
  calculateWarbandModelCount,
  calculateWarbandPoints,
} from "@/domain/army";
import { Button, ListItem } from "@rneui/base";
import React from "react";
import { Alert, Platform, ToastAndroid, View } from "react-native";
import { Warrior } from "./Warrior";

type ArmyUpdater = (updater: (previous: Army) => Army) => void;

type HeroProps = {
  name: string;
  points?: number;
  wargear?: [string, number][];
  checked?: boolean;
  wargearChecks?: { [option: string]: boolean };
  armyUpdate?: ArmyUpdater;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  warbandNumber?: number | null;
  tier?: HeroTier;
  mustBeLeader?: boolean;
  warband: ArmyWarrior[];
  isAlreadySelected?: boolean; // For independent heroes
  army?: Army | null; // For bow limit calculations
};

export function Hero({
  name,
  points = 0,
  wargear,
  checked = false,
  wargearChecks = {},
  armyUpdate,
  setPoints,
  warbandNumber,
  tier = "fortitude",
  mustBeLeader = false,
  warband,
  isAlreadySelected = false,
  army = null,
}: HeroProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor({}, "button");
  const buttonTextColor = useThemeColor({}, "buttonText");
  const borderColor = useThemeColor({}, "tint");
  const selectedColor = useThemeColor({}, "buttonGood");
  const selectedTextColor = useThemeColor({}, "buttonGoodText");
  const errorTextColor = useThemeColor({}, "buttonEvilText");
  const [expanded, setExpanded] = React.useState(false);

  const tierLabels = {
    legend: "Legend",
    valour: "Valour",
    fortitude: "Fortitude",
    minor: "Minor",
    independent: "Independent",
  };
  const tierLabel = tierLabels[tier];
  const warbandCap = calculateTierCapacity(tier);

  // Calculate total warriors in this hero's warband
  const totalWarriors = calculateWarbandModelCount(warband);

  // Calculate hero's wargear cost
  const calculationHero: ArmyHero = {
    name,
    points,
    tier,
    mustBeLeader,
    wargear: (wargear ?? []).map(([option, cost]) => ({
      name: option,
      cost,
    })),
    wargearChecks,
    selected: checked,
    warband,
  };
  const heroWargearCost = calculateHeroWargearPoints(calculationHero);

  // Calculate total warband cost for this hero (including hero, hero wargear, and warriors)
  const totalWarbandCost = calculateWarbandPoints(calculationHero);

  // Preserve the existing row display: this count only includes the warband.
  const totalModelCount = totalWarriors;

  // Toggle hero selection
  const setSelectedHero = () => {
    if (checked && mustBeLeader) {
      return; // Cannot remove required leader
    }
    // Prevent adding independent heroes if already selected elsewhere
    if (!checked && tier === "independent" && isAlreadySelected) {
      return; // Don't allow selection
    }

    if (armyUpdate) {
      armyUpdate((prev) => ({
        ...prev,
        heroes: prev.heroes.map((hero) =>
          hero.name === name ? { ...hero, selected: !hero.selected } : hero,
        ),
      }));
    }
    if (setPoints) {
      setPoints((prevPoints: number) =>
        !checked ? prevPoints + points : Math.max(prevPoints - points, 0),
      );
    }
  };

  const errorColor = useThemeColor({}, "buttonEvil");
  // Toggle wargear for this hero
  const handleToggleWargear = (option: string, cost: number) => {
    if (armyUpdate) {
      armyUpdate((prev) => ({
        ...prev,
        heroes: prev.heroes.map((h) => {
          if (h.name !== name) return h;
          const wasChecked = h.wargearChecks?.[option] ?? false;
          if (setPoints) {
            setPoints((prevPoints: number) =>
              !wasChecked
                ? prevPoints + (cost || 0)
                : Math.max(prevPoints - (cost || 0), 0),
            );
          }
          return {
            ...h,
            wargearChecks: {
              ...h.wargearChecks,
              [option]: !wasChecked,
            },
          };
        }),
      }));
    }
  };

  // Toggle warrior wargear for this hero's warband
  const handleToggleWarriorWargear = (
    warriorIdx: number,
    option: string,
    cost: number,
    delta: number,
  ) => {
    if (delta > 0 && totalWarriors >= warbandCap) return;

    // Check bow limit before adding
    if (delta > 0 && army && option.toLowerCase().includes("bow")) {
      const totalBows = calculateBowCount(army);
      const totalModels = calculateModelCount(army);

      const bowLimit = Math.floor(totalModels / 3);
      if (totalBows >= bowLimit) {
        // Show toast
        const message = `Bow limit reached (${bowLimit})! You cannot add more bows.`;
        if (Platform.OS === "android") {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert("Bow Limit", message);
        }
        return;
      }
    }

    if (armyUpdate) {
      armyUpdate((prev) => ({
        ...prev,
        heroes: prev.heroes.map((h) => {
          if (h.name !== name) return h;
          return {
            ...h,
            warband: h.warband.map((w, idx) => {
              if (idx !== warriorIdx) return w;
              const prevCount = w.wargearCounts?.[option] || 0;
              const newCount = Math.max(prevCount + delta, 0);
              const totalCostPerInstance =
                (w.baseCost || 0) + (option === "Base" ? 0 : cost || 0);
              if (setPoints) {
                setPoints(
                  (prevPoints: number) =>
                    prevPoints + (newCount - prevCount) * totalCostPerInstance,
                );
              }
              return {
                ...w,
                wargearCounts: {
                  ...w.wargearCounts,
                  [option]: newCount,
                },
              };
            }),
          };
        }),
      }));
    }
  };

  return (
    <>
      {!checked ? (
        <ListItem
          containerStyle={{
            backgroundColor,
            borderColor,
            borderWidth: 1,
            borderRadius: 8,
            marginVertical: 5,
            minHeight: 64,
          }}
        >
          <ListItem.Content>
            <ListItem.Title
              style={{ color: textColor, fontFamily: "brioso", fontSize: 20 }}
            >
              {name}{" "}
              <ListItem.Subtitle
                style={{
                  color: textColor,
                  fontWeight: "normal",
                  fontFamily: "brioso",
                  fontSize: 20,
                }}
              >
                ({tierLabel})
                {warbandNumber ? ` • Warband ${warbandNumber}` : ""}
                {/* Only show model count and warband pts if hero is bought */}
                {/* (not checked means not bought, so don't show model count or warband pts) */}
              </ListItem.Subtitle>
            </ListItem.Title>
            <ListItem.Subtitle
              style={{ color: textColor, fontFamily: "brioso", fontSize: 16 }}
            >
              {points} pts
            </ListItem.Subtitle>
          </ListItem.Content>
          <Button
            title="Add hero"
            onPress={setSelectedHero}
            disabled={!checked && tier === "independent" && isAlreadySelected}
            buttonStyle={{
              backgroundColor:
                !checked && tier === "independent" && isAlreadySelected
                  ? "#888"
                  : buttonColor,
              minHeight: 44,
              minWidth: 88,
              paddingHorizontal: 12,
            }}
            titleStyle={{ fontSize: 16, color: buttonTextColor }}
          />
        </ListItem>
      ) : (
        <View>
          <ListItem.Accordion
            containerStyle={{
              backgroundColor: selectedColor,
              borderColor,
              borderWidth: 2,
              borderRadius: 8,
              marginTop: 5,
              minHeight: 68,
            }}
            content={
              <ListItem.Content>
                <ListItem.Title
                  style={{
                    color: selectedTextColor,
                    fontFamily: "brioso",
                    fontSize: 20,
                  }}
                >
                  {name}{" "}
                  <ListItem.Subtitle
                    style={{
                      color: selectedTextColor,
                      fontWeight: "normal",
                      fontFamily: "brioso",
                      fontSize: 20,
                    }}
                  >
                    ({tierLabel})
                    {warbandNumber ? ` • Warband ${warbandNumber}` : ""}
                    {` • ${totalModelCount} models`}
                    {totalWarbandCost > 0 ? ` • ${totalWarbandCost} pts` : ""}
                  </ListItem.Subtitle>
                </ListItem.Title>
                <ListItem.Subtitle
                  style={{
                    color: selectedTextColor,
                    fontFamily: "brioso",
                    fontSize: 20,
                  }}
                >
                  {/* {points} pts */}
                  {heroWargearCost > 0
                    ? ` • ${heroWargearCost} pts wargear`
                    : ""}
                </ListItem.Subtitle>
                <ListItem.Subtitle
                  style={{
                    color: selectedTextColor,
                    fontFamily: "briosoBold",
                    fontSize: 16,
                    marginTop: 4,
                  }}
                >
                  {expanded ? "Collapse details" : "Expand details"}
                </ListItem.Subtitle>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => setExpanded(!expanded)}
            noIcon
          >
            <View
              style={{
                backgroundColor,
                borderColor,
                borderWidth: 1,
                borderTopWidth: 0,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
            {/* Remove hero button */}
            <Button
              title={mustBeLeader ? "Leader Required" : "Remove Hero"}
              type="solid"
              titleStyle={{
                color: buttonTextColor,
                fontSize: 18,
                fontFamily: "brioso",
              }}
              onPress={setSelectedHero}
              disabled={mustBeLeader}
              buttonStyle={{
                backgroundColor: mustBeLeader ? "#767676" : errorColor,
                minHeight: 44,
                paddingHorizontal: 12,
              }}
            />
            {/* Hero wargear buttons inside the accordion */}
            <View style={{ marginTop: 12, marginBottom: 8, gap: 8 }}>
              {wargear?.map(([option, cost], index) => (
                <Button
                  key={option + index} // <-- Use option as key if unique
                  title={`${option} (${cost} pts)`}
                  onPress={() => handleToggleWargear(option, cost)}
                  buttonStyle={{
                    backgroundColor: wargearChecks[option]
                      ? errorColor
                      : buttonColor,
                    borderColor,
                    borderWidth: wargearChecks[option] ? 2 : 1,
                    minHeight: 44,
                    paddingHorizontal: 12,
                  }}
                  titleStyle={{
                    fontSize: 18,
                    fontFamily: "brioso",
                    color: wargearChecks[option]
                      ? errorTextColor
                      : textColor,
                  }}
                />
              ))}
            </View>
            {/* Only show warband units if hero is not independent (can actually lead troops) */}
            {tier !== "independent" && (
              <View style={{ marginTop: 8, gap: 10 }}>
                {warband.map((warrior, warriorIdx) => (
                  <View
                    style={{ width: "100%" }}
                    key={warrior.name + "-" + warriorIdx}
                  >
                    <Warrior
                      name={warrior.name}
                      key={`${warrior.name}-${warriorIdx}`}
                      baseCost={warrior.baseCost}
                      wargear={[...warrior.availableWargear]
                        .sort((a, b) => {
                          const aIsBanner = a.name
                            .toLowerCase()
                            .includes("banner");
                          const bIsBanner = b.name
                            .toLowerCase()
                            .includes("banner");

                          // Banners always go last
                          if (aIsBanner && !bIsBanner) return 1;
                          if (!aIsBanner && bIsBanner) return -1;

                          // Otherwise sort by cost (cheapest first)
                          return a.cost - b.cost;
                        })
                        .map((wg): [string, number] => [wg.name, wg.cost])}
                      wargearCounts={warrior.wargearCounts}
                      canAddWarrior={totalWarriors < warbandCap}
                      onToggleWargear={(option, cost, delta) =>
                        handleToggleWarriorWargear(
                          warriorIdx,
                          option,
                          cost,
                          delta,
                        )
                      }
                    />
                  </View>
                ))}
              </View>
            )}
            </View>
          </ListItem.Accordion>
        </View>
      )}
    </>
  );
}

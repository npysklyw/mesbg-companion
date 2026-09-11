import { useThemeColor } from "@/hooks/useThemeColor";
import { Button, ListItem } from "@rneui/base";
import React from "react";
import { Alert, Platform, ToastAndroid, View } from "react-native";
import { Warrior } from "./Warrior";

type WargearOption = { name: string; cost: number };
type WarriorState = {
  name: string;
  baseCost: number;
  availableWargear: WargearOption[];
  wargearCounts: Record<string, number>;
};
type ArmyHeroState = {
  name: string;
  selected: boolean;
  wargearChecks: Record<string, boolean>;
  warband: WarriorState[];
};
type ArmyState = { heroes: ArmyHeroState[] };
type ArmyUpdater = (updater: (previous: ArmyState) => ArmyState) => void;

type HeroProps = {
  name: string;
  points?: number;
  wargear?: [string, number][];
  checked?: boolean;
  wargearChecks?: { [option: string]: boolean };
  armyUpdate?: ArmyUpdater;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  warbandNumber?: number | null;
  tier?: "legend" | "valour" | "fortitude" | "independent";
  mustBeLeader?: boolean;
  warband: WarriorState[];
  isAlreadySelected?: boolean; // For independent heroes
  army?: ArmyState | null; // For bow limit calculations
};

type WargearCounts = Record<string, number>;

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
  const [expanded, setExpanded] = React.useState(false);

  const tierLabels = {
    legend: "Legend",
    valour: "Valour",
    fortitude: "Fortitude",
    minor: "Minor",
    independent: "Independent",
  };
  const tierCaps = {
    legend: 18,
    valour: 15,
    fortitude: 12,
    minor: 6,
    independent: 0,
  };
  const tierLabel = tierLabels[tier];
  const warbandCap = tierCaps[tier];

  // Calculate total warriors in this hero's warband
  const totalWarriors = warband
    ? warband.reduce(
        (sum, w) =>
          sum +
          Object.values((w.wargearCounts || {}) as WargearCounts).reduce(
            (a, b) => a + b,
            0,
          ),
        0,
      )
    : 0;

  // Calculate hero's wargear cost
  const heroWargearCost = wargear
    ? wargear.reduce(
        (sum, [option, cost]) => sum + (wargearChecks[option] ? cost || 0 : 0),
        0,
      )
    : 0;

  // Calculate total warband cost for this hero (including hero, hero wargear, and warriors)
  const totalWarbandCost =
    points +
    heroWargearCost +
    (warband
      ? warband.reduce((sum, w) => {
          let cost = 0;
          if (w.availableWargear && w.availableWargear.length > 0) {
            cost += (w.wargearCounts?.Base || 0) * (w.baseCost || 0);
            w.availableWargear.forEach((wg) => {
              cost +=
                (w.wargearCounts?.[wg.name] || 0) *
                ((w.baseCost || 0) + (wg.cost || 0));
            });
          } else {
            cost += (w.wargearCounts?.Base || 0) * (w.baseCost || 0);
          }
          return sum + cost;
        }, 0)
      : 0);

  // Model count: 1 for hero + all warriors
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
      // Calculate current total bows in army
      let totalBows = 0;
      if (army.heroes) {
        army.heroes.forEach((h) => {
          if (h.selected && h.warband) {
            h.warband.forEach((w) => {
              if (w.wargearCounts) {
                Object.keys(w.wargearCounts).forEach((wgName) => {
                  if (wgName.toLowerCase().includes("bow")) {
                    totalBows += w.wargearCounts[wgName] || 0;
                  }
                });
              }
            });
          }
        });
      }

      // Calculate total models
      let totalModels = 0;
      if (army.heroes) {
        army.heroes.forEach((h) => {
          if (h.selected) {
            totalModels += 1; // Hero counts
            if (h.warband) {
              h.warband.forEach((w) => {
                if (w.wargearCounts) {
                  totalModels += Object.values(
                    w.wargearCounts as WargearCounts,
                  ).reduce(
                    (a, b) => a + b,
                    0,
                  );
                }
              });
            }
          }
        });
      }

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
        <ListItem containerStyle={{ backgroundColor }}>
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
            title={checked ? "-" : "+"}
            onPress={setSelectedHero}
            disabled={!checked && tier === "independent" && isAlreadySelected}
            buttonStyle={{
              backgroundColor:
                !checked && tier === "independent" && isAlreadySelected
                  ? "#888"
                  : buttonColor,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
            titleStyle={{ fontSize: 16, color: buttonTextColor }}
          />
        </ListItem>
      ) : (
        <View>
          <ListItem.Accordion
            containerStyle={{ backgroundColor }}
            content={
              <ListItem.Content>
                <ListItem.Title
                  style={{
                    color: textColor,
                    fontFamily: "brioso",
                    fontSize: 20,
                  }}
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
                    {` • ${totalModelCount} models`}
                    {totalWarbandCost > 0 ? ` • ${totalWarbandCost} pts` : ""}
                  </ListItem.Subtitle>
                </ListItem.Title>
                <ListItem.Subtitle
                  style={{
                    color: textColor,
                    fontFamily: "brioso",
                    fontSize: 20,
                  }}
                >
                  {/* {points} pts */}
                  {heroWargearCost > 0
                    ? ` • ${heroWargearCost} pts wargear`
                    : ""}
                </ListItem.Subtitle>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => setExpanded(!expanded)}
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
                backgroundColor: mustBeLeader ? "#888" : buttonColor,

                marginTop: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            />
            {/* Hero wargear buttons inside the accordion */}
            <View style={{ marginLeft: 5, marginBottom: 8 }}>
              {wargear?.map(([option, cost], index) => (
                <Button
                  key={option + index} // <-- Use option as key if unique
                  title={`${option} (${cost} pts)`}
                  onPress={() => handleToggleWargear(option, cost)}
                  buttonStyle={{
                    backgroundColor: wargearChecks[option]
                      ? errorColor
                      : buttonColor,
                    marginVertical: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  titleStyle={{
                    fontSize: 18,
                    fontFamily: "brioso",
                    color: buttonTextColor,
                  }}
                />
              ))}
            </View>
            {/* Only show warband units if hero is not independent (can actually lead troops) */}
            {tier !== "independent" && (
              <View style={{ marginLeft: 5 }}>
                {warband.map((warrior, warriorIdx) => (
                  <View
                    style={{ marginLeft: 16 }}
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
          </ListItem.Accordion>
        </View>
      )}
    </>
  );
}

import { useThemeColor } from "@/hooks/useThemeColor";
import { Button, ListItem } from "@rneui/base";
import React from "react";
import { View } from "react-native";
import { Warrior } from "./Warrior";

// Define the props type
type WarbandOption = {
  name: string;
  availableWargear: { name: string; cost: number }[];
  wargearCounts?: { [option: string]: number };
  baseCost?: number;
};

type Army = {
  warbandOptions?: WarbandOption[];
  heroes?: any[];
};

type HeroProps = {
  name: string;
  points?: number;
  wargear?: [string, number][];
  checked?: boolean;
  wargearChecks?: { [option: string]: boolean };
  armyUpdate?: (army: any) => void;
  setPoints?: React.Dispatch<React.SetStateAction<number>>;
  warbandNumber?: number | null;
  tier?: "legend" | "valour" | "fortitude";
  warband: any[]; // <-- pass the hero's own warband
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
  warband,
}: HeroProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const [expanded, setExpanded] = React.useState(false);

  const tierLabels = {
    legend: "Legend",
    valour: "Valour",
    fortitude: "Fortitude",
  };
  const tierCaps = { legend: 18, valour: 15, fortitude: 12 };
  const tierLabel = tierLabels[tier];
  const warbandCap = tierCaps[tier];

  // Calculate total warriors in this hero's warband
  const totalWarriors = warband
    ? warband.reduce(
        (sum, w) =>
          sum + Object.values(w.wargearCounts || {}).reduce((a, b) => a + b, 0),
        0
      )
    : 0;

  // Calculate hero's wargear cost
  const heroWargearCost = wargear
    ? wargear.reduce(
        (sum, [option, cost]) => sum + (wargearChecks[option] ? cost || 0 : 0),
        0
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
            w.availableWargear.forEach((wg: any) => {
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
  const totalModelCount = 1 + totalWarriors;

  // Toggle hero selection
  const setSelectedHero = () => {
    if (armyUpdate) {
      armyUpdate((prev: { heroes: any[] }) => ({
        ...prev,
        heroes: prev.heroes.map((hero) =>
          hero.name === name ? { ...hero, selected: !hero.selected } : hero
        ),
      }));
    }
    if (setPoints) {
      setPoints((prevPoints: number) =>
        !checked ? prevPoints + points : Math.max(prevPoints - points, 0)
      );
    }
  };

  // Toggle wargear for this hero
  const handleToggleWargear = (option: string, cost: number) => {
    if (armyUpdate) {
      armyUpdate((prev: { heroes: any[] }) => ({
        ...prev,
        heroes: prev.heroes.map((h) => {
          if (h.name !== name) return h;
          const wasChecked = h.wargearChecks?.[option] ?? false;
          if (setPoints) {
            setPoints((prevPoints: number) =>
              !wasChecked
                ? prevPoints + (cost || 0)
                : Math.max(prevPoints - (cost || 0), 0)
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
    delta: number
  ) => {
    if (delta > 0 && totalWarriors >= warbandCap) return;
    if (armyUpdate) {
      armyUpdate((prev: { heroes: any[] }) => ({
        ...prev,
        heroes: prev.heroes.map((h) => {
          if (h.name !== name) return h;
          return {
            ...h,
            warband: h.warband.map((w: any, idx: number) => {
              if (idx !== warriorIdx) return w;
              const prevCount = w.wargearCounts?.[option] || 0;
              const newCount = Math.max(prevCount + delta, 0);
              const totalCostPerInstance =
                (w.baseCost || 0) + (option === "Base" ? 0 : cost || 0);
              if (setPoints) {
                setPoints(
                  (prevPoints: number) =>
                    prevPoints + (newCount - prevCount) * totalCostPerInstance
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
            <ListItem.Title style={{ color: textColor }}>
              {name}{" "}
              <ListItem.Subtitle
                style={{ color: textColor, fontWeight: "normal" }}
              >
                ({tierLabel})
                {warbandNumber ? ` • Warband ${warbandNumber}` : ""}
                {/* Only show model count and warband pts if hero is bought */}
                {/* (not checked means not bought, so don't show model count or warband pts) */}
              </ListItem.Subtitle>
            </ListItem.Title>
            <ListItem.Subtitle style={{ color: textColor }}>
              {points} pts
            </ListItem.Subtitle>
          </ListItem.Content>
          <Button
            title={checked ? "-" : "+"}
            onPress={setSelectedHero}
            buttonStyle={{
              backgroundColor: checked ? "#c00" : "#080",
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
            titleStyle={{ fontSize: 14 }}
          />
        </ListItem>
      ) : (
        <View>
          <ListItem.Accordion
            containerStyle={{ backgroundColor }}
            content={
              <ListItem.Content>
                <ListItem.Title style={{ color: textColor }}>
                  {name}{" "}
                  <ListItem.Subtitle
                    style={{ color: textColor, fontWeight: "normal" }}
                  >
                    ({tierLabel})
                    {warbandNumber ? ` • Warband ${warbandNumber}` : ""}
                    {` • ${totalModelCount} models`}
                    {totalWarbandCost > 0 ? ` • ${totalWarbandCost} pts` : ""}
                  </ListItem.Subtitle>
                </ListItem.Title>
                <ListItem.Subtitle style={{ color: textColor }}>
                  {points} pts
                  {heroWargearCost > 0
                    ? ` • ${heroWargearCost} pts wargear`
                    : ""}
                </ListItem.Subtitle>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => setExpanded(!expanded)}
          >
            {/* Hero wargear buttons inside the accordion */}
            <View style={{ marginLeft: 5, marginBottom: 8 }}>
              {wargear?.map(([option, cost], index) => (
                <Button
                  key={option + "-" + index}
                  title={`${option} (${cost} pts)`}
                  onPress={() => handleToggleWargear(option, cost)}
                  buttonStyle={{
                    backgroundColor: wargearChecks[option] ? "#c00" : "#080",
                    marginVertical: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  titleStyle={{ fontSize: 14 }}
                />
              ))}
            </View>
            <View style={{ marginLeft: 5 }}>
              {warband.map((warrior, warriorIdx) => (
                <View style={{ marginLeft: 16 }} key={warrior.name}>
                  <Warrior
                    name={warrior.name}
                    baseCost={warrior.baseCost}
                    wargear={warrior.availableWargear.map((wg: any) => [
                      wg.name,
                      wg.cost,
                    ])}
                    wargearCounts={warrior.wargearCounts}
                    canAddWarrior={totalWarriors < warbandCap}
                    onToggleWargear={(option, cost, delta) =>
                      handleToggleWarriorWargear(
                        warriorIdx,
                        option,
                        cost,
                        delta
                      )
                    }
                  />
                </View>
              ))}
            </View>
            {/* Remove hero button */}
            <Button
              title="-"
              onPress={setSelectedHero}
              buttonStyle={{
                backgroundColor: "#c00",
                marginTop: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
              titleStyle={{ fontSize: 14 }}
            />
          </ListItem.Accordion>
        </View>
      )}
    </>
  );
}

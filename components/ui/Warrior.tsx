import { useThemeColor } from "@/hooks/useThemeColor";
import { ListItem } from "@rneui/base";
import { ListItemButtonGroup } from "@rneui/base/dist/ListItem/ListItem.ButtonGroup";
import { Text } from "@rneui/themed";
import React from "react";

type WarriorProps = {
  name: string;
  wargear?: [string, number][];
  wargearCounts: { [option: string]: number };
  canAddWarrior: boolean;
  onToggleWargear: (option: string, cost: number, delta: number) => void;
  baseCost: number;
};

export function Warrior({
  name,
  wargear,
  wargearCounts,
  canAddWarrior,
  onToggleWargear,
  baseCost,
}: WarriorProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // Calculate total count for this warrior type (sum all wargearCounts)
  const totalCount = Object.values(wargearCounts || {}).reduce(
    (a, b) => a + b,
    0
  );

  // Calculate total cost for this warrior group
  let totalCost = 0;
  if (wargear && wargear.length > 0) {
    totalCost += (wargearCounts["Base"] || 0) * baseCost;
    wargear.forEach(([option, cost]) => {
      totalCost += (wargearCounts[option] || 0) * (baseCost + (cost || 0));
    });
  } else {
    totalCost = (wargearCounts["Base"] || 0) * baseCost;
  }

  return (
    <React.Fragment>
      {/* Title row */}
      <ListItem
        containerStyle={{
          backgroundColor,
          paddingVertical: 6,
          paddingHorizontal: 12,
          minHeight: 32,
        }}
      >
        <ListItem.Content
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <ListItem.Title style={{ color: textColor, fontSize: 16 }}>
            {name}
            <Text
              style={{ color: textColor, fontWeight: "normal", fontSize: 14 }}
            >
              {totalCount > 0
                ? ` • ${totalCount} miniature${totalCount === 1 ? "" : "s"}`
                : ""}
              {totalCount > 0 ? ` • ${totalCost} pts` : ""}
            </Text>
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>

      {/* Base option */}
      <ListItem
        containerStyle={{
          backgroundColor,
          paddingVertical: 4,
          paddingHorizontal: 24,
          minHeight: 28,
        }}
      >
        <ListItem.Content
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <ListItem.Title style={{ color: textColor, fontSize: 14, flex: 1 }}>
            Base
          </ListItem.Title>
          <ListItem.Subtitle
            style={{ color: textColor, fontSize: 13, marginRight: 8 }}
          >
            {baseCost} pts
          </ListItem.Subtitle>
          <Text style={{ color: textColor, width: 18, textAlign: "center" }}>
            {wargearCounts["Base"] || 0}
          </Text>
          <ListItemButtonGroup
            onPress={(action) => {
              if (action === 0 && canAddWarrior) {
                onToggleWargear("Base", 0, 1);
              } else if (action === 1) {
                onToggleWargear("Base", 0, -1);
              }
            }}
            buttons={[
              {
                element: () => (
                  <Text
                    style={{
                      opacity: canAddWarrior ? 1 : 0.3,
                      color: textColor,
                      fontSize: 18,
                    }}
                  >
                    +
                  </Text>
                ),
                disabled: !canAddWarrior,
              },
              {
                element: () => (
                  <Text style={{ color: textColor, fontSize: 18 }}>-</Text>
                ),
              },
            ]}
            containerStyle={{ marginLeft: 8, height: 28 }}
            buttonStyle={{ paddingHorizontal: 8, height: 28 }}
          />
        </ListItem.Content>
      </ListItem>

      {/* Wargear options */}
      {wargear &&
        wargear.length > 0 &&
        wargear.map(([option, cost], index) => (
          <ListItem
            key={option + "-" + index}
            containerStyle={{
              backgroundColor,
              paddingVertical: 4,
              paddingHorizontal: 24,
              minHeight: 28,
            }}
          >
            <ListItem.Content
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <ListItem.Title
                style={{ color: textColor, fontSize: 14, flex: 1 }}
              >
                {option}
              </ListItem.Title>
              <ListItem.Subtitle
                style={{ color: textColor, fontSize: 13, marginRight: 8 }}
              >
                {baseCost + (cost || 0)} pts
              </ListItem.Subtitle>
              <Text
                style={{ color: textColor, width: 18, textAlign: "center" }}
              >
                {wargearCounts[option] || 0}
              </Text>
              <ListItemButtonGroup
                onPress={(action) => {
                  if (action === 0 && canAddWarrior) {
                    onToggleWargear(option, cost, 1);
                  } else if (action === 1) {
                    onToggleWargear(option, cost, -1);
                  }
                }}
                buttons={[
                  {
                    element: () => (
                      <Text
                        style={{
                          opacity: canAddWarrior ? 1 : 0.3,
                          color: textColor,
                          fontSize: 18,
                        }}
                      >
                        +
                      </Text>
                    ),
                    disabled: !canAddWarrior,
                  },
                  {
                    element: () => (
                      <Text style={{ color: textColor, fontSize: 18 }}>-</Text>
                    ),
                  },
                ]}
                containerStyle={{ marginLeft: 8, height: 28 }}
                buttonStyle={{ paddingHorizontal: 8, height: 28 }}
              />
            </ListItem.Content>
          </ListItem>
        ))}
    </React.Fragment>
  );
}

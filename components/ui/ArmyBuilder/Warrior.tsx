import { useThemeColor } from "@/hooks/useThemeColor";
import { Text } from "@rneui/themed";
import React from "react";
import { Pressable, View } from "react-native";

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
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const buttonColor = useThemeColor({}, "button");
  const borderColor = useThemeColor({}, "tint");
  const buttonEvil = useThemeColor({}, "buttonEvil");
  const buttonEvilText = useThemeColor({}, "buttonEvilText");
  const [expanded, setExpanded] = React.useState(false);

  const totalCount = Object.values(wargearCounts || {}).reduce(
    (a, b) => a + b,
    0,
  );

  let totalCost = 0;
  if (wargear && wargear.length > 0) {
    totalCost += (wargearCounts["Base"] || 0) * baseCost;
    wargear.forEach(([option, cost]) => {
      totalCost += (wargearCounts[option] || 0) * (baseCost + (cost || 0));
    });
  } else {
    totalCost = (wargearCounts["Base"] || 0) * baseCost;
  }

  const selectedWargearSummary = wargear
    ? wargear
        .filter(([option]) => (wargearCounts[option] || 0) > 0)
        .map(([option]) => option)
        .join(", ")
    : "";

  const baseCount = wargearCounts["Base"] || 0;
  const hasUpgrades = wargear?.some(([, cost]) => (cost || 0) > 0) ?? false;
  const optionCards = [
    ...(!hasUpgrades && baseCount > 0
      ? [
          {
            option: "Base",
            label: "Base",
            cost: baseCost,
            count: baseCount,
            extraCost: 0,
          },
        ]
      : []),
    ...(wargear
      ? wargear
          .map(([option, cost]) => ({
            option,
            label: option,
            cost: baseCost + (cost || 0),
            count: wargearCounts[option] || 0,
            extraCost: cost || 0,
          }))
          .filter((item) => item.count > 0)
      : []),
  ];

  return (
    <View
      style={{
        backgroundColor: buttonColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: textColor, fontSize: 18, fontFamily: "brioso" }}>
          {name}
        </Text>
        <Text
          style={{
            color: textColor,
            fontSize: 18,
            fontFamily: "brioso",
            marginLeft: "auto",
          }}
        >
          {totalCost} pts
        </Text>
      </View>
      <Text
        style={{
          color: textColor,
          fontSize: 16,
          fontFamily: "brioso",
          marginTop: 4,
        }}
      >
        {selectedWargearSummary.length > 0
          ? selectedWargearSummary
          : totalCount > 0
            ? "Base only"
            : "No models added"}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: textColor, fontSize: 16, fontFamily: "brioso" }}>
          {totalCount} model{totalCount === 1 ? "" : "s"}
        </Text>
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={{
            backgroundColor: buttonEvil,
            paddingHorizontal: 12,
            minHeight: 44,
            borderRadius: 6,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: buttonEvilText, fontSize: 16 }}>
            {expanded ? "Hide Gear" : "Configure Gear"}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 8, gap: 8 }}>
        {optionCards.map((card) => (
          <View
            key={card.option}
            style={{
              backgroundColor,
              borderColor,
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{ color: textColor, fontSize: 16, fontFamily: "brioso" }}
              >
                {card.label}
              </Text>
              <Text
                style={{
                  color: textColor,
                  fontSize: 16,
                  fontFamily: "brioso",
                  marginLeft: "auto",
                }}
              >
                {card.cost} pts
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.12)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: textColor,
                    fontSize: 14,
                    fontFamily: "brioso",
                  }}
                >
                  Qty {card.count}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  disabled={!canAddWarrior}
                  accessibilityRole="button"
                  accessibilityLabel={`Add one ${card.label}`}
                  onPress={() => {
                    if (canAddWarrior) {
                    onToggleWargear(
                      card.option,
                      card.option === "Base" ? 0 : card.extraCost || 0,
                      1,
                    );
                    }
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: buttonEvil,
                    borderRadius: 6,
                    minHeight: 44,
                    minWidth: 76,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !canAddWarrior ? 0.45 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: buttonEvilText, fontSize: 16 }}>
                    Add one
                  </Text>
                </Pressable>
                <Pressable
                  disabled={card.count === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove one ${card.label}`}
                  onPress={() =>
                    onToggleWargear(
                      card.option,
                      card.option === "Base" ? 0 : card.extraCost || 0,
                      -1,
                    )
                  }
                  style={({ pressed }) => ({
                    backgroundColor: buttonEvil,
                    borderRadius: 6,
                    minHeight: 44,
                    minWidth: 92,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: card.count === 0 ? 0.45 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: buttonEvilText, fontSize: 16 }}>
                    Remove one
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>

      {expanded && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {!hasUpgrades && (
            <Pressable
              onPress={() => {
                if (canAddWarrior) onToggleWargear("Base", 0, 1);
              }}
              style={{
                backgroundColor: buttonEvil,
                paddingHorizontal: 12,
                minHeight: 44,
                borderRadius: 6,
                justifyContent: "center",
                opacity: canAddWarrior ? 1 : 0.5,
              }}
            >
              <Text style={{ color: buttonEvilText, fontSize: 16 }}>
                Add Base Model (+{baseCost} pts)
              </Text>
            </Pressable>
          )}

          {wargear &&
            wargear
              .filter(([, cost]) => (cost || 0) > 0)
              .map(([option, cost]) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    if (canAddWarrior) onToggleWargear(option, cost, 1);
                  }}
                  style={{
                    backgroundColor: buttonEvil,
                    paddingHorizontal: 12,
                    minHeight: 44,
                    borderRadius: 6,
                    justifyContent: "center",
                    opacity: canAddWarrior ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: buttonEvilText, fontSize: 16 }}>
                    Add {option} (+{baseCost + (cost || 0)} pts)
                  </Text>
                </Pressable>
              ))}
        </View>
      )}
    </View>
  );
}

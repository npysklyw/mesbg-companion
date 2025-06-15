import { useThemeColor } from "@/hooks/useThemeColor";
import { ListItem } from "@rneui/base";
import React from "react";
import { View } from "react-native";
import { Warrior } from "./Warrior";

// Define the props type
type HeroProps = {
  name: string;
  points?: number;
  wargear?: [string, number][];
  checked?: boolean;
  wargearChecks?: { [option: string]: boolean };
  onToggleChecked?: () => void;
  onToggleWargear?: (option: string) => void;
  // ...other props
};

export function Hero({
  name,
  points,
  wargear,
  checked = false,
  wargearChecks = {},
  onToggleChecked,
  onToggleWargear,
}: // ...other props
HeroProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <>
      {!checked ? (
        <ListItem containerStyle={{ backgroundColor }}>
          <ListItem.Content>
            <ListItem.Title style={{ color: textColor }}>{name}</ListItem.Title>
            <ListItem.Subtitle style={{ color: textColor }}>
              {points} pts
            </ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.CheckBox
            checked={checked}
            containerStyle={{ backgroundColor }}
            onPress={onToggleChecked}
          />
        </ListItem>
      ) : (
        <View>
          <ListItem.Accordion
            containerStyle={{ backgroundColor }}
            content={
              <ListItem.Content>
                <ListItem.Title style={{ color: textColor }}>
                  {name}
                </ListItem.Title>
                <ListItem.Subtitle style={{ color: textColor }}>
                  {points} pts
                </ListItem.Subtitle>
                <ListItem.CheckBox
                  containerStyle={{ backgroundColor }}
                  onPress={onToggleChecked}
                  checked={checked}
                  title={"Remove Hero"}
                />
                {wargear?.map(([option, cost], index) => (
                  <ListItem.CheckBox
                    key={option + "-" + index}
                    title={`${option} - ${cost} pts`}
                    checked={wargearChecks[option]}
                    onPress={() => onToggleWargear?.(option)}
                    containerStyle={{
                      backgroundColor: "transparent",
                      marginLeft: 0,
                      marginVertical: 4,
                    }}
                  />
                ))}
              </ListItem.Content>
            }
            isExpanded={true}
            onPress={() => {}}
          >
            <View style={{ marginLeft: 8 }}>
              <ListItem>
                <ListItem.Content>
                  <ListItem.Title>Warband 1</ListItem.Title>
                </ListItem.Content>
              </ListItem>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Warrior
                name="Minas Tirith Warrior"
                wargear={[
                  ["shield", 1],
                  ["shield and spear", 2],
                  ["bow", 1],
                ]}
              />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Warrior name="Ithilien Ranger" wargear={[["spear", 1]]} />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Warrior name="Gondor Cavalry" />
            </View>
          </ListItem.Accordion>
        </View>
      )}
    </>
  );
}

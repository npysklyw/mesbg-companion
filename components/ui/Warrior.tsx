import { useThemeColor } from "@/hooks/useThemeColor"; // Define the props type
import { ListItem } from "@rneui/base";
import { ListItemButtonGroup } from "@rneui/base/dist/ListItem/ListItem.ButtonGroup";
import React from "react";
type WarriorProps = {
  name: string;
  wargear?: [string, number][];
};

export function Warrior({ name, wargear }: WarriorProps) {
  const [expanded, setExpanded] = React.useState(false);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // State for each wargear option
  const [wargearCounts, setWargearCounts] = React.useState<{
    [key: string]: number;
  }>(() =>
    wargear ? Object.fromEntries(wargear.map(([option]) => [option, 0])) : {}
  );

  // State for base unit count if no wargear
  const [baseCount, setBaseCount] = React.useState(0);

  // Wargear handlers
  const handleWargearButton = (option: string, action: number) => {
    setWargearCounts((prev) => ({
      ...prev,
      [option]: action === 0 ? prev[option] + 1 : Math.max(prev[option] - 1, 0),
    }));
  };

  // Base handlers
  const handleBaseButton = (action: number) => {
    setBaseCount((prev) => (action === 0 ? prev + 1 : Math.max(prev - 1, 0)));
  };

  return (
    <>
      <ListItem.Accordion
        containerStyle={{ backgroundColor }}
        content={
          <ListItem.Content>
            <ListItem.Title style={{ color: textColor }}>{name}</ListItem.Title>
            <ListItem.Subtitle style={{ color: textColor }}>
              9 pts
            </ListItem.Subtitle>
          </ListItem.Content>
        }
        isExpanded={expanded}
        onPress={() => setExpanded(!expanded)}
      >
        {wargear && wargear.length > 0 ? (
          wargear.map(([option, cost], index) => (
            <ListItem
              key={option + "-" + index}
              containerStyle={{
                paddingLeft: 24,
                backgroundColor: backgroundColor,
              }}
            >
              <ListItem.Content>
                <ListItem.Title style={{ color: textColor }}>
                  {option}
                </ListItem.Title>
                <ListItem.Subtitle style={{ color: textColor }}>
                  {cost}
                </ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Subtitle style={{ color: textColor }}>
                {wargearCounts[option]}
              </ListItem.Subtitle>
              <ListItemButtonGroup
                onPress={(action) => handleWargearButton(option, action)}
                buttons={["+", "-"]}
              />
            </ListItem>
          ))
        ) : (
          <ListItem
            containerStyle={{
              paddingLeft: 24,
              backgroundColor: backgroundColor,
            }}
          >
            <ListItem.Content>
              <ListItem.Title style={{ color: textColor }}>Base</ListItem.Title>
              <ListItem.Subtitle style={{ color: textColor }}>
                0
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Subtitle>{baseCount}</ListItem.Subtitle>
            <ListItemButtonGroup
              onPress={handleBaseButton}
              buttons={["+", "-"]}
            />
          </ListItem>
        )}
      </ListItem.Accordion>
    </>
  );
}

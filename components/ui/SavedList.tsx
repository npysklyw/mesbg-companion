import { ListItem } from "@rneui/themed";
import { useRouter } from "expo-router";
import TouchableScale from "react-native-touchable-scale";

import { useThemeColor } from "@/hooks/useThemeColor";

type SavedListProps = {
  name: string;
  points?: number;
  modelCount?: number;
  faction?: string;
};

export default function SavedList({
  name,
  points,
  modelCount,
  faction,
}: SavedListProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <ListItem
      Component={TouchableScale}
      friction={90}
      tension={100}
      activeScale={0.95}
      onPress={() => {
        router.push("/armyBuilder");
      }}
      containerStyle={{ backgroundColor }}
    >
      <ListItem.Content>
        <ListItem.Title style={{ color: textColor }}>{name}</ListItem.Title>
        <ListItem.Subtitle style={{ color: textColor }}>
          {points} pts, {modelCount} models, {faction}
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.ButtonGroup
        onPress={(action) => {
          console.log("Button pressed:", action);
          if (action === 0) {
            // Handle edit action
            router.push("/armyBuilder");
          } else if (action === 1) {
            // Handle delete action
            console.log("Delete action triggered");
          }
        }}
        buttons={["Edit", "Delete"]}
      />
    </ListItem>
  );
}

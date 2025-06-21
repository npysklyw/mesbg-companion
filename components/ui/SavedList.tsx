import { ListItem } from "@rneui/themed";
import TouchableScale from "react-native-touchable-scale";

import { useThemeColor } from "@/hooks/useThemeColor";

type SavedListProps = {
  name: string;
  points?: number;
  modelCount?: number;
  faction?: string;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function SavedList({
  name,
  points,
  modelCount,
  faction,
  onDelete,
  onEdit,
}: SavedListProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <ListItem
      Component={TouchableScale}
      friction={90}
      tension={100}
      activeScale={0.95}
      onPress={onEdit}
      containerStyle={{ backgroundColor }}
    >
      <ListItem.Content>
        <ListItem.Title style={{ color: textColor }}>{name}</ListItem.Title>
        <ListItem.Subtitle style={{ color: textColor }}>
          {points ?? 0} pts &nbsp;|&nbsp; {modelCount ?? 0} models
          {faction ? ` • ${faction}` : ""}
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.ButtonGroup
        onPress={(action) => {
          if (action === 0 && onEdit) onEdit();
          if (action === 1 && onDelete) onDelete();
        }}
        buttons={["Edit", "Delete"]}
      />
    </ListItem>
  );
}

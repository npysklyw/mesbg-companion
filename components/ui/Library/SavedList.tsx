import { ListItem } from "@rneui/themed";
import TouchableScale from "react-native-touchable-scale";
import React from "react";

import { useThemeColor } from "@/hooks/useThemeColor";

type SavedListProps = {
  name: string;
  points?: number;
  modelCount?: number;
  faction?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  edit?: boolean;
};

export default function SavedList({
  name,
  points,
  modelCount,
  faction,
  onDelete,
  onEdit,
  edit = false,
}: SavedListProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor({}, "button");
  const touchableScaleProps = {
    Component: TouchableScale as unknown as typeof React.Component,
    friction: 90,
    tension: 100,
    activeScale: 0.95,
  };

  return (
    <ListItem
      {...touchableScaleProps}
      onPress={onEdit}
      containerStyle={{ backgroundColor }}
    >
      <ListItem.Content>
        <ListItem.Title
          style={{ color: textColor, fontFamily: "brioso", fontSize: 18 }}
        >
          {name}
        </ListItem.Title>
        <ListItem.Subtitle
          style={{ color: textColor, fontFamily: "brioso", fontSize: 18 }}
        >
          {points ?? 0} pts &nbsp;|&nbsp; {modelCount ?? 0} models
          {faction ? ` • ${faction}` : ""}
        </ListItem.Subtitle>
      </ListItem.Content>
      {edit === true ? (
        <ListItem.ButtonGroup
          onPress={(action) => {
            if (action === 0 && onEdit) onEdit();
            if (action === 1 && onDelete) onDelete();
          }}
          buttonStyle={{ backgroundColor: buttonColor }}
          textStyle={{ color: textColor, fontFamily: "brioso", fontSize: 18 }}
          buttons={["Edit", "Delete"]}
        />
      ) : (
        <ListItem.ButtonGroup
          onPress={(action) => {
            if (action === 0 && onEdit) onEdit();
          }}
          buttonStyle={{ backgroundColor: buttonColor }}
          textStyle={{ color: textColor, fontFamily: "brioso", fontSize: 18 }}
          buttons={["Start Match"]}
        />
      )}
    </ListItem>
  );
}

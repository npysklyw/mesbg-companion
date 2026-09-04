import { ListItem } from "@rneui/themed";
import TouchableScale from "react-native-touchable-scale";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

type SavedListProps = {
  name: string;
  points?: number;
  modelCount?: number;
  faction?: string;
  onDelete?: () => void;
  onEdit?: () => void;
  onBackup?: () => void;
  backupLabel?: string;
  edit?: boolean;
};

export default function SavedList({
  name,
  points,
  modelCount,
  faction,
  onDelete,
  onEdit,
  onBackup,
  backupLabel = "Back up",
  edit = false,
}: SavedListProps) {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor({}, "button");
  const destructiveColor = useThemeColor({}, "buttonEvil");
  const destructiveTextColor = useThemeColor({}, "buttonEvilText");
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
      containerStyle={{
        backgroundColor,
        ...(edit ? { flexWrap: "wrap" as const } : {}),
      }}
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
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {[
            { label: "Edit", onPress: onEdit, destructive: false },
            ...(onBackup
              ? [{ label: backupLabel, onPress: onBackup, destructive: false }]
              : []),
            { label: "Delete", onPress: onDelete, destructive: true },
          ].map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => ({
                minHeight: 44,
                minWidth: 72,
                paddingHorizontal: 12,
                borderRadius: 7,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: action.destructive
                  ? destructiveColor
                  : buttonColor,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: action.destructive ? destructiveTextColor : textColor,
                  fontFamily: "brioso",
                  fontSize: 16,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
